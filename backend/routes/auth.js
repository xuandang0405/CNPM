import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const TOKEN_EXPIRES_IN = '7d';

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

// register
router.post('/register', async (req, res) => {
  try {
    let { email, password, full_name, phone, role } = req.body;
    console.log('/register body', { email, passwordPresent: !!password, full_name, phone, role })
    email = sanitizeEmail(email)
    role = role || 'parent'

    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });
    if (String(password).length < 6) return res.status(400).json({ error: 'password_too_short' });
    if (!isValidRole(role)) return res.status(400).json({ error: 'invalid_role' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    try{
      await pool.query(
        'INSERT INTO users (id, role, email, password_hash, full_name, phone) VALUES (?,?,?,?,?,?)',
        [id, role, email, hashed, full_name || null, phone || null]
      );
    }catch(e){
      // handle duplicate key gracefully
      if (e && e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'email already in use' })
      throw e
    }

    // for drivers, create drivers row
    if (role === 'driver') {
      const driverId = uuidv4();
      await pool.query('INSERT INTO drivers (id, user_id) VALUES (?,?)', [driverId, id]);
    }

    const token = jwt.sign({ sub: id, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    res.json({ id, email, token, role });
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

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    res.json({ id: user.id, email: user.email, token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

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

export default router;
