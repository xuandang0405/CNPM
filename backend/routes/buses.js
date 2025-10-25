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

// ======================= API /api/buses =======================

// 1. READ: Lấy danh sách xe buýt
// GET /api/buses
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT b.id, b.plate, b.capacity, b.active, b.students_onboard, b.current_lat, b.current_lng, b.speed, d.id as driver_id, u.full_name as driver_name, u.email as driver_email FROM buses b LEFT JOIN drivers d ON b.driver_id = d.id LEFT JOIN users u ON d.user_id = u.id ORDER BY b.plate'
        );
        res.json({ count: rows.length, buses: rows }); 
    } catch (err) {
        console.error('API /buses GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 2. GET single bus
// GET /api/buses/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT b.id, b.plate, b.capacity, b.active, b.students_onboard, b.current_lat, b.current_lng, b.speed, b.created_at, d.id as driver_id, u.full_name as driver_name FROM buses b LEFT JOIN drivers d ON b.driver_id = d.id LEFT JOIN users u ON d.user_id = u.id WHERE b.id = ? LIMIT 1',
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'not_found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('API /buses/:id GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 3. CREATE: Tạo xe buýt mới
// POST /api/buses
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { plate, capacity, driver_id } = req.body;
        if (!plate) return res.status(400).json({ error: 'plate_required' });
        
        const id = uuidv4();
        await pool.query(
            'INSERT INTO buses (id, plate, capacity, driver_id, active) VALUES (?,?,?,?,?)', 
            [id, plate, capacity || 50, driver_id || null, true]
        );
        
        res.status(201).json({ id, plate, capacity: capacity || 50, driver_id: driver_id || null, active: true });
    } catch (err) {
        console.error('API /buses POST error', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'duplicate_plate' });
        }
        res.status(500).json({ error: 'internal_error' });
    }
});

// 4. UPDATE: Cập nhật xe buýt
// PUT /api/buses/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const busId = req.params.id;
        const { plate, capacity, active, driver_id, current_lat, current_lng, speed, students_onboard } = req.body;
        
        let updateFields = [];
        let updateValues = [];

        if (plate !== undefined) { updateFields.push('plate = ?'); updateValues.push(plate); }
        if (capacity !== undefined) { updateFields.push('capacity = ?'); updateValues.push(capacity); }
        if (active !== undefined) { updateFields.push('active = ?'); updateValues.push(active); }
        if (driver_id !== undefined) { updateFields.push('driver_id = ?'); updateValues.push(driver_id); }
        if (current_lat !== undefined) { updateFields.push('current_lat = ?'); updateValues.push(current_lat); }
        if (current_lng !== undefined) { updateFields.push('current_lng = ?'); updateValues.push(current_lng); }
        if (speed !== undefined) { updateFields.push('speed = ?'); updateValues.push(speed); }
        if (students_onboard !== undefined) { updateFields.push('students_onboard = ?'); updateValues.push(students_onboard); }

        if (updateFields.length === 0) {
            return res.json({ ok: true, id: busId });
        }

        const query = `UPDATE buses SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.query(query, [...updateValues, busId]);

        res.json({ ok: true, id: busId });
    } catch (err) {
        console.error('API /buses PUT error', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'duplicate_plate' });
        }
        res.status(500).json({ error: 'internal_error' });
    }
});

// 5. DELETE: Xóa xe buýt
// DELETE /api/buses/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const busId = req.params.id;
        await pool.query('DELETE FROM buses WHERE id = ?', [busId]);
        res.json({ ok: true });
    } catch (err) {
        console.error('API /buses DELETE error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 6. Assign driver to bus
// POST /api/buses/:id/assign-driver
router.post('/:id/assign-driver', authMiddleware, async (req, res) => {
    try {
        const busId = req.params.id;
        const { driver_id } = req.body;
        
        if (!driver_id) return res.status(400).json({ error: 'driver_id_required' });
        
        await pool.query('UPDATE buses SET driver_id = ? WHERE id = ?', [driver_id, busId]);
        res.json({ ok: true, id: busId, driver_id });
    } catch (err) {
        console.error('API /buses/:id/assign-driver error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 7. Get realtime locations history for a bus
// GET /api/buses/:id/locations
router.get('/:id/locations', authMiddleware, async (req, res) => {
    try {
        const busId = req.params.id;
        const limit = req.query.limit || 100;
        
        const [locations] = await pool.query(
            'SELECT id, bus_id, lat, lng, speed, recorded_at FROM realtime_locations WHERE bus_id = ? ORDER BY recorded_at DESC LIMIT ?',
            [busId, parseInt(limit)]
        );
        
        res.json({ count: locations.length, locations });
    } catch (err) {
        console.error('API /buses/:id/locations error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

export default router;