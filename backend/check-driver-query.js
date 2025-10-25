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

  const driverId = 'f4f7752c-fcb8-4df3-86d4-d4c8026c18f8';
  
  console.log('\n=== Testing Driver Schedule Query ===\n');
  
  // Check current database date
  const [dateCheck] = await pool.query('SELECT CURDATE() as today, NOW() as now');
  console.log('📅 Database date:');
  console.table(dateCheck);
  
  // Test query with CURDATE()
  const [todaySchedules] = await pool.query(`
    SELECT 
      s.id as schedule_id, 
      DATE_FORMAT(s.scheduled_date, '%Y-%m-%d') as scheduled_date,
      s.start_time, 
      s.status, 
      b.plate, 
      b.driver_id 
    FROM schedules s 
    JOIN buses b ON s.bus_id = b.id 
    WHERE b.driver_id = ? 
      AND s.scheduled_date = CURDATE() 
      AND s.status IN ('scheduled', 'active', 'in-progress') 
    ORDER BY s.start_time
  `, [driverId]);
  
  console.log(`\n🔍 Schedules for TODAY (CURDATE()): ${todaySchedules.length} found`);
  if (todaySchedules.length > 0) {
    console.table(todaySchedules);
  }
  
  // All schedules for this driver
  const [allSchedules] = await pool.query(`
    SELECT 
      s.id as schedule_id, 
      DATE_FORMAT(s.scheduled_date, '%Y-%m-%d') as scheduled_date,
      s.start_time, 
      s.status, 
      b.plate, 
      b.driver_id 
    FROM schedules s 
    JOIN buses b ON s.bus_id = b.id 
    WHERE b.driver_id = ? 
      AND s.status IN ('scheduled', 'active', 'in-progress') 
    ORDER BY s.scheduled_date DESC 
    LIMIT 10
  `, [driverId]);
  
  console.log(`\n📋 All schedules for driver (last 10): ${allSchedules.length} found`);
  console.table(allSchedules);
  
  await pool.end();
  
  // Analysis
  console.log('\n=== ANALYSIS ===');
  if (todaySchedules.length === 0 && allSchedules.length > 0) {
    console.log('⚠️ ISSUE: Driver has schedules, but NONE for today!');
    console.log('📌 Scheduled dates are:');
    allSchedules.forEach(s => console.log(`   - ${s.scheduled_date} (${s.start_time})`));
    console.log('\n💡 SOLUTION: Create a schedule with scheduled_date = TODAY');
  } else if (allSchedules.length === 0) {
    console.log('❌ ERROR: No schedules found for this driver at all!');
    console.log('💡 Check if bus is assigned to driver in database');
  } else {
    console.log(`✅ Driver should see ${todaySchedules.length} schedule(s) today`);
  }
})().catch(console.error);
