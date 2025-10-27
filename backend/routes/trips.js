import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Auth middleware
function authMiddleware(req, res, next) {
    const hdr = req.headers.authorization;
    if (!hdr || !hdr.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'missing_token' });
    }
    const token = hdr.slice(7);
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = { id: data.sub, role: data.role };
        next();
    } catch (e) {
        return res.status(401).json({ error: 'invalid_token' });
    }
}

// Test endpoint with SQL connection
router.get('/test', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute('SELECT COUNT(*) as count FROM drivers');
            const driverCount = rows[0].count;
            
            res.json({ 
                message: 'Trips API connected to SQL Database!', 
                timestamp: new Date().toISOString(),
                status: 'connected',
                driver_count: driverCount
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
            message: 'Database connection failed', 
            error: error.message,
            status: 'error'
        });
    }
});

// Get active trips (for admin/parent tracking)
router.get('/active', async (req, res) => {
    try {
        // Return active schedules/trips currently running for public tracking consumers
    // Note: database stores running status as 'active'
    const [trips] = await pool.query(`
            SELECT 
                s.id as schedule_id,
                s.status,
                s.scheduled_date,
                s.start_time,
                b.id as bus_id,
                b.plate as bus_plate,
                b.current_lat,
                b.current_lng,
                b.speed,
                b.heading,
                b.students_onboard,
                r.id as route_id,
                r.name as route_name,
                d.id as driver_id,
                u.full_name as driver_name,
                u.phone as driver_phone
            FROM schedules s
            JOIN buses b ON s.bus_id = b.id
            JOIN routes r ON s.route_id = r.id
            LEFT JOIN drivers d ON b.driver_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE s.status = 'active'
            ORDER BY s.scheduled_date DESC, s.start_time DESC
        `);
        
        // Backward compatibility: also return id at top-level for existing clients
    const normalized = trips.map(row => ({ id: row.schedule_id, ...row }));
    res.set('Cache-Control', 'no-store');
    res.json({ count: trips.length, trips: normalized });
    } catch (error) {
        console.error('Error getting active trips:', error);
        res.status(500).json({ error: 'internal_error', message: error.message });
    }
});

// Admin: list active drivers with their current bus and route
router.get('/admin/active-drivers', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'admin_only' });
        }

        const [rows] = await pool.query(`
            SELECT 
                s.id as schedule_id,
                s.status,
                s.scheduled_date,
                s.start_time,
                b.id as bus_id,
                b.plate as bus_plate,
                b.current_lat,
                b.current_lng,
                b.speed,
                b.heading,
                b.students_onboard,
                r.id as route_id,
                r.name as route_name,
                d.id as driver_id,
                u.full_name as driver_name,
                u.phone as driver_phone
            FROM schedules s
            JOIN buses b ON s.bus_id = b.id
            JOIN routes r ON s.route_id = r.id
            LEFT JOIN drivers d ON b.driver_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE s.status = 'active'
            ORDER BY s.scheduled_date DESC, s.start_time DESC
        `);

    res.set('Cache-Control', 'no-store');
    res.json({ success: true, count: rows.length, drivers: rows });
    } catch (error) {
        console.error('Error getting active drivers:', error);
        res.status(500).json({ error: 'internal_error', message: error.message });
    }
});

