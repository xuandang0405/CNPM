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
  
  console.log('\n=== Testing UPDATED Driver Schedule Query ===\n');
  
  // Check current database date
  const [dateCheck] = await pool.query('SELECT CURDATE() as today, DATE_ADD(CURDATE(), INTERVAL 7 DAY) as next_week');
  console.log('📅 Date range:');
  console.table(dateCheck);
  
  // NEW Query: Today and next 7 days
  const [newQuery] = await pool.query(`
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
      AND s.scheduled_date >= CURDATE()
      AND s.scheduled_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      AND s.status IN ('scheduled', 'active', 'in-progress') 
    ORDER BY s.scheduled_date ASC, s.start_time ASC
  `, [driverId]);
  
  console.log(`\n✅ NEW Query (Today + 7 days): ${newQuery.length} schedules found`);
  console.table(newQuery);
  
  // Old query for comparison
  const [oldQuery] = await pool.query(`
    SELECT 
      s.id as schedule_id, 
      DATE_FORMAT(s.scheduled_date, '%Y-%m-%d') as scheduled_date,
      s.start_time, 
      s.status, 
      b.plate 
    FROM schedules s 
    JOIN buses b ON s.bus_id = b.id 
    WHERE b.driver_id = ? 
      AND s.scheduled_date = CURDATE() 
      AND s.status IN ('scheduled', 'active', 'in-progress')
  `, [driverId]);
  
  console.log(`\n❌ OLD Query (Today only): ${oldQuery.length} schedules found`);
  if (oldQuery.length > 0) console.table(oldQuery);
  
  await pool.end();
  
  console.log('\n=== RESULT ===');
  if (newQuery.length > 0) {
    console.log(`✅ SUCCESS! Driver will now see ${newQuery.length} schedule(s):`);
    newQuery.forEach(s => console.log(`   📅 ${s.scheduled_date} at ${s.start_time}`));
  } else {
    console.log('⚠️ Still no schedules. Check if schedules exist within 7 days.');
  }
})().catch(console.error);
