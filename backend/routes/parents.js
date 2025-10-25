import express from 'express';
import jwt from 'jsonwebtoken';
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

// ======================= PARENT APIS =======================

// 1. GET: Lấy danh sách con của parent hiện tại
// GET /api/parents/my-children
router.get('/my-children', authMiddleware, async (req, res) => {
    try {
        console.log('API: Getting children for parent:', req.user.id);
        
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'parent_only' });
        }
        
        const query = `
            SELECT 
                s.id,
                s.full_name,
                s.grade,
                s.class,
                s.assigned_stop_id,
                rs.name as stop_name,
                rs.lat as stop_lat,
                rs.lng as stop_lng,
                r.name as route_name,
                r.id as route_id
            FROM students s
            LEFT JOIN route_stops rs ON s.assigned_stop_id = rs.id
            LEFT JOIN routes r ON rs.route_id = r.id
            WHERE s.parent_user_id = ?
            ORDER BY s.full_name
        `;
        
        const [rows] = await pool.query(query, [req.user.id]);
        console.log('API: Found children:', rows.length);
        res.json({ count: rows.length, children: rows });
    } catch (err) {
        console.error('API /parents/my-children GET error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// GET /api/parents/children (alias for my-children)
router.get('/children', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'parent_only' });
        }
        
        const query = `
            SELECT 
                s.id,
                s.full_name,
                s.grade,
                s.class,
                r.id as route_id,
                r.name as route_name,
                rs.id as stop_id,
                rs.name as stop_name,
                rs.lat as stop_lat,
                rs.lng as stop_lng,
                rs.stop_order
            FROM students s
            LEFT JOIN routes r ON s.assigned_route_id = r.id
            LEFT JOIN route_stops rs ON s.assigned_stop_id = rs.id
            WHERE s.parent_user_id = ?
            ORDER BY s.full_name
        `;
        
        const [rows] = await pool.query(query, [req.user.id]);
        res.json({ success: true, count: rows.length, children: rows });
    } catch (err) {
        console.error('API /parents/children GET error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 2. GET: Lấy lịch trình xe buýt cho con của parent
// GET /api/parents/child/:childId/schedule
router.get('/child/:childId/schedule', authMiddleware, async (req, res) => {
    try {
        const childId = req.params.childId;
        console.log('API: Getting schedule for child:', childId, 'by parent:', req.user.id);
        
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'parent_only' });
        }
        
        // Kiểm tra child có thuộc về parent này không
        const [childCheck] = await pool.query(
            'SELECT id FROM students WHERE id = ? AND parent_user_id = ?',
            [childId, req.user.id]
        );
        
        if (!childCheck[0]) {
            return res.status(403).json({ error: 'child_not_found_or_not_yours' });
        }
        
        const query = `
            SELECT 
                s.id as schedule_id,
                s.scheduled_date,
                s.start_time,
                s.status as schedule_status,
                r.name as route_name,
                r.id as route_id,
                b.plate as bus_plate,
                b.capacity,
                d.full_name as driver_name,
                d.phone as driver_phone,
                rs.name as stop_name,
                rs.stop_order,
                t.id as trip_id,
                t.status as trip_status,
                t.picked_at,
                t.dropped_at
            FROM schedules s
            JOIN routes r ON s.route_id = r.id
            JOIN buses b ON s.bus_id = b.id
            LEFT JOIN drivers d ON b.driver_id = d.id
            JOIN students st ON st.assigned_stop_id IN (
                SELECT id FROM route_stops WHERE route_id = r.id
            )
            LEFT JOIN route_stops rs ON st.assigned_stop_id = rs.id
            LEFT JOIN trips t ON t.schedule_id = s.id AND t.student_id = st.id
            WHERE st.id = ?
            AND s.scheduled_date >= CURDATE()
            ORDER BY s.scheduled_date DESC, s.start_time DESC
            LIMIT 10
        `;
        
        const [rows] = await pool.query(query, [childId]);
        console.log('API: Found schedules:', rows.length);
        res.json({ count: rows.length, schedules: rows });
    } catch (err) {
        console.error('API /parents/child/:childId/schedule GET error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 3. GET: Theo dõi vị trí xe buýt cho con
// GET /api/parents/child/:childId/bus-location
router.get('/child/:childId/bus-location', authMiddleware, async (req, res) => {
    try {
        const childId = req.params.childId;
        console.log('API: Getting bus location for child:', childId, 'by parent:', req.user.id);
        
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'parent_only' });
        }
        
        // Kiểm tra child có thuộc về parent này không
        const [childCheck] = await pool.query(
            'SELECT id FROM students WHERE id = ? AND parent_user_id = ?',
            [childId, req.user.id]
        );
        
        if (!childCheck[0]) {
            return res.status(403).json({ error: 'child_not_found_or_not_yours' });
        }
        
        const query = `
            SELECT 
                b.id as bus_id,
                b.plate,
                b.capacity,
                b.current_lat,
                b.current_lng,
                b.speed,
                b.heading,
                b.students_onboard,
                b.last_update,
                sch.id as schedule_id,
                sch.scheduled_date,
                sch.start_time,
                sch.status as schedule_status,
                r.id as route_id,
                r.name as route_name,
                d.id as driver_id,
                d.full_name as driver_name,
                d.phone as driver_phone,
                t.id as trip_id,
                t.status as trip_status,
                t.picked_at,
                t.dropped_at,
                rs.name as stop_name,
                rs.lat as stop_lat,
                rs.lng as stop_lng,
                rs.stop_order
            FROM trips t
            JOIN schedules sch ON t.schedule_id = sch.id
            JOIN routes r ON sch.route_id = r.id
            LEFT JOIN buses b ON sch.bus_id = b.id
            LEFT JOIN drivers d ON b.driver_id = d.id
            JOIN students st ON t.student_id = st.id
            LEFT JOIN route_stops rs ON st.assigned_stop_id = rs.id
            WHERE t.student_id = ?
                AND sch.scheduled_date = CURDATE()
                AND sch.status IN ('in-progress', 'scheduled')
            ORDER BY sch.start_time DESC
            LIMIT 1
        `;
        
        const [rows] = await pool.query(query, [childId]);
        
        if (!rows[0]) {
            return res.json({ 
                success: true,
                has_active_trip: false,
                message: 'No active trip today'
            });
        }
        
        const busData = rows[0];
        
        // Get route stops
        const [routeStops] = await pool.query(`
            SELECT id, name, lat, lng, stop_order, is_pickup
            FROM route_stops
            WHERE route_id = ?
            ORDER BY stop_order
        `, [busData.route_id]);
        
        res.json({
            success: true,
            has_active_trip: true,
            trip: {
                id: busData.trip_id,
                status: busData.trip_status,
                picked_at: busData.picked_at,
                dropped_at: busData.dropped_at
            },
            bus: {
                id: busData.bus_id,
                plate: busData.plate,
                capacity: busData.capacity,
                current_location: {
                    lat: parseFloat(busData.current_lat) || 0,
                    lng: parseFloat(busData.current_lng) || 0,
                    speed: parseFloat(busData.speed) || 0,
                    heading: parseFloat(busData.heading) || 0,
                    last_update: busData.last_update
                },
                students_onboard: busData.students_onboard
            },
            driver: {
                id: busData.driver_id,
                name: busData.driver_name,
                phone: busData.driver_phone
            },
            route: {
                id: busData.route_id,
                name: busData.route_name,
                stops: routeStops.map(s => ({
                    id: s.id,
                    name: s.name,
                    lat: parseFloat(s.lat),
                    lng: parseFloat(s.lng),
                    order: s.stop_order,
                    is_pickup: Boolean(s.is_pickup)
                }))
            },
            child_stop: {
                name: busData.stop_name,
                lat: parseFloat(busData.stop_lat) || 0,
                lng: parseFloat(busData.stop_lng) || 0,
                order: busData.stop_order
            },
            schedule: {
                date: busData.scheduled_date,
                start_time: busData.start_time,
                status: busData.schedule_status
            }
        });
    } catch (err) {
        console.error('API /parents/child/:childId/bus-location GET error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 4. POST: Báo cáo con vắng mặt
// POST /api/parents/child/:childId/absence-report
router.post('/child/:childId/absence-report', authMiddleware, async (req, res) => {
    try {
        const childId = req.params.childId;
        const { date, reason } = req.body;
        console.log('API: Creating absence report for child:', childId, 'by parent:', req.user.id);
        
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'parent_only' });
        }
        
        if (!date) {
            return res.status(400).json({ error: 'date_required' });
        }
        
        // Kiểm tra child có thuộc về parent này không
        const [childCheck] = await pool.query(
            'SELECT id FROM students WHERE id = ? AND parent_user_id = ?',
            [childId, req.user.id]
        );
        
        if (!childCheck[0]) {
            return res.status(403).json({ error: 'child_not_found_or_not_yours' });
        }
        
        // Tìm trips trong ngày đó và mark là absent
        const updateQuery = `
            UPDATE trips t
            JOIN schedules s ON t.schedule_id = s.id
            SET t.status = 'absent'
            WHERE t.student_id = ?
            AND DATE(s.scheduled_date) = ?
            AND t.status = 'waiting'
        `;
        
        const [result] = await pool.query(updateQuery, [childId, date]);
        
        // Tạo notification cho admin/driver
        const notificationQuery = `
            INSERT INTO notifications (id, type, title, message, target_role, created_at)
            VALUES (UUID(), 'absence', 'Student Absence Report', ?, 'admin', NOW())
        `;
        
        const notificationMessage = `Student absence reported: Child ${childId} will be absent on ${date}. Reason: ${reason || 'Not specified'}`;
        await pool.query(notificationQuery, [notificationMessage]);
        
        console.log('API: Absence report created, affected trips:', result.affectedRows);
        res.json({ 
            ok: true, 
            affected_trips: result.affectedRows,
            message: 'absence_reported_successfully'
        });
    } catch (err) {
        console.error('API /parents/child/:childId/absence-report POST error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 5. GET: Lấy thông báo cho parent
// GET /api/parents/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        console.log('API: Getting notifications for parent:', req.user.id);
        
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'parent_only' });
        }
        
        const { limit = 20, offset = 0 } = req.query;
        
        // Lấy thông báo chung cho parent và thông báo specific cho user này
        const query = `
            SELECT 
                n.id,
                n.type,
                n.title,
                n.body,
                n.priority,
                n.is_read,
                n.sender_role,
                n.created_at,
                u.full_name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(query, [req.user.id, parseInt(limit), parseInt(offset)]);
        console.log('API: Found notifications:', rows.length);
        res.json({ count: rows.length, notifications: rows });
    } catch (err) {
        console.error('API /parents/notifications GET error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 6. PUT: Đánh dấu thông báo đã đọc
// PUT /api/parents/notifications/:id/read
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const notificationId = req.params.id;
        console.log('API: Marking notification as read:', notificationId, 'by parent:', req.user.id);
        
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'parent_only' });
        }
        
        const updateQuery = `
            UPDATE notifications 
            SET is_read = 1 
            WHERE id = ? 
            AND user_id = ?
        `;
        
        const [result] = await pool.query(updateQuery, [notificationId, req.user.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'notification_not_found' });
        }
        
        console.log('API: Notification marked as read');
        res.json({ ok: true });
    } catch (err) {
        console.error('API /parents/notifications/:id/read PUT error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

// 7. DELETE: Xóa thông báo
// DELETE /api/parents/notifications/:id
router.delete('/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const notificationId = req.params.id;
        console.log('API: Deleting notification:', notificationId, 'by parent:', req.user.id);
        
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'parent_only' });
        }
        
        const deleteQuery = `
            DELETE FROM notifications 
            WHERE id = ? 
            AND user_id = ?
        `;
        
        const [result] = await pool.query(deleteQuery, [notificationId, req.user.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'notification_not_found' });
        }
        
        console.log('API: Notification deleted');
        res.json({ ok: true });
    } catch (err) {
        console.error('API /parents/notifications/:id DELETE error', err);
        res.status(500).json({ error: 'internal_error', details: err.message });
    }
});

export default router;