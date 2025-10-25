import { pool } from './db/connection.js';

async function setupTestData() {
    const connection = await pool.getConnection();
    
    try {
        console.log('🔧 Setting up test data...\n');

        // 1. Get driver and bus info
        const [drivers] = await connection.query(`
            SELECT d.id as driver_id, d.user_id, d.full_name, b.id as bus_id, b.plate 
            FROM drivers d
            LEFT JOIN buses b ON d.id = b.driver_id
            LIMIT 1
        `);

        if (drivers.length === 0) {
            console.log('❌ No driver found in database!');
            return;
        }

        const driver = drivers[0];
        console.log('✓ Found driver:', driver.full_name, '(', driver.driver_id, ')');
        console.log('✓ Bus:', driver.plate || 'NO BUS ASSIGNED');

        if (!driver.bus_id) {
            console.log('⚠️  Driver has no bus assigned!');
            return;
        }

        // 2. Get route
        const [routes] = await connection.query('SELECT id, name FROM routes LIMIT 1');
        if (routes.length === 0) {
            console.log('❌ No route found!');
            return;
        }

        const route = routes[0];
        console.log('✓ Route:', route.name, '(', route.id, ')');

        // 3. Get or create students assigned to this bus and route
        let [students] = await connection.query(`
            SELECT id, full_name 
            FROM students 
            WHERE assigned_bus_id = ? AND assigned_route_id = ?
            LIMIT 5
        `, [driver.bus_id, route.id]);

        if (students.length === 0) {
            console.log('⚠️  No students assigned to this bus and route');
            console.log('📝 Updating existing students...');
            
            // Get any students
            const [anyStudents] = await connection.query('SELECT id FROM students LIMIT 3');
            
            if (anyStudents.length > 0) {
                // Assign them to this bus and route
                for (const student of anyStudents) {
                    await connection.query(`
                        UPDATE students 
                        SET assigned_bus_id = ?, assigned_route_id = ?
                        WHERE id = ?
                    `, [driver.bus_id, route.id, student.id]);
                }
                
                // Fetch again
                [students] = await connection.query(`
                    SELECT id, full_name 
                    FROM students 
                    WHERE assigned_bus_id = ? AND assigned_route_id = ?
                `, [driver.bus_id, route.id]);
                
                console.log(`✓ Assigned ${students.length} students to bus ${driver.plate}`);
            } else {
                console.log('❌ No students in database!');
                return;
            }
        }

        console.log(`✓ Found ${students.length} students on this route`);
        students.forEach(s => console.log('  -', s.full_name));

        // 4. Delete old test schedules for today
        await connection.query(`
            DELETE FROM trips 
            WHERE schedule_id IN (
                SELECT id FROM schedules WHERE scheduled_date = CURDATE()
            )
        `);
        await connection.query('DELETE FROM schedules WHERE scheduled_date = CURDATE()');
        console.log('\n✓ Cleaned up old schedules for today');

        // 5. Create schedule for TODAY
        const scheduleId = 'schedule-test-' + Date.now();
        await connection.query(`
            INSERT INTO schedules (id, route_id, bus_id, scheduled_date, start_time, end_time, status, created_at, updated_at)
            VALUES (?, ?, ?, CURDATE(), '08:00:00', '09:00:00', 'scheduled', NOW(), NOW())
        `, [scheduleId, route.id, driver.bus_id]);

        console.log('✓ Created schedule:', scheduleId);

        // 6. Create trips for each student
        let tripCount = 0;
        for (const student of students) {
            const tripId = `trip-${Date.now()}-${tripCount}`;
            await connection.query(`
                INSERT INTO trips (id, schedule_id, student_id, status, created_at, updated_at)
                VALUES (?, ?, ?, 'scheduled', NOW(), NOW())
            `, [tripId, scheduleId, student.id]);
            tripCount++;
        }

        console.log(`✓ Created ${tripCount} trips for students`);

        // 7. Verify the setup
        const [schedules] = await connection.query(`
            SELECT 
                s.id, s.scheduled_date, s.start_time, s.status,
                r.name as route_name,
                b.plate as bus_plate,
                COUNT(t.id) as trip_count
            FROM schedules s
            JOIN routes r ON s.route_id = r.id
            JOIN buses b ON s.bus_id = b.id
            LEFT JOIN trips t ON s.id = t.schedule_id
            WHERE s.scheduled_date = CURDATE()
            GROUP BY s.id
        `);

        console.log('\n📋 Final setup:');
        console.log(JSON.stringify(schedules, null, 2));

        console.log('\n✅ Test data setup complete!');
        console.log('\n🚀 Now you can:');
        console.log('   1. Login as driver with user_id:', driver.user_id);
        console.log('   2. See today\'s schedule');
        console.log('   3. Start the trip');
        console.log('   4. Track on admin dashboard');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

setupTestData();
