import express from 'express';
import bcrypt from 'bcryptjs';
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

// ======================= API /api/drivers =======================

// 1. READ: Lấy danh sách tài xế
// GET /api/drivers
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('API: Getting drivers list...')
        const [rows] = await pool.query(`
            SELECT 
                id,
                user_id,
                full_name,
                phone,
                license_number,
                active,
                created_at,
                updated_at
            FROM drivers 
            ORDER BY full_name
        `);
        console.log('API: Found drivers:', rows.length)
        console.log('API: Sample driver:', rows[0])
        res.json({ count: rows.length, drivers: rows });
    } catch (err) {
        console.error('API /drivers GET error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 2. GET single driver
// GET /api/drivers/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id,
                user_id,
                full_name,
                phone,
                license_number,
                active,
                created_at,
                updated_at
            FROM drivers 
            WHERE id = ? 
            LIMIT 1
        `, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'not_found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('API /drivers/:id GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 3. CREATE: Tạo tài xế mới (chỉ driver record)
// POST /api/drivers
router.post('/', authMiddleware, async (req, res) => {
    try {
        console.log('API: Creating new driver with data:', req.body)
        const { full_name, phone, license_number } = req.body;
        if (!full_name) {
            console.log('API: Missing required fields')
            return res.status(400).json({ error: 'required_fields_missing' })
        }
        
        const driverId = uuidv4();
        
        console.log('API: Creating driver with ID:', driverId)
        // Tạo driver record (không cần user_id)
        await pool.query(
            'INSERT INTO drivers (id, user_id, full_name, phone, license_number, active) VALUES (?, ?, ?, ?, ?, ?)',
            [driverId, null, full_name, phone || null, license_number || null, true]
        );
        
        const result = { 
            id: driverId,
            user_id: null,
            full_name, 
            phone: phone || null,
            license_number: license_number || null,
            active: true 
        }
        console.log('API: Created driver successfully:', result)
        res.status(201).json(result);
    } catch (err) {
        console.error('API /drivers POST error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 4. UPDATE: Cập nhật tài xế
// PUT /api/drivers/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const driverId = req.params.id;
        const { full_name, phone, active, license_number } = req.body;
        console.log('API: Updating driver ID:', driverId, 'with data:', req.body)
        
        // Kiểm tra driver có tồn tại không
        const [driverRows] = await pool.query('SELECT id FROM drivers WHERE id = ?', [driverId]);
        if (!driverRows[0]) {
            console.log('API: Driver not found for update:', driverId)
            return res.status(404).json({ error: 'driver_not_found' });
        }
        
        // Update drivers table
        let updateFields = [];
        let updateValues = [];
        if (full_name !== undefined) { updateFields.push('full_name = ?'); updateValues.push(full_name); }
        if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
        if (active !== undefined) { updateFields.push('active = ?'); updateValues.push(active); }
        if (license_number !== undefined) { updateFields.push('license_number = ?'); updateValues.push(license_number); }
        
        if (updateFields.length > 0) {
            const query = `UPDATE drivers SET ${updateFields.join(', ')} WHERE id = ?`;
            console.log('API: Updating driver with query:', query, 'values:', [...updateValues, driverId])
            await pool.query(query, [...updateValues, driverId]);
        }
        
        console.log('API: Driver updated successfully:', driverId)
        res.json({ ok: true, id: driverId });
    } catch (err) {
        console.error('API /drivers PUT error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 5. DELETE: Xóa tài xế
// DELETE /api/drivers/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const driverId = req.params.id;
        console.log('API: Deleting driver ID:', driverId)
        
        // Kiểm tra driver có tồn tại không
        const [driverRows] = await pool.query('SELECT id FROM drivers WHERE id = ?', [driverId]);
        if (!driverRows[0]) {
            console.log('API: Driver not found for ID:', driverId)
            return res.status(404).json({ error: 'driver_not_found' });
        }
        
        // Delete driver record
        console.log('API: Deleting driver record')
        await pool.query('DELETE FROM drivers WHERE id = ?', [driverId]);
        
        console.log('API: Driver deleted successfully')
        res.json({ ok: true });
    } catch (err) {
        console.error('API /drivers DELETE error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 6. Get driver by user ID
// GET /api/drivers/user/:user_id
router.get('/user/:user_id', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT d.id, d.license_number, d.active, d.created_at FROM drivers d WHERE d.user_id = ? LIMIT 1',
            [req.params.user_id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'not_found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('API /drivers/user/:user_id error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// ======================= NOTIFICATIONS =======================

// GET /api/drivers/notifications - Lấy danh sách notifications cho driver
router.get('/notifications', authMiddleware, async (req, res) => {
    console.log('API: GET /api/drivers/notifications called');
    try {
        const { read, limit } = req.query;
        const userId = req.user.id;
        console.log('API: Driver notifications for user:', userId);
        
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
        console.error('API /drivers/notifications GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// GET /api/drivers/notifications/unread/count - Lấy số lượng notifications chưa đọc
router.get('/notifications/unread/count', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({ unread_count: result[0]?.count || 0 });
    } catch (err) {
        console.error('API /drivers/notifications/unread/count error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// PUT /api/drivers/notifications/:id/read - Đánh dấu notification đã đọc
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Kiểm tra notification thuộc về user này
        const [check] = await pool.query(
            'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (!check[0]) {
            return res.status(404).json({ error: 'not_found' });
        }
        
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
        console.error('API /drivers/notifications/:id/read PUT error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// DELETE /api/drivers/notifications/:id - Xóa notification
router.delete('/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const [result] = await pool.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'not_found' });
        }
        
        res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        console.error('API /drivers/notifications/:id DELETE error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

export default router;