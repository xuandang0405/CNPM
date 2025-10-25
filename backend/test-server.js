import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from './db/connection.js';

const app = express();
const JWT_SECRET = 'dev_jwt_secret_change_me';

app.use(express.json());

// Test simple endpoint
app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM drivers');
        res.json({ ok: true, driver_count: rows[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test my-schedule endpoint
app.get('/api/my-schedule', async (req, res) => {
    try {
        const driverId = 'd-001';
        
        const [scheduleRows] = await pool.query(`
            SELECT 
                s.id as schedule_id,
                s.scheduled_date,
                s.start_time,
                s.status as schedule_status,
                r.name as route_name,
                b.plate as bus_plate,
                COUNT(t.id) as total_students
            FROM schedules s
            JOIN routes r ON s.route_id = r.id
            LEFT JOIN buses b ON s.bus_id = b.id
            LEFT JOIN trips t ON s.id = t.schedule_id
            WHERE b.driver_id = ? 
            AND s.scheduled_date = CURDATE()
            GROUP BY s.id
        `, [driverId]);
        
        res.json({ ok: true, schedules: scheduleRows });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 25568;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
