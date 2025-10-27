import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const TOKEN_EXPIRES_IN = '7d';

// Enhanced email sender supporting multiple providers
function getTransporter(){
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  
  // If SMTP not configured, try to auto-detect from user's domain
  if (!host || !user || !pass) {
    console.warn('Primary SMTP not configured, using fallback service')
    return createFallbackTransporter()
  }
  
  return nodemailer.createTransport({
    host,
    port: port || 587,
    secure: port === 465,
    auth: { user, pass }
  })
}

// Fallback transporter using Ethereal for testing
function createFallbackTransporter(){
  // In production, you might want to use a service like SendGrid, Mailgun, etc.
  // For now, we'll use Ethereal as fallback for testing
  return null // Will trigger Ethereal creation in sendResetEmail
}

async function sendResetEmail(to, subject, text, html){
  let transporter = getTransporter()
  
  // If no configured transporter, create Ethereal test account
  if (!transporter) {
    console.log('Creating Ethereal test account for email sending...')
    try {
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
      })
      console.log('Ethereal account created:', testAccount.user)
    } catch (err) {
      console.error('Failed to create Ethereal account:', err)
      return false
    }
  }
  
  try{
    const info = await transporter.sendMail({ 
      from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@schoolbus.local', 
      to, 
      subject, 
      text, 
      html 
    })
    
    // If using Ethereal, log the preview URL
    if (info.messageId && info.messageId.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      console.log('📧 Email sent! Preview URL:', previewUrl)
    } else {
      console.log('📧 Email sent successfully to:', to)
    }
    
    return true
  }catch(err){
    console.error('sendResetEmail error', err)
    return false
  }
}

// helper: find user by email
async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0];
}

function sanitizeEmail(email){
  return (email || '').trim().toLowerCase()
}

function isValidEmail(email){
  return /^\S+@\S+\.\S+$/.test(email)
}

function isValidRole(role){
  return ['parent','driver','admin'].includes(role)
}