// Admin: get students of a schedule regardless of driver, for monitoring
router.get('/admin/schedule/:id/students', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'admin_only' });
        }

        const { id } = req.params; // schedule_id
        const connection = await pool.getConnection();
        try {
            // Fetch schedule and ensure it exists
            const [scheduleRows] = await connection.execute(`
                SELECT s.id, s.route_id, s.bus_id, s.status, r.name as route_name, b.plate as bus_plate
                FROM schedules s
                JOIN routes r ON s.route_id = r.id
                LEFT JOIN buses b ON s.bus_id = b.id
                WHERE s.id = ?
            `, [id]);

            if (scheduleRows.length === 0) {
                return res.status(404).json({ error: 'schedule_not_found' });
            }

            const schedule = scheduleRows[0];

            // Students with trip status for this schedule
            const [studentRows] = await connection.execute(`
                SELECT 
                    s.id as student_id,
                    s.full_name as student_name,
                    s.grade,
                    s.class,
                    s.address as student_address,
                    s.home_lat as student_home_lat,
                    s.home_lng as student_home_lng,
                    rs.id as stop_id,
                    rs.name as stop_name,
                    rs.lat as stop_lat,
                    rs.lng as stop_lng,
                    rs.stop_order,
                    rs.is_pickup,
                    u.phone as parent_phone,
                    u.full_name as parent_name,
                    u.email as parent_email,
                    t.id as trip_id,
                    t.status as trip_status,
                    t.picked_at,
                    t.dropped_at,
                    t.notes
                FROM students s
                JOIN users u ON s.parent_user_id = u.id
                LEFT JOIN route_stops rs ON s.assigned_stop_id = rs.id
                LEFT JOIN trips t ON t.student_id = s.id AND t.schedule_id = ?
                WHERE s.assigned_bus_id = ? AND s.assigned_route_id = ?
                ORDER BY rs.stop_order ASC, s.full_name ASC
            `, [id, schedule.bus_id, schedule.route_id]);

            const students = studentRows.map(row => ({
                student_id: row.student_id,
                student_name: row.student_name,
                grade: row.grade,
                class: row.class,
                student_address: row.student_address || null,
                student_home_lat: row.student_home_lat != null ? parseFloat(row.student_home_lat) : null,
                student_home_lng: row.student_home_lng != null ? parseFloat(row.student_home_lng) : null,
                stop_id: row.stop_id,
                stop_name: row.stop_name || null,
                stop_lat: row.stop_lat != null ? parseFloat(row.stop_lat) : null,
                stop_lng: row.stop_lng != null ? parseFloat(row.stop_lng) : null,
                stop_order: row.stop_order || 999,
                is_pickup: !!row.is_pickup,
                parent_name: row.parent_name,
                parent_phone: row.parent_phone,
                parent_email: row.parent_email,
                trip_id: row.trip_id,
                trip_status: row.trip_status || 'waiting',
                picked_at: row.picked_at,
                dropped_at: row.dropped_at,
                notes: row.notes,
                // convenient fields for map display
                display_lat: row.stop_lat != null ? parseFloat(row.stop_lat) : (row.student_home_lat != null ? parseFloat(row.student_home_lat) : null),
                display_lng: row.stop_lng != null ? parseFloat(row.stop_lng) : (row.student_home_lng != null ? parseFloat(row.student_home_lng) : null),
                location_source: row.stop_lat != null ? 'stop' : (row.student_home_lat != null ? 'home' : 'none')
            }));

            res.set('Cache-Control', 'no-store');
            res.json({ success: true, schedule, students, total_count: students.length });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching admin schedule students:', error);
        res.status(500).json({ error: 'internal_error', message: error.message });
    }
});

