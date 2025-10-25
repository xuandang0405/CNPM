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

// ======================= API /api/routes =======================

// 1. READ: Lấy danh sách routes với stops
// GET /api/routes
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [routes] = await pool.query(
            'SELECT id, name, description, active, created_at FROM routes ORDER BY name'
        );
        
        // Get stops for each route
        for (let route of routes) {
            const [stops] = await pool.query(
                'SELECT id, name, lat, lng, stop_order, is_pickup FROM route_stops WHERE route_id = ? ORDER BY stop_order',
                [route.id]
            );
            route.stops = stops || [];
        }
        
        res.json({ count: routes.length, routes });
    } catch (err) {
        console.error('API /routes GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 2. GET single route
// GET /api/routes/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [routes] = await pool.query(
            'SELECT id, name, description, active, created_at FROM routes WHERE id = ? LIMIT 1',
            [req.params.id]
        );
        
        if (!routes[0]) return res.status(404).json({ error: 'not_found' });
        
        const route = routes[0];
        const [stops] = await pool.query(
            'SELECT id, name, lat, lng, stop_order, is_pickup FROM route_stops WHERE route_id = ? ORDER BY stop_order',
            [route.id]
        );
        route.stops = stops || [];
        
        res.json(route);
    } catch (err) {
        console.error('API /routes/:id GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 3. CREATE: Tạo route mới
// POST /api/routes
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'name_required' });
        
        const id = uuidv4();
        await pool.query(
            'INSERT INTO routes (id, name, description, active) VALUES (?,?,?,?)',
            [id, name, description || '', true]
        );
        
        res.status(201).json({ id, name, description: description || '', active: true, stops: [] });
    } catch (err) {
        console.error('API /routes POST error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 4. UPDATE: Cập nhật route
// PUT /api/routes/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const routeId = req.params.id;
        const { name, description, active } = req.body;
        
        let updateFields = [];
        let updateValues = [];
        if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
        if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
        if (active !== undefined) { updateFields.push('active = ?'); updateValues.push(active); }
        
        if (updateFields.length === 0) return res.json({ ok: true, id: routeId });
        
        const query = `UPDATE routes SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.query(query, [...updateValues, routeId]);
        
        res.json({ ok: true, id: routeId });
    } catch (err) {
        console.error('API /routes PUT error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 5. DELETE: Xóa route
// DELETE /api/routes/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM routes WHERE id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('API /routes DELETE error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// ======================= API /api/routes/:id/stops =======================

// 6. ADD: Thêm stop vào route
// POST /api/routes/:id/stops
router.post('/:id/stops', authMiddleware, async (req, res) => {
    try {
        const routeId = req.params.id;
        const { name, lat, lng, is_pickup } = req.body;
        
        if (!name || lat === undefined || lng === undefined) {
            return res.status(400).json({ error: 'required_fields_missing' });
        }
        
        // Get max stop_order for this route
        const [result] = await pool.query(
            'SELECT MAX(stop_order) as max_order FROM route_stops WHERE route_id = ?',
            [routeId]
        );
        const nextOrder = (result[0]?.max_order || 0) + 1;
        
        const stopId = uuidv4();
        await pool.query(
            'INSERT INTO route_stops (id, route_id, name, lat, lng, stop_order, is_pickup) VALUES (?,?,?,?,?,?,?)',
            [stopId, routeId, name, lat, lng, nextOrder, is_pickup !== false]
        );
        
        res.status(201).json({ 
            id: stopId, 
            route_id: routeId,
            name, 
            lat, 
            lng, 
            stop_order: nextOrder,
            is_pickup: is_pickup !== false 
        });
    } catch (err) {
        console.error('API /routes/:id/stops POST error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 7. UPDATE: Cập nhật stop
// PUT /api/routes/:id/stops/:stopId
router.put('/:id/stops/:stopId', authMiddleware, async (req, res) => {
    try {
        const stopId = req.params.stopId;
        const { name, lat, lng, stop_order, is_pickup } = req.body;
        
        let updateFields = [];
        let updateValues = [];
        if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
        if (lat !== undefined) { updateFields.push('lat = ?'); updateValues.push(lat); }
        if (lng !== undefined) { updateFields.push('lng = ?'); updateValues.push(lng); }
        if (stop_order !== undefined) { updateFields.push('stop_order = ?'); updateValues.push(stop_order); }
        if (is_pickup !== undefined) { updateFields.push('is_pickup = ?'); updateValues.push(is_pickup); }
        
        if (updateFields.length === 0) return res.json({ ok: true, id: stopId });
        
        const query = `UPDATE route_stops SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.query(query, [...updateValues, stopId]);
        
        res.json({ ok: true, id: stopId });
    } catch (err) {
        console.error('API /routes/:id/stops/:stopId PUT error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 8. DELETE: Xóa stop
// DELETE /api/routes/:id/stops/:stopId
router.delete('/:id/stops/:stopId', authMiddleware, async (req, res) => {
    try {
        const stopId = req.params.stopId;
        await pool.query('DELETE FROM route_stops WHERE id = ?', [stopId]);
        res.json({ ok: true });
    } catch (err) {
        console.error('API /routes/:id/stops/:stopId DELETE error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

// 9. GET: Lấy danh sách students đã gán vào route
// GET /api/routes/:id/students
router.get('/:id/students', authMiddleware, async (req, res) => {
    try {
        const [students] = await pool.query(
            'SELECT st.id, st.full_name, st.grade, st.assigned_stop_id, rs.name as stop_name FROM students st LEFT JOIN route_stops rs ON st.assigned_stop_id = rs.id WHERE st.assigned_route_id = ? ORDER BY st.full_name',
            [req.params.id]
        );
        
        res.json({ count: students.length, students });
    } catch (err) {
        console.error('API /routes/:id/students GET error', err);
        res.status(500).json({ error: 'internal_error' });
    }
});

export default router;