// register - ADMIN ONLY
router.post('/register', authMiddleware, async (req, res) => {
  try {
    // Only admin can create accounts
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'admin_only' });
    }

    let { email, full_name, phone, role } = req.body;
    console.log('/register body (admin)', { email, full_name, phone, role })
    email = sanitizeEmail(email)
    role = role || 'parent'

    if (!email || !phone) return res.status(400).json({ error: 'email and phone required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });
    if (!isValidRole(role)) return res.status(400).json({ error: 'invalid_role' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'email already in use' });

    // Default password is phone number
    const defaultPassword = phone;
    const hashed = await bcrypt.hash(defaultPassword, 10);
    const id = uuidv4();
    
    try{
      await pool.query(
        'INSERT INTO users (id, role, email, password_hash, full_name, phone, must_change_password) VALUES (?,?,?,?,?,?,TRUE)',
        [id, role, email, hashed, full_name || null, phone]
      );
    }catch(e){
      if (e && e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'email already in use' })
      throw e
    }

    // for drivers, create drivers row (drivers.full_name is NOT NULL in schema)
    if (role === 'driver') {
      const driverId = uuidv4();
      const driverName = full_name || 'Driver';
      await pool.query('INSERT INTO drivers (id, user_id, full_name) VALUES (?,?,?)', [driverId, id, driverName]);
    }

    res.json({ 
      id, 
      email, 
      role, 
      message: 'Account created successfully. Default password is phone number.',
      must_change_password: true 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    console.log('/login body', { email, passwordPresent: !!password })
    email = sanitizeEmail(email)
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    console.log('password compare result', ok)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    // Check if user must change password
    if (user.must_change_password) {
      // Issue a short-lived token to authorize password change
      const tempToken = jwt.sign({ sub: user.id, role: user.role, require_password_change: true }, JWT_SECRET, { expiresIn: '15m' });
      return res.status(200).json({ 
        require_password_change: true,
        user_id: user.id,
        email: user.email,
        token: tempToken,
        message: 'Bạn cần đổi mật khẩu trước khi đăng nhập'
      });
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    res.json({ id: user.id, email: user.email, token, role: user.role, full_name: user.full_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// forgot password -> create request for admin approval
router.post('/forgot-password', async (req, res) => {
  try {
    let { email } = req.body;
    email = sanitizeEmail(email)
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });

    const user = await findUserByEmail(email);
    // Always return success to avoid email enumeration
    if (!user) {
      console.log('forgot-password requested for non-existing email', email)
      return res.json({ success: true, message: 'Nếu email tồn tại, yêu cầu đã được gửi tới admin.' });
    }

    // Only allow parent/driver roles to request password reset
    if (user.role === 'admin') {
      console.log('Admin attempted forgot password:', email)
      return res.json({ success: true, message: 'Nếu email tồn tại, yêu cầu đã được gửi tới admin.' });
    }

    // Check if there's already a pending request
    const [existing] = await pool.query(
      'SELECT * FROM password_reset_requests WHERE user_id = ? AND status = "pending" ORDER BY requested_at DESC LIMIT 1',
      [user.id]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Bạn đã có yêu cầu đang chờ xử lý.' });
    }

    // Create password reset request
    const requestId = uuidv4();
    await pool.query(
      'INSERT INTO password_reset_requests (id, user_id, status) VALUES (?, ?, "pending")',
      [requestId, user.id]
    );

    // Send notification to all admins
    const [admins] = await pool.query('SELECT id FROM users WHERE role = "admin"');
    for (const admin of admins) {
      const notificationId = uuidv4();
      await pool.query(
        'INSERT INTO notifications (id, user_id, title, body, type, priority) VALUES (?, ?, ?, ?, ?, ?)',
        [
          notificationId,
          admin.id,
          'Yêu cầu đặt lại mật khẩu',
          `${user.full_name || user.email} (${user.role}) yêu cầu đặt lại mật khẩu.`,
          'alert',
          'high'
        ]
      );

      // Send real-time notification to admin if online
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${admin.id}`).emit('new_notification', {
          id: notificationId,
          title: 'Yêu cầu đặt lại mật khẩu',
          body: `${user.full_name || user.email} (${user.role}) yêu cầu đặt lại mật khẩu.`,
          type: 'alert',
          priority: 'high',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    return res.json({ 
      success: true, 
      message: 'Yêu cầu đặt lại mật khẩu đã được gửi tới admin. Bạn sẽ nhận được thông báo khi được xử lý.' 
    });
  } catch (err) {
    console.error('forgot-password error', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

// change password (authenticated)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) return res.status(400).json({ error: 'missing_parameters' })
    if (String(new_password).length < 6) return res.status(400).json({ error: 'password_too_short' })

    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE id = ? LIMIT 1', [userId])
    const user = rows[0]
    if (!user) return res.status(404).json({ error: 'not_found' })

    const ok = await bcrypt.compare(current_password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

    const hashed = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?', [hashed, userId])
    return res.json({ success: true })
  } catch (err) {
    console.error('change-password error', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

// change password (public via email + current password)
router.post('/change-password-public', async (req, res) => {
  try {
    let { email, current_password, new_password } = req.body || {}
    email = sanitizeEmail(email)
    if (!email || !current_password || !new_password) return res.status(400).json({ error: 'missing_parameters' })
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' })
    if (String(new_password).length < 6) return res.status(400).json({ error: 'password_too_short' })

    const user = await findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })

    const ok = await bcrypt.compare(current_password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

    const hashed = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?', [hashed, user.id])
    return res.json({ success: true })
  } catch (err) {
    console.error('change-password-public error', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

// auth middleware
export function authMiddleware(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr || !hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_token' });
  const token = hdr.slice(7);
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = { id: data.sub, role: data.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, role, email, full_name, phone, created_at FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Admin: list password reset requests
router.get('/password-reset-requests', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin_only' });
    const status = req.query.status || 'pending';
    const allowed = ['pending','approved','rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'invalid_status' });

    const [rows] = await pool.query(
      `SELECT pr.id, pr.status, pr.requested_at, pr.approved_by, pr.approved_at,
              u.id as user_id, u.email, u.full_name, u.phone, u.role
         FROM password_reset_requests pr
         JOIN users u ON u.id = pr.user_id
        WHERE pr.status = ?
        ORDER BY pr.requested_at DESC
        LIMIT 200`,
      [status]
    );
    res.json({ count: rows.length, requests: rows });
  } catch (err) {
    console.error('list password-reset-requests error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Admin: reject password reset request
router.post('/reject-password-reset', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin_only' });
    const { request_id, notes } = req.body || {};
    if (!request_id) return res.status(400).json({ error: 'missing_request_id' });

    const [requests] = await pool.query(
      'SELECT * FROM password_reset_requests WHERE id = ? AND status = "pending"',
      [request_id]
    );
    if (requests.length === 0) return res.status(404).json({ error: 'request_not_found' });

    await pool.query(
      'UPDATE password_reset_requests SET status = "rejected", approved_by = ?, approved_at = NOW(), notes = ? WHERE id = ?',
      [req.user.id, notes || null, request_id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('reject-password-reset error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// dev-only: list users for debugging
router.get('/debug/users', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end()
  try {
    const [rows] = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 100');
    res.json({ count: rows.length, users: rows });
  } catch (err) {
    console.error('debug/users error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// dev-only: create test user with known password
router.post('/debug/create-test-user', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end()
  try {
    const id = uuidv4();
    const email = 'devuser@example.com'
    const password = 'testpass'
    const hashed = await bcrypt.hash(password, 10)
    try{
      await pool.query('INSERT INTO users (id, role, email, password_hash, full_name) VALUES (?,?,?,?,?)', [id, 'parent', email, hashed, 'Dev User'])
    }catch(e){
      // if exists, update password hash so testpass works
      if (e && e.code === 'ER_DUP_ENTRY'){
        await pool.query('UPDATE users SET password_hash = ?, role = ? WHERE email = ?', [hashed, 'parent', email])
      } else throw e
    }
    res.json({ id, email, password })
  } catch (err) {
    console.error('create-test-user error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// dev-only: create or reset admin user with known password
router.post('/debug/create-admin-user', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end()
  try {
    const email = 'admin@example.com'
    const password = 'adminpass'
    const hashed = await bcrypt.hash(password, 10)
    try{
      const id = uuidv4()
      await pool.query('INSERT INTO users (id, role, email, password_hash, full_name) VALUES (?,?,?,?,?)', [id, 'admin', email, hashed, 'Admin User'])
      return res.json({ id, email, password })
    }catch(e){
      if (e && e.code === 'ER_DUP_ENTRY'){
        // reset password hash and role for existing admin
        await pool.query('UPDATE users SET password_hash = ?, role = ? WHERE email = ?', [hashed, 'admin', email])
        const user = await findUserByEmail(email)
        return res.json({ id: user.id, email, password })
      }
      throw e
    }
  } catch (err) {
    console.error('create-admin-user error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// admin approve password reset request
router.post('/approve-password-reset', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'admin_only' });
    }

    const { request_id } = req.body;
    if (!request_id) return res.status(400).json({ error: 'missing_request_id' });

    // Get the password reset request
    const [requests] = await pool.query(
      'SELECT pr.*, u.email, u.full_name, u.phone, u.role FROM password_reset_requests pr JOIN users u ON pr.user_id = u.id WHERE pr.id = ? AND pr.status = "pending"',
      [request_id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'request_not_found' });
    }

    const request = requests[0];
    const user = {
      id: request.user_id,
      email: request.email,
      full_name: request.full_name,
      phone: request.phone,
      role: request.role
    };

    // Set password to phone number and mark for password change
    const phone = user.phone || ''
    if (!phone) {
      // Fallback: if no phone, generate a 8-char temp password
      const temp = crypto.randomBytes(4).toString('hex')
      const hashedTemp = await bcrypt.hash(temp, 10)
      await pool.query('UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?', [hashedTemp, user.id])
      await pool.query('UPDATE password_reset_requests SET status = "approved", approved_by = ?, approved_at = NOW() WHERE id = ?', [req.user.id, request_id])

      const notificationId = uuidv4();
      await pool.query('INSERT INTO notifications (id, user_id, title, body, type, priority) VALUES (?,?,?,?,?,?)', [
        notificationId,
        user.id,
        'Mật khẩu đã được đặt lại',
        `Mật khẩu tạm thời của bạn là: ${temp}. Vui lòng đăng nhập và đổi mật khẩu.`,
        'info',
        'high'
      ])
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${user.id}`).emit('new_notification', {
          id: notificationId,
          title: 'Mật khẩu đã được đặt lại',
          body: `Mật khẩu tạm thời của bạn là: ${temp}. Vui lòng đăng nhập và đổi mật khẩu.`,
          type: 'info',
          priority: 'high',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      const subject = '✅ Mật khẩu đã được đặt lại - Smart School Bus';
      const text = `\nXin chào ${user.full_name || 'Bạn'},\n\nMật khẩu của bạn đã được đặt lại. Mật khẩu tạm thời: ${temp}\n\nVui lòng đăng nhập và đổi mật khẩu ngay.\n\nTrân trọng,\nĐội ngũ Smart School Bus\n      `
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 0 20px rgba(0,0,0,.1)}.header{background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:#fff;padding:30px;text-align:center}.content{padding:30px}.password-box{background:#d4edda;border:2px solid #28a745;border-radius:8px;padding:20px;text-align:center;margin:20px 0}.password{font-size:24px;font-weight:700;color:#155724;font-family:monospace}.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h1>🚌 Smart School Bus</h1><p>Yêu cầu đã được phê duyệt</p></div><div class="content"><h2>Xin chào ${user.full_name || 'Bạn'}!</h2><p>Mật khẩu của bạn đã được đặt lại.</p><div class="password-box"><p><strong>Mật khẩu tạm thời:</strong></p><div class="password">${temp}</div></div><p>Vui lòng đăng nhập và thay đổi mật khẩu ngay.</p></div><div class="footer">© 2025 Smart School Bus System</div></div></body></html>`
      const sent = await sendResetEmail(user.email, subject, text, html)
      if (!sent) console.warn('Password reset approved (fallback): SMTP not configured or send failed for', user.email)
      return res.json({ success: true, message: 'Đã đặt lại mật khẩu tạm thời và gửi thông báo cho người dùng' })
    }

    const hashedPhone = await bcrypt.hash(phone, 10)
    await pool.query('UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?', [hashedPhone, user.id])
    await pool.query('UPDATE password_reset_requests SET status = "approved", approved_by = ?, approved_at = NOW() WHERE id = ?', [req.user.id, request_id])

    const notificationId = uuidv4();
    await pool.query('INSERT INTO notifications (id, user_id, title, body, type, priority) VALUES (?,?,?,?,?,?)', [
      notificationId,
      user.id,
      'Mật khẩu đã được đặt lại',
      'Mật khẩu của bạn đã được admin đặt lại thành số điện thoại. Vui lòng đăng nhập và đổi mật khẩu.',
      'info',
      'high'
    ])
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${user.id}`).emit('new_notification', {
        id: notificationId,
        title: 'Mật khẩu đã được đặt lại',
        body: 'Mật khẩu của bạn đã được admin đặt lại thành số điện thoại. Vui lòng đăng nhập và đổi mật khẩu.',
        type: 'info',
        priority: 'high',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    const subject = '✅ Mật khẩu đã được đặt lại - Smart School Bus';
    const text = `\nXin chào ${user.full_name || 'Bạn'},\n\nYêu cầu đặt lại mật khẩu của bạn đã được admin phê duyệt.\n\nMật khẩu mới: ${phone}\n\nHướng dẫn:\n1. Đăng nhập bằng mật khẩu mới (số điện thoại)\n2. Hệ thống sẽ yêu cầu bạn đổi mật khẩu ngay\n3. Tạo mật khẩu mới an toàn cho tài khoản\n\nTrân trọng,\nĐội ngũ Smart School Bus\n    `
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 0 20px rgba(0,0,0,.1)}.header{background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:#fff;padding:30px;text-align:center}.content{padding:30px}.password-box{background:#d4edda;border:2px solid #28a745;border-radius:8px;padding:20px;text-align:center;margin:20px 0}.password{font-size:24px;font-weight:700;color:#155724;font-family:monospace}.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h1>🚌 Smart School Bus</h1><p>Yêu cầu đã được phê duyệt</p></div><div class="content"><h2>Xin chào ${user.full_name || 'Bạn'}!</h2><p>Yêu cầu đặt lại mật khẩu của bạn đã được admin phê duyệt.</p><div class="password-box"><p><strong>Mật khẩu tạm thời (số điện thoại):</strong></p><div class="password">${phone}</div></div><p><strong>Hướng dẫn tiếp theo:</strong></p><ol><li>Đăng nhập bằng mật khẩu tạm thời</li><li>Hệ thống sẽ yêu cầu đổi mật khẩu ngay</li><li>Tạo mật khẩu mới an toàn</li></ol></div><div class="footer">© 2025 Smart School Bus System</div></div></body></html>`
    const sent = await sendResetEmail(user.email, subject, text, html)
    if (!sent) console.warn('Password reset approved: SMTP not configured or send failed for', user.email)
    return res.json({ success: true, message: 'Đã phê duyệt yêu cầu và gửi thông báo cho người dùng' })
  } catch (err) {
    console.error('approve-password-reset error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;

// Dev-only: create an Ethereal test account and send a sample email, return preview URL
router.post('/debug/send-test-email', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end()
  try {
    const to = (req.body && req.body.to) ? String(req.body.to).trim() : null
    const testTo = to || process.env.SMTP_TEST_TO || 'example@ethereal.email'
    // create ethereal account
    const account = await nodemailer.createTestAccount()
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    })

    const info = await transporter.sendMail({
      from: `Ethereal Test <${account.user}>`,
      to: testTo,
      subject: 'Test Email from School Bus App (Ethereal)',
      text: 'This is a test email sent using Ethereal (nodemailer).',
      html: '<p>This is a <b>test email</b> sent using Ethereal (nodemailer).</p>'
    })

    const preview = nodemailer.getTestMessageUrl(info)
    res.json({ success: true, preview, account: { user: account.user, pass: account.pass, smtp: account.smtp } })
  } catch (err) {
    console.error('send-test-email error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})
