import { pool } from './db/connection.js';

async function testDriverAPI() {
    try {
        console.log('Testing driver API queries...\n');
        
        // Test 1: Get drivers
        console.log('1. Testing drivers query...');
        const [drivers] = await pool.query('SELECT * FROM drivers LIMIT 5');
        console.log(`✓ Found ${drivers.length} drivers`);
        console.log(drivers);
        
        // Test 2: Get schedules for driver
        console.log('\n2. Testing schedules query for driver...');
        const driverId = 'd-001';
        const [schedules] = await pool.query(`
            SELECT 
                s.id as schedule_id,
                s.scheduled_date,
                s.start_time,
                s.status,
                r.name as route_name,
                b.plate as bus_plate
            FROM schedules s
            INNER JOIN routes r ON s.route_id = r.id
            LEFT JOIN buses b ON s.bus_id = b.id
            WHERE b.driver_id = ?
                AND s.scheduled_date = CURDATE()
            ORDER BY s.start_time
        `, [driverId]);
        console.log(`✓ Found ${schedules.length} schedules`);
        console.log(schedules);
        
        // Test 3: Get students for a schedule
        if (schedules.length > 0) {
            console.log('\n3. Testing students query for schedule...');
            const scheduleId = schedules[0].schedule_id;
            const [students] = await pool.query(`
                SELECT 
                    t.id as trip_id,
                    t.status as trip_status,
                    t.picked_at,
                    t.dropped_at,
                    s.id as student_id,
                    s.full_name,
                    s.grade,
                    s.class,
                    rs.name as stop_name,
                    rs.lat as stop_lat,
                    rs.lng as stop_lng,
                    rs.stop_order
                FROM trips t
                INNER JOIN students s ON t.student_id = s.id
                LEFT JOIN route_stops rs ON s.assigned_stop_id = rs.id
                WHERE t.schedule_id = ?
                ORDER BY rs.stop_order, s.full_name
            `, [scheduleId]);
            console.log(`✓ Found ${students.length} students`);
            console.log(students);
        }
        
        console.log('\n✅ All tests passed!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Test failed:', err);
        process.exit(1);
    }
}

testDriverAPI();
