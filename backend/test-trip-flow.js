import mysql from 'mysql2/promise';

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cnpm',
    waitForConnections: true,
    connectionLimit: 10
  });

  const scheduleId = 'e6f1aa13-fb89-421f-a497-d4f7faa832d1'; // Schedule hôm nay
  
  console.log('\n=== TESTING DRIVER TRIP FLOW ===\n');
  
  // 1. Check schedule exists
  const [schedules] = await pool.query(`
    SELECT s.id, s.status, s.scheduled_date, s.bus_id, s.route_id, b.plate, b.driver_id
    FROM schedules s
    JOIN buses b ON s.bus_id = b.id
    WHERE s.id = ?
  `, [scheduleId]);
  
  console.log('1️⃣ Schedule Info:');
  console.table(schedules);
  
  if (schedules.length === 0) {
    console.log('❌ Schedule not found!');
    await pool.end();
    return;
  }
  
  const schedule = schedules[0];
  
  // 2. Check trips for this schedule
  const [trips] = await pool.query(`
    SELECT t.id, t.student_id, t.status, s.full_name as student_name
    FROM trips t
    JOIN students s ON t.student_id = s.id
    WHERE t.schedule_id = ?
    ORDER BY t.created_at
  `, [scheduleId]);
  
  console.log(`\n2️⃣ Trips for this schedule: ${trips.length} trips`);
  if (trips.length > 0) {
    console.table(trips.slice(0, 5)); // Show first 5
  } else {
    console.log('⚠️ NO TRIPS FOUND! This is the problem.');
  }
  
  // 3. Check students assigned to this bus and route
  const [students] = await pool.query(`
    SELECT id, full_name, assigned_bus_id, assigned_route_id
    FROM students
    WHERE assigned_bus_id = ? AND assigned_route_id = ?
  `, [schedule.bus_id, schedule.route_id]);
  
  console.log(`\n3️⃣ Students assigned to bus/route: ${students.length} students`);
  console.table(students.slice(0, 5));
  
  // 4. Simulate start trip (what backend should do)
  if (trips.length === 0 && students.length > 0) {
    console.log('\n4️⃣ SIMULATING START TRIP (creating trips)...');
    
    const { v4: uuidv4 } = await import('uuid');
    let created = 0;
    
    for (const student of students) {
      const tripId = uuidv4();
      await pool.query(`
        INSERT INTO trips (id, schedule_id, student_id, status, created_at, updated_at) 
        VALUES (?, ?, ?, 'waiting', NOW(), NOW())
      `, [tripId, scheduleId, student.id]);
      created++;
    }
    
    console.log(`✅ Created ${created} trips for schedule ${scheduleId}`);
    
    // Update schedule status
    await pool.query(`
      UPDATE schedules SET status = 'in-progress' WHERE id = ?
    `, [scheduleId]);
    
    console.log('✅ Updated schedule status to in-progress');
    
    // Re-query trips
    const [newTrips] = await pool.query(`
      SELECT t.id, t.status, s.full_name
      FROM trips t
      JOIN students s ON t.student_id = s.id
      WHERE t.schedule_id = ?
      LIMIT 5
    `, [scheduleId]);
    
    console.log('\n📋 New trips created:');
    console.table(newTrips);
  }
  
  // 5. Test query that frontend uses
  console.log('\n5️⃣ Testing frontend query (GET /schedule/:id/students)...');
  const [frontendData] = await pool.query(`
    SELECT 
      s.id as student_id,
      s.full_name as student_name,
      t.id as trip_id,
      t.status as trip_status,
      rs.name as stop_name,
      rs.lat as stop_lat,
      rs.lng as stop_lng
    FROM students s
    JOIN users u ON s.parent_user_id = u.id
    LEFT JOIN route_stops rs ON s.assigned_stop_id = rs.id
    LEFT JOIN trips t ON t.student_id = s.id AND t.schedule_id = ?
    WHERE s.assigned_bus_id = ? AND s.assigned_route_id = ?
    ORDER BY rs.stop_order ASC
    LIMIT 5
  `, [scheduleId, schedule.bus_id, schedule.route_id]);
  
  console.log(`\nFrontend will see: ${frontendData.length} students`);
  console.table(frontendData);
  
  await pool.end();
  
  console.log('\n=== SUMMARY ===');
  console.log(`Schedule: ${schedule.status}`);
  console.log(`Students assigned: ${students.length}`);
  console.log(`Trips created: ${trips.length > 0 ? trips.length : 'NOW CREATED'}`);
  console.log(`\n✅ Flow should work now! Start trip will auto-create trips.`);
})().catch(console.error);