// GET /api/trips/my-schedule - Get driver's today schedule with real SQL
router.get('/my-schedule', authMiddleware, async (req, res) => {
    try {
        console.log('[my-schedule] Request from user:', req.user.id, 'role:', req.user.role);
        
        if (req.user.role !== 'driver') {
            console.log('[my-schedule] Access denied - not a driver');
            return res.status(403).json({ error: 'access_denied', message: 'Only drivers can access schedules' });
        }

        const connection = await pool.getConnection();
        try {
            // Get driver info from user_id
            const [driverRows] = await connection.execute(
                'SELECT id as driver_id, full_name, active FROM drivers WHERE user_id = ?',
                [req.user.id]
            );

            console.log('[my-schedule] Driver query result:', driverRows);

            if (driverRows.length === 0) {
                console.log('[my-schedule] No driver profile found for user:', req.user.id);
                return res.json({ 
                    success: false,
                    driver: null,
                    schedules: [],
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString(),
                    message: 'Không tìm thấy hồ sơ tài xế. Vui lòng liên hệ quản trị viên.',
                    debug: {
                        user_id: req.user.id,
                        role: req.user.role
                    }
                });
            }

            const driver = driverRows[0];
            
            if (!driver.active) {
                console.log('[my-schedule] Driver is not active:', driver.driver_id);
                return res.json({ 
                    success: false,
                    driver: { id: driver.driver_id, name: driver.full_name },
                    schedules: [],
                    message: 'Tài khoản tài xế chưa được kích hoạt. Vui lòng liên hệ quản trị viên.'
                });
            }

            const driverId = driver.driver_id;
            const driverName = driver.full_name;

            console.log('[my-schedule] Found driver:', driverId, driverName);

            console.log('[my-schedule] Found driver:', driverId, driverName);

            // Get schedules for this driver (today and all future schedules within 30 days)
            const [scheduleRows] = await connection.execute(`
                SELECT 
                    s.id as schedule_id,
                    s.scheduled_date,
                    s.start_time,
                    s.end_time,
                    s.status as schedule_status,
                    r.id as route_id,
                    r.name as route_name,
                    r.description as route_description,
                    b.id as bus_id,
                    b.plate as license_plate,
                    b.capacity as bus_capacity,
                    b.current_lat,
                    b.current_lng,
                    b.students_onboard
                FROM schedules s
                JOIN routes r ON s.route_id = r.id
                JOIN buses b ON s.bus_id = b.id
                WHERE b.driver_id = ? 
                AND s.scheduled_date >= CURDATE()
                AND s.scheduled_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                ORDER BY s.scheduled_date ASC, s.start_time ASC
            `, [driverId]);

            console.log('[my-schedule] Found schedules:', scheduleRows.length);

            if (scheduleRows.length === 0) {
                return res.json({
                    success: true,
                    driver: { id: driverId, name: driverName },
                    schedules: [],
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString(),
                    message: 'Chưa có lịch trình nào được gán trong 30 ngày tới'
                });
            }

            // Get student counts for each schedule
            const schedules = await Promise.all(scheduleRows.map(async (schedule) => {
                const [studentCounts] = await connection.execute(`
                    SELECT 
                        COUNT(*) as total_students,
                        SUM(CASE WHEN s.assigned_bus_id = ? THEN 1 ELSE 0 END) as assigned_students
                    FROM students s
                    WHERE s.assigned_route_id = ? AND s.assigned_bus_id = ?
                `, [schedule.bus_id, schedule.route_id, schedule.bus_id]);

                const counts = studentCounts[0];
                
                return {
                    schedule_id: schedule.schedule_id,
                    date: schedule.scheduled_date,
                    start_time: schedule.start_time,
                    end_time: schedule.end_time,
                    route_name: schedule.route_name,
                    route_description: schedule.route_description,
                    license_plate: schedule.license_plate,
                    status: schedule.schedule_status,
                    pending_pickups: counts.assigned_students || 0,
                    onboard_students: schedule.students_onboard || 0,
                    completed_drops: 0
                };
            }));

            res.json({
                success: true,
                driver: { id: driverId, name: driverName },
                schedules: schedules,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching driver schedule:', error);
        res.status(500).json({ error: 'internal_error', message: error.message });
    }
});

// GET /api/trips/schedule/:id/students - Get students list for specific trip
router.get('/schedule/:id/students', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'access_denied' });
        }

        const { id } = req.params; // This is schedule_id
        const connection = await pool.getConnection();
        
        try {
            // Verify driver has access to this schedule via their assigned bus
            const [scheduleRows] = await connection.execute(`
                SELECT s.id, s.route_id, s.bus_id, b.driver_id, d.user_id
                FROM schedules s
                JOIN buses b ON s.bus_id = b.id
                JOIN drivers d ON b.driver_id = d.id
                WHERE s.id = ? AND d.user_id = ?
            `, [id, req.user.id]);

            if (scheduleRows.length === 0) {
                return res.status(403).json({ 
                    error: 'schedule_access_denied', 
                    message: 'No access to this schedule' 
                });
            }

            const schedule = scheduleRows[0];

            // Get students with their trip status from trips table
            const [studentRows] = await connection.execute(`
                SELECT 
                    s.id as student_id,
                    s.full_name as student_name,
                    s.grade,
                    s.class,
                    s.address as student_address,
                    s.home_lat as student_home_lat,
                    s.home_lng as student_home_lng,
                    rs.id as stop_id,
                    rs.name as stop_name,
                    rs.lat as stop_lat,
                    rs.lng as stop_lng,
                    rs.stop_order,
                    rs.is_pickup,
                    u.phone as parent_phone,
                    u.full_name as parent_name,
                    u.email as parent_email,
                    t.id as trip_id,
                    t.status as trip_status,
                    t.picked_at,
                    t.dropped_at,
                    t.notes
                FROM students s
                JOIN users u ON s.parent_user_id = u.id
                LEFT JOIN route_stops rs ON s.assigned_stop_id = rs.id
                LEFT JOIN trips t ON t.student_id = s.id AND t.schedule_id = ?
                WHERE s.assigned_bus_id = ? AND s.assigned_route_id = ?
                ORDER BY rs.stop_order ASC, s.full_name ASC
            `, [id, schedule.bus_id, schedule.route_id]);

            // Map data with trip information
            const students = studentRows.map(row => ({
                student_id: row.student_id,
                student_name: row.student_name,
                grade: row.grade,
                class: row.class,
                student_address: row.student_address || 'Chưa có địa chỉ',
                student_home_lat: row.student_home_lat != null ? parseFloat(row.student_home_lat) : null,
                student_home_lng: row.student_home_lng != null ? parseFloat(row.student_home_lng) : null,
                stop_id: row.stop_id,
                stop_name: row.stop_name || 'Chưa gán điểm đón',
                stop_lat: row.stop_lat != null ? parseFloat(row.stop_lat) : null,
                stop_lng: row.stop_lng != null ? parseFloat(row.stop_lng) : null,
                stop_order: row.stop_order || 999,
                is_pickup: !!row.is_pickup,
                parent_name: row.parent_name,
                parent_phone: row.parent_phone,
                parent_email: row.parent_email,
                trip_id: row.trip_id,
                trip_status: row.trip_status || 'waiting',
                picked_at: row.picked_at,
                dropped_at: row.dropped_at,
                notes: row.notes
            }));

            res.json({ 
                success: true,
                students,
                schedule_id: id,
                total_count: students.length
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error in schedule students:', error);
        res.status(500).json({ 
            error: 'database_error', 
            message: 'Failed to fetch students',
            details: error.message 
        });
    }
});

// PUT /api/trips/:tripId/status - Update trip status (pickup/drop)
router.put('/:tripId/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'access_denied' });
        }

        const { tripId } = req.params;
        const { status, notes } = req.body;

        // Validate status
        const validStatuses = ['waiting', 'onboard', 'dropped', 'absent'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'invalid_status',
                message: 'Status must be: waiting, onboard, dropped, or absent'
            });
        }

        const connection = await pool.getConnection();
        
        try {
            // Verify driver has access to this trip
            const [accessCheck] = await connection.execute(`
                SELECT t.id, s.full_name as student_name
                FROM trips t
                JOIN schedules sch ON t.schedule_id = sch.id
                JOIN buses b ON sch.bus_id = b.id
                JOIN drivers d ON b.driver_id = d.id
                JOIN students s ON t.student_id = s.id
                WHERE t.id = ? AND d.user_id = ?
            `, [tripId, req.user.id]);

            if (accessCheck.length === 0) {
                return res.status(403).json({ error: 'trip_access_denied' });
            }

            const studentName = accessCheck[0].student_name;

            // Update trip status with timestamp
            let updateQuery = 'UPDATE trips SET status = ?, updated_at = NOW()';
            let updateParams = [status];
            
            if (status === 'onboard') {
                updateQuery += ', picked_at = NOW()';
            } else if (status === 'dropped') {
                updateQuery += ', dropped_at = NOW()';
            }
            
            if (notes) {
                updateQuery += ', notes = ?';
                updateParams.push(notes);
            }
            
            updateQuery += ' WHERE id = ?';
            updateParams.push(tripId);

            const [result] = await connection.execute(updateQuery, updateParams);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'trip_not_found' });
            }

            // Update bus students_onboard count
            if (status === 'onboard') {
                await connection.execute(`
                    UPDATE buses b
                    JOIN schedules s ON b.id = s.bus_id
                    JOIN trips t ON s.id = t.schedule_id
                    SET b.students_onboard = (
                        SELECT COUNT(*) FROM trips t2 
                        JOIN schedules s2 ON t2.schedule_id = s2.id 
                        WHERE s2.bus_id = b.id AND t2.status = 'onboard'
                    )
                    WHERE t.id = ?
                `, [tripId]);
            } else if (status === 'dropped') {
                await connection.execute(`
                    UPDATE buses b
                    JOIN schedules s ON b.id = s.bus_id
                    JOIN trips t ON s.id = t.schedule_id
                    SET b.students_onboard = (
                        SELECT COUNT(*) FROM trips t2 
                        JOIN schedules s2 ON t2.schedule_id = s2.id 
                        WHERE s2.bus_id = b.id AND t2.status = 'onboard'
                    )
                    WHERE t.id = ?
                `, [tripId]);
            }

            res.json({ 
                success: true, 
                message: `Student ${studentName} status updated to ${status}`,
                trip_id: tripId,
                new_status: status,
                timestamp: new Date().toISOString()
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error updating trip status:', error);
        res.status(500).json({ 
            error: 'database_error', 
            message: 'Failed to update trip status',
            details: error.message 
        });
    }
});

