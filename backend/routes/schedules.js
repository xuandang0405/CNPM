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

// ======================= API /api/schedules =======================

// 1. READ: Lấy danh sách schedules
// GET /api/schedules
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { date, route_id, status } = req.query;
        
        let query = 'SELECT s.id, s.route_id, s.bus_id, s.scheduled_date, s.start_time, s.end_time, s.status, r.name as route_name, b.plate as bus_plate, d.id as driver_id, u.full_name as driver_name FROM schedules s LEFT JOIN routes r ON s.route_id = r.id LEFT JOIN buses b ON s.bus_id = b.id LEFT JOIN drivers d ON b.driver_id = d.id LEFT JOIN users u ON d.user_id = u.id WHERE 1=1';
        let params = [];
        
        if (date) {
            query += ' AND DATE(s.scheduled_date) = ?';
            params.push(date);
        }
        if (route_id) {
            query += ' AND s.route_id = ?';
            params.push(route_id);
        }
        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY s.scheduled_date DESC, s.start_time DESC';
        
        const [schedules] = await pool.query(query, params);
        res.json({ count: schedules.length, schedules });
    } catch (err) {
        console.error('API /schedules GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 2. GET single schedule
// GET /api/schedules/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [schedules] = await pool.query(
            'SELECT s.id, s.route_id, s.bus_id, s.scheduled_date, s.start_time, s.end_time, s.status, r.name as route_name, b.plate as bus_plate FROM schedules s LEFT JOIN routes r ON s.route_id = r.id LEFT JOIN buses b ON s.bus_id = b.id WHERE s.id = ? LIMIT 1',
            [req.params.id]
        );
        
        if (!schedules[0]) return res.status(404).json({ error: 'not_found' });
        
        const schedule = schedules[0];
        
        // Get trips for this schedule
        const [trips] = await pool.query(
            'SELECT t.id, t.student_id, t.status, t.picked_at, t.dropped_at, st.full_name FROM trips t LEFT JOIN students st ON t.student_id = st.id WHERE t.schedule_id = ? ORDER BY st.full_name',
            [schedule.id]
        );
        schedule.trips = trips || [];
        
        res.json(schedule);
    } catch (err) {
        console.error('API /schedules/:id GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 3. CREATE: Tạo schedule mới
// POST /api/schedules
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { route_id, bus_id, scheduled_date, start_time } = req.body;
        if (!route_id || !scheduled_date || !start_time) {
            return res.status(400).json({ error: 'required_fields_missing' });
        }
        
        const id = uuidv4();
        await pool.query(
            'INSERT INTO schedules (id, route_id, bus_id, scheduled_date, start_time, status) VALUES (?,?,?,?,?,?)',
            [id, route_id, bus_id || null, scheduled_date, start_time, 'scheduled']
        );
        
        res.status(201).json({ 
            id, 
            route_id, 
            bus_id: bus_id || null, 
            scheduled_date, 
            start_time, 
            status: 'scheduled' 
        });
    } catch (err) {
        console.error('API /schedules POST error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 4. UPDATE: Cập nhật schedule
// PUT /api/schedules/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const { bus_id, status, end_time, start_time } = req.body;
        
        let updateFields = [];
        let updateValues = [];
        if (bus_id !== undefined) { updateFields.push('bus_id = ?'); updateValues.push(bus_id); }
        if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }
        if (end_time !== undefined) { updateFields.push('end_time = ?'); updateValues.push(end_time); }
        if (start_time !== undefined) { updateFields.push('start_time = ?'); updateValues.push(start_time); }
        
        if (updateFields.length === 0) return res.json({ ok: true, id: scheduleId });
        
        const query = `UPDATE schedules SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.query(query, [...updateValues, scheduleId]);
        
        res.json({ ok: true, id: scheduleId });
    } catch (err) {
        console.error('API /schedules PUT error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 5. DELETE: Xóa schedule
// DELETE /api/schedules/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Delete related trips first
        await pool.query('DELETE FROM trips WHERE schedule_id = ?', [req.params.id]);
        // Delete schedule
        await pool.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('API /schedules DELETE error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 6. GET: Lấy trips của schedule
// GET /api/schedules/:id/trips
router.get('/:id/trips', authMiddleware, async (req, res) => {
    try {
        const [trips] = await pool.query(
            'SELECT t.id, t.student_id, t.status, t.picked_at, t.dropped_at, st.full_name, st.grade FROM trips t LEFT JOIN students st ON t.student_id = st.id WHERE t.schedule_id = ? ORDER BY st.full_name',
            [req.params.id]
        );
        
        res.json({ count: trips.length, trips });
    } catch (err) {
        console.error('API /schedules/:id/trips error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 7. POST: Thêm students vào schedule
// POST /api/schedules/:id/add-students
router.post('/:id/add-students', authMiddleware, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const { student_ids } = req.body;
        
        if (!Array.isArray(student_ids)) {
            return res.status(400).json({ error: 'student_ids must be array' });
        }
        
        const results = [];
        for (const studentId of student_ids) {
            const tripId = uuidv4();
            await pool.query(
                'INSERT INTO trips (id, schedule_id, student_id, status) VALUES (?,?,?,?)',
                [tripId, scheduleId, studentId, 'waiting']
            );
            results.push({ tripId, studentId, status: 'waiting' });
        }
        
        res.status(201).json({ count: results.length, trips: results });
    } catch (err) {
        console.error('API /schedules/:id/add-students error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 8. GET: Lấy schedules cho ngày hôm nay (current active schedules)
// GET /api/schedules/today/active
router.get('/today/active', authMiddleware, async (req, res) => {
    try {
        const [schedules] = await pool.query(
            "SELECT s.id, s.route_id, s.bus_id, s.scheduled_date, s.start_time, s.end_time, s.status, r.name as route_name, b.plate as bus_plate FROM schedules s LEFT JOIN routes r ON s.route_id = r.id LEFT JOIN buses b ON s.bus_id = b.id WHERE DATE(s.scheduled_date) = CURDATE() AND s.status IN ('scheduled', 'in-progress') ORDER BY s.start_time"
        );
        
        res.json({ count: schedules.length, schedules });
    } catch (err) {
        console.error('API /schedules/today/active error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

export default router;
