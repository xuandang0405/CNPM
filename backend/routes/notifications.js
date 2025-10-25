import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

function authMiddleware(req, res, next) {
    const hdr = req.headers.authorization;
    if (!hdr || !hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_token' });
    const token = hdr.slice(7);
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = { id: data.sub, role: data.role };
        next();
    } catch (e) {
        return res.status(401).json({ error: 'invalid_token' });
    }
}

// ======================= API /api/notifications =======================

// 1. READ: Lấy danh sách notifications cho user hiện tại
// GET /api/notifications
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { read, limit } = req.query;
        const userId = req.user.id;
        
        let query = `
            SELECT n.id, n.user_id, n.sender_id, n.sender_role, n.target_role, 
                   n.title, n.body, n.type, n.priority, n.is_read, n.created_at,
                   u.full_name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = ?`;
        let params = [userId];
        
        if (read !== undefined) {
            if (read === 'true') {
                query += ' AND n.is_read = TRUE';
            } else if (read === 'false') {
                query += ' AND n.is_read = FALSE';
            }
        }
        
        query += ' ORDER BY n.created_at DESC LIMIT ?';
        params.push(parseInt(limit) || 100);
        
        const [notifications] = await pool.query(query, params);
        res.json({ count: notifications.length, notifications });
    } catch (err) {
        console.error('API /notifications GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 2. GET: Lấy unread notifications count
// GET /api/notifications/unread/count
router.get('/unread/count', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({ unread_count: result[0]?.count || 0 });
    } catch (err) {
        console.error('API /notifications/unread/count error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 3. GET single notification
// GET /api/notifications/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [notifications] = await pool.query(`
            SELECT n.id, n.user_id, n.sender_id, n.sender_role, n.target_role, 
                   n.title, n.body, n.type, n.priority, n.is_read, n.created_at,
                   u.full_name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.id = ? AND n.user_id = ? 
            LIMIT 1`,
            [req.params.id, req.user.id]
        );
        
        if (!notifications[0]) return res.status(404).json({ error: 'not_found' });
        res.json(notifications[0]);
    } catch (err) {
        console.error('API /notifications/:id GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 4. CREATE: Tạo notification mới
// POST /api/notifications
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { user_id, target_role, title, body, type, priority } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'required_fields_missing' });
        }
        
        const id = uuidv4();
        await pool.query(
            'INSERT INTO notifications (id, user_id, sender_id, sender_role, target_role, title, body, type, priority) VALUES (?,?,?,?,?,?,?,?,?)',
            [id, user_id || null, req.user.id, req.user.role, target_role || 'all', title, body || '', type || 'info', priority || 'medium']
        );
        
        res.status(201).json({ 
            id, 
            user_id: user_id || null,
            sender_id: req.user.id,
            sender_role: req.user.role,
            target_role: target_role || 'all',
            title, 
            body: body || '', 
            type: type || 'info',
            priority: priority || 'medium',
            is_read: false,
            created_at: new Date()
        });
    } catch (err) {
        console.error('API /notifications POST error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 4b. SEND: Gửi notification từ admin/driver đến parents
// POST /api/notifications/send
router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { title, body, type, priority, target_users, target_role } = req.body;
        
        // Temporary debug log
        console.log('📨 POST /notifications/send');
        console.log('   User ID:', req.user.id);
        console.log('   User Role:', req.user.role);
        console.log('   Is Admin?', req.user.role === 'admin');
        console.log('   Is Driver?', req.user.role === 'driver');
        
        // Check if user is admin or driver (allow both to send continuously)
        if (req.user.role !== 'admin' && req.user.role !== 'driver') {
            console.log('❌ FORBIDDEN: Role', req.user.role, 'cannot send notifications');
            return res.status(403).json({ error: 'forbidden', detail: `Role ${req.user.role} cannot send notifications` });
        }
        
        console.log('✅ Permission granted for', req.user.role);
        
        if (!title || !body) {
            return res.status(400).json({ error: 'title_and_body_required' });
        }
        
        let recipientIds = [];
        
        // If specific users provided
        if (target_users && Array.isArray(target_users) && target_users.length > 0) {
            recipientIds = target_users;
        } 
        // If target_role provided, get all users with that role
        else if (target_role) {
            const [users] = await pool.query('SELECT id FROM users WHERE role = ?', [target_role]);
            recipientIds = users.map(u => u.id);
        }
        // For drivers, get parents of students on their current trip
        else if (req.user.role === 'driver') {
            // Method 1: Try to find via driver -> bus -> schedules -> trips -> students -> parents
            const [parents] = await pool.query(`
                SELECT DISTINCT s.parent_user_id as id
                FROM drivers d
                JOIN buses b ON d.id = b.driver_id
                JOIN schedules sch ON b.id = sch.bus_id
                JOIN trips t ON sch.id = t.schedule_id
                JOIN students s ON t.student_id = s.id
                WHERE d.user_id = ?
                AND sch.scheduled_date = CURDATE()
                AND t.status IN ('waiting', 'onboard', 'picked')
            `, [req.user.id]);
            
            console.log('Driver notification - Found parents:', parents.length, 'for user:', req.user.id);
            
            recipientIds = parents.map(p => p.id);
            
            // If no parents found on today's trips, send to all parents as fallback
            if (recipientIds.length === 0) {
                console.log('No parents on current trip, sending to all parents');
                const [allParents] = await pool.query('SELECT id FROM users WHERE role = ?', ['parent']);
                recipientIds = allParents.map(u => u.id);
            }
        }
        // For admin, default to all parents
        else {
            const [users] = await pool.query('SELECT id FROM users WHERE role = ?', ['parent']);
            recipientIds = users.map(u => u.id);
        }
        
        if (recipientIds.length === 0) {
            return res.status(400).json({ error: 'no_recipients_found' });
        }
        
        // Determine target_role based on recipients or provided target_role
        let finalTargetRole = target_role || 'parent'
        
        // Get io instance from app
        const io = req.app.get('io');
        
        // Create notifications for each recipient
        const results = [];
        for (const userId of recipientIds) {
            const notifId = uuidv4();
            await pool.query(
                'INSERT INTO notifications (id, user_id, sender_id, sender_role, target_role, title, body, type, priority) VALUES (?,?,?,?,?,?,?,?,?)',
                [notifId, userId, req.user.id, req.user.role, finalTargetRole, title, body, type || 'info', priority || 'medium']
            );
            results.push({ id: notifId, user_id: userId });
            
            // Emit real-time notification to user
            if (io) {
                io.to(`user:${userId}`).emit('new_notification', {
                    id: notifId,
                    title,
                    body,
                    type: type || 'info',
                    priority: priority || 'medium',
                    sender_role: req.user.role,
                    created_at: new Date()
                });
            }
        }
        
        res.status(201).json({ 
            count: results.length, 
            notifications: results,
            sender_role: req.user.role
        });
    } catch (err) {
        console.error('API /notifications/send error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 5. UPDATE: Đánh dấu notification đã đọc
// PUT /api/notifications/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const notifId = req.params.id;
        const { is_read } = req.body;
        
        await pool.query(
            'UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?',
            [is_read !== undefined ? is_read : true, notifId, req.user.id]
        );
        
        res.json({ ok: true, id: notifId });
    } catch (err) {
        console.error('API /notifications PUT error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 6. DELETE: Xóa notification
// DELETE /api/notifications/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('API /notifications DELETE error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 7. BULK: Đánh dấu tất cả notifications là đã đọc
// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({ ok: true });
    } catch (err) {
        console.error('API /notifications/mark-all-read error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 8. POST: Broadcast notification đến tất cả users (admin only)
// POST /api/notifications/broadcast
router.post('/broadcast', authMiddleware, async (req, res) => {
    try {
        const { title, body, type, priority, role_filter } = req.body;
        
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'forbidden' });
        }
        
        if (!title) return res.status(400).json({ error: 'title_required' });
        
        // Get all users (optionally filter by role)
        let userQuery = 'SELECT id FROM users';
        let params = [];
        
        if (role_filter) {
            userQuery += ' WHERE role = ?';
            params.push(role_filter);
        }
        
        const [users] = await pool.query(userQuery, params);
        
        // Create notifications for each user
        const results = [];
        for (const user of users) {
            const notifId = uuidv4();
            await pool.query(
                'INSERT INTO notifications (id, user_id, sender_id, sender_role, target_role, title, body, type, priority) VALUES (?,?,?,?,?,?,?,?,?)',
                [notifId, user.id, req.user.id, req.user.role, role_filter || 'all', title, body || '', type || 'info', priority || 'medium']
            );
            results.push({ id: notifId, user_id: user.id });
        }
        
        res.status(201).json({ count: results.length, notifications: results });
    } catch (err) {
        console.error('API /notifications/broadcast error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 9. DELETE: Xóa tất cả read notifications
// DELETE /api/notifications/cleanup-read
router.delete('/cleanup-read', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [result] = await pool.query(
            'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
            [userId]
        );
        
        res.json({ ok: true, deleted_count: result.affectedRows });
    } catch (err) {
        console.error('API /notifications/cleanup-read error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

export default router;
