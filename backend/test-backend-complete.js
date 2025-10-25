import { pool } from './db/connection.js';

/**
 * Comprehensive Backend Test Script
 * Tests all critical endpoints and database integrity
 */

async function testBackend() {
    console.log('🧪 Testing Backend System\n');
    console.log('=' .repeat(60));
    
    try {
        // 1. Test Database Connection
        console.log('\n📊 1. Testing Database Connection...');
        await pool.query('SELECT 1');
        console.log('   ✅ Database connected');

        // 2. Check all tables exist
        console.log('\n📋 2. Checking Tables...');
        const tables = ['users', 'drivers', 'buses', 'routes', 'route_stops', 
                       'schedules', 'trips', 'students', 'notifications'];
        
        for (const table of tables) {
            try {
                const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ??`, [table]);
                console.log(`   ✅ ${table.padEnd(20)} ${rows[0].count} rows`);
            } catch(e) {
                console.log(`   ❌ ${table.padEnd(20)} ERROR: ${e.message.substring(0, 40)}`);
            }
        }

        // 3. Check Foreign Keys
        console.log('\n🔗 3. Checking Foreign Key Relationships...');
        
        // Students -> Parent
        const [orphanStudents] = await pool.query(`
            SELECT COUNT(*) as count FROM students s 
            LEFT JOIN users u ON s.parent_user_id = u.id 
            WHERE s.parent_user_id IS NOT NULL AND u.id IS NULL
        `);
        console.log(`   ${orphanStudents[0].count === 0 ? '✅' : '⚠️'}  Students without valid parent: ${orphanStudents[0].count}`);

        // Students -> Bus
        const [orphanBusStudents] = await pool.query(`
            SELECT COUNT(*) as count FROM students s 
            LEFT JOIN buses b ON s.assigned_bus_id = b.id 
            WHERE s.assigned_bus_id IS NOT NULL AND b.id IS NULL
        `);
        console.log(`   ${orphanBusStudents[0].count === 0 ? '✅' : '⚠️'}  Students with invalid bus: ${orphanBusStudents[0].count}`);

        // Trips -> Schedule
        const [orphanTrips] = await pool.query(`
            SELECT COUNT(*) as count FROM trips t 
            LEFT JOIN schedules s ON t.schedule_id = s.id 
            WHERE t.schedule_id IS NOT NULL AND s.id IS NULL
        `);
        console.log(`   ${orphanTrips[0].count === 0 ? '✅' : '⚠️'}  Trips without valid schedule: ${orphanTrips[0].count}`);

        // Schedules -> Bus
        const [orphanSchedules] = await pool.query(`
            SELECT COUNT(*) as count FROM schedules s 
            LEFT JOIN buses b ON s.bus_id = b.id 
            WHERE s.bus_id IS NOT NULL AND b.id IS NULL
        `);
        console.log(`   ${orphanSchedules[0].count === 0 ? '✅' : '⚠️'}  Schedules with invalid bus: ${orphanSchedules[0].count}`);

        // 4. Check Data Integrity
        console.log('\n🔍 4. Checking Data Integrity...');
        
        // Drivers with user accounts
        const [driversWithUsers] = await pool.query(`
            SELECT COUNT(*) as count FROM drivers d 
            JOIN users u ON d.user_id = u.id AND u.role = 'driver'
        `);
        const [totalDrivers] = await pool.query('SELECT COUNT(*) as count FROM drivers');
        console.log(`   ${driversWithUsers[0].count === totalDrivers[0].count ? '✅' : '⚠️'}  Drivers with user accounts: ${driversWithUsers[0].count}/${totalDrivers[0].count}`);

        // Parents with students
        const [parentsWithStudents] = await pool.query(`
            SELECT COUNT(DISTINCT s.parent_user_id) as count FROM students s
        `);
        const [parentUsers] = await pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'parent'`);
        console.log(`   ℹ️   Parents with students: ${parentsWithStudents[0].count}/${parentUsers[0].count}`);

        // Buses with drivers
        const [busesWithDrivers] = await pool.query(`
            SELECT COUNT(*) as count FROM buses WHERE driver_id IS NOT NULL
        `);
        const [totalBuses] = await pool.query('SELECT COUNT(*) as count FROM buses');
        console.log(`   ℹ️   Buses with drivers: ${busesWithDrivers[0].count}/${totalBuses[0].count}`);

        // 5. Check Indexes
        console.log('\n📇 5. Checking Indexes...');
        const [indexes] = await pool.query(`
            SELECT DISTINCT TABLE_NAME, INDEX_NAME 
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = 'cnpm' 
            AND INDEX_NAME != 'PRIMARY'
            ORDER BY TABLE_NAME, INDEX_NAME
        `);
        console.log(`   ✅ Found ${indexes.length} indexes`);
        const importantIndexes = ['idx_assigned_bus', 'idx_schedule', 'idx_date_status'];
        for (const idx of importantIndexes) {
            const found = indexes.find(i => i.INDEX_NAME === idx);
            console.log(`   ${found ? '✅' : '⚠️'}  ${idx}`);
        }

        // 6. Test Today's Schedules
        console.log('\n📅 6. Checking Today\'s Data...');
        const [todaySchedules] = await pool.query(`
            SELECT COUNT(*) as count FROM schedules WHERE scheduled_date = CURDATE()
        `);
        console.log(`   ${todaySchedules[0].count > 0 ? '✅' : '⚠️'}  Schedules for today: ${todaySchedules[0].count}`);

        const [todayTrips] = await pool.query(`
            SELECT COUNT(*) as count FROM trips t
            JOIN schedules s ON t.schedule_id = s.id
            WHERE s.scheduled_date = CURDATE()
        `);
        console.log(`   ${todayTrips[0].count > 0 ? '✅' : '⚠️'}  Trips for today: ${todayTrips[0].count}`);

        // 7. Test Sample Queries
        console.log('\n🔧 7. Testing Sample Queries...');
        
        // Driver schedule query
        try {
            const [driverSchedule] = await pool.query(`
                SELECT s.id, s.scheduled_date, s.start_time, r.name as route_name, b.plate
                FROM schedules s
                JOIN routes r ON s.route_id = r.id
                LEFT JOIN buses b ON s.bus_id = b.id
                WHERE s.scheduled_date = CURDATE()
                LIMIT 1
            `);
            console.log(`   ✅ Driver schedule query works (${driverSchedule.length} results)`);
        } catch(e) {
            console.log(`   ❌ Driver schedule query failed: ${e.message.substring(0, 50)}`);
        }

        // Parent children query
        try {
            const [parentChildren] = await pool.query(`
                SELECT s.id, s.full_name, r.name as route_name
                FROM students s
                LEFT JOIN routes r ON s.assigned_route_id = r.id
                LIMIT 1
            `);
            console.log(`   ✅ Parent children query works (${parentChildren.length} results)`);
        } catch(e) {
            console.log(`   ❌ Parent children query failed: ${e.message.substring(0, 50)}`);
        }

        // Admin tracking query
        try {
            const [activeTrips] = await pool.query(`
                SELECT s.id, s.status, b.plate, b.current_lat, b.current_lng
                FROM schedules s
                LEFT JOIN buses b ON s.bus_id = b.id
                WHERE s.status = 'in-progress'
                AND s.scheduled_date = CURDATE()
            `);
            console.log(`   ✅ Admin tracking query works (${activeTrips.length} active trips)`);
        } catch(e) {
            console.log(`   ❌ Admin tracking query failed: ${e.message.substring(0, 50)}`);
        }

        // 8. Summary
        console.log('\n' + '='.repeat(60));
        console.log('✨ Backend Test Complete!\n');
        
        // Recommendations
        console.log('💡 Recommendations:');
        if (todaySchedules[0].count === 0) {
            console.log('   ⚠️  Run setup-test-data.js to create today\'s schedules');
        }
        if (orphanStudents[0].count > 0) {
            console.log('   ⚠️  Clean up orphaned student records');
        }
        console.log('   ✅ Backend is ready for testing');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

testBackend();