// POST /api/trips/location - Update bus GPS location
router.post('/location', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'access_denied' });
        }

        const { lat, lng, speed = 0, heading = 0, accuracy = 10 } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ 
                error: 'invalid_location',
                message: 'Latitude and longitude are required'
            });
        }

        const connection = await pool.getConnection();
        
        try {
            // Get driver's bus
            const [busRows] = await connection.execute(`
                SELECT b.id, b.plate
                FROM buses b
                JOIN drivers d ON b.driver_id = d.id
                WHERE d.user_id = ? AND b.active = 1
            `, [req.user.id]);

            if (busRows.length === 0) {
                return res.json({ success: false, error: 'bus_not_found', message: 'No active bus assigned to this driver' });
            }

            const busId = busRows[0].id;
            const busPlate = busRows[0].plate;

            // Update bus location
            await connection.execute(`
                UPDATE buses 
                SET current_lat = ?, current_lng = ?, speed = ?, heading = ?, 
                    accuracy = ?, last_update = NOW(), updated_at = NOW()
                WHERE id = ?
            `, [lat, lng, speed, heading, accuracy, busId]);

            // Persist to history for analytics
            await connection.execute(`
                INSERT INTO realtime_locations (bus_id, lat, lng, speed, heading, accuracy)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [busId, lat, lng, speed, heading, accuracy]);

            res.json({ 
                success: true,
                message: 'Location updated successfully',
                bus: { id: busId, plate: busPlate },
                location: { lat, lng, speed, heading, accuracy },
                timestamp: new Date().toISOString()
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error updating location:', error);
        res.status(500).json({ 
            error: 'database_error', 
            message: 'Failed to update location',
            details: error.message 
        });
    }
});

// GET /api/trips/route/:routeId/stops - Get route stops for navigation
router.get('/route/:routeId/stops', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'access_denied' });
        }

        const { routeId } = req.params;
        const connection = await pool.getConnection();
        
        try {
            // Get route stops in order
            const [stopRows] = await connection.execute(`
                SELECT 
                    rs.id as stop_id,
                    rs.name as stop_name,
                    rs.lat,
                    rs.lng,
                    rs.stop_order,
                    rs.is_pickup,
                    COUNT(s.id) as student_count
                FROM route_stops rs
                LEFT JOIN students s ON rs.id = s.assigned_stop_id
                WHERE rs.route_id = ?
                GROUP BY rs.id
                ORDER BY rs.stop_order ASC
            `, [routeId]);

            const stops = stopRows.map(row => ({
                id: row.stop_id,
                name: row.stop_name,
                lat: parseFloat(row.lat),
                lng: parseFloat(row.lng),
                order: row.stop_order,
                is_pickup: !!row.is_pickup,
                student_count: row.student_count || 0
            }));

            res.json({ 
                success: true,
                route_id: routeId,
                stops,
                total_stops: stops.length
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error fetching route stops:', error);
        res.status(500).json({ 
            error: 'database_error', 
            message: 'Failed to fetch route stops',
            details: error.message 
        });
    }
});

// Note: Emergency alert APIs have been removed.

// POST /api/trips/schedule/:scheduleId/start - Start a trip
router.post('/schedule/:scheduleId/start', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'access_denied' });
        }

        const { scheduleId } = req.params;
        const connection = await pool.getConnection();
        
        try {
            // Verify driver has access to this schedule
            const [scheduleRows] = await connection.execute(`
                SELECT s.id, s.status, b.id as bus_id, b.plate
                FROM schedules s
                JOIN buses b ON s.bus_id = b.id
                JOIN drivers d ON b.driver_id = d.id
                WHERE s.id = ? AND d.user_id = ?
            `, [scheduleId, req.user.id]);

            if (scheduleRows.length === 0) {
                return res.status(403).json({ 
                    error: 'schedule_access_denied',
                    message: 'No access to this schedule' 
                });
            }

            const schedule = scheduleRows[0];

            // Update schedule status to 'active' (matches DB ENUM)
            await connection.execute(`
                UPDATE schedules 
                SET status = 'active', updated_at = NOW()
                WHERE id = ?
            `, [scheduleId]);

            // Auto-create trips for students if not exist
            const [existingTrips] = await connection.execute(
                'SELECT COUNT(*) as count FROM trips WHERE schedule_id = ?',
                [scheduleId]
            );

            if (existingTrips[0].count === 0) {
                // No trips exist, create them
                const [scheduleDetails] = await connection.execute(`
                    SELECT s.route_id, s.bus_id FROM schedules s WHERE s.id = ?
                `, [scheduleId]);

                if (scheduleDetails.length > 0) {
                    const { route_id, bus_id } = scheduleDetails[0];
                    
                    // Get all students assigned to this bus and route
                    const [studentsToAdd] = await connection.execute(`
                        SELECT id FROM students 
                        WHERE assigned_bus_id = ? AND assigned_route_id = ?
                    `, [bus_id, route_id]);

                    // Create trip for each student
                    const { v4: uuidv4 } = await import('uuid');
                    for (const student of studentsToAdd) {
                        const tripId = uuidv4();
                        await connection.execute(`
                            INSERT INTO trips (id, schedule_id, student_id, status, created_at, updated_at) 
                            VALUES (?, ?, ?, 'waiting', NOW(), NOW())
                        `, [tripId, scheduleId, student.id]);
                    }
                    console.log(`Auto-created ${studentsToAdd.length} trips for schedule ${scheduleId}`);
                }
            } else {
                // Trips exist, just update status to 'waiting' if they're still 'scheduled'
                await connection.execute(`
                    UPDATE trips 
                    SET status = 'waiting', updated_at = NOW()
                    WHERE schedule_id = ? AND status = 'scheduled'
                `, [scheduleId]);
            }

            res.json({ 
                success: true,
                message: 'Trip started successfully',
                schedule_id: scheduleId,
                bus_plate: schedule.plate,
                timestamp: new Date().toISOString()
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error starting trip:', error);
        res.status(500).json({ 
            error: 'database_error', 
            message: 'Failed to start trip',
            details: error.message 
        });
    }
});

// POST /api/trips/schedule/:scheduleId/complete - Complete a trip
router.post('/schedule/:scheduleId/complete', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'access_denied' });
        }

        const { scheduleId } = req.params;
        const connection = await pool.getConnection();
        
        try {
            // Verify driver has access to this schedule
            const [scheduleRows] = await connection.execute(`
                SELECT s.id, s.status, b.id as bus_id, b.plate
                FROM schedules s
                JOIN buses b ON s.bus_id = b.id
                JOIN drivers d ON b.driver_id = d.id
                WHERE s.id = ? AND d.user_id = ?
            `, [scheduleId, req.user.id]);

            if (scheduleRows.length === 0) {
                return res.status(403).json({ 
                    error: 'schedule_access_denied',
                    message: 'No access to this schedule' 
                });
            }

            const schedule = scheduleRows[0];

            // Update schedule status to 'completed'
            await connection.execute(`
                UPDATE schedules 
                SET status = 'completed', updated_at = NOW()
                WHERE id = ?
            `, [scheduleId]);

            // Mark any remaining trips as 'absent' if they're still waiting
            await connection.execute(`
                UPDATE trips 
                SET status = 'absent', updated_at = NOW()
                WHERE schedule_id = ? AND status = 'waiting'
            `, [scheduleId]);

            // Reset bus students_onboard counter
            await connection.execute(`
                UPDATE buses 
                SET students_onboard = 0, updated_at = NOW()
                WHERE id = ?
            `, [schedule.bus_id]);

            res.json({ 
                success: true,
                message: 'Trip completed successfully',
                schedule_id: scheduleId,
                bus_plate: schedule.plate,
                timestamp: new Date().toISOString()
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error completing trip:', error);
        res.status(500).json({ 
            error: 'database_error', 
            message: 'Failed to complete trip',
            details: error.message 
        });
    }
});

export default router;