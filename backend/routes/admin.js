import express from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db/connection.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me'

function adminMiddleware(req, res, next){
  const hdr = req.headers.authorization
  if (!hdr || !hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_token' })
  const token = hdr.slice(7)
  try{
    const data = jwt.verify(token, JWT_SECRET)
    if (data.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
    req.user = { id: data.sub, role: data.role }
    next()
  }catch(e){
    return res.status(401).json({ error: 'invalid_token' })
  }
}

// ===== USERS ENDPOINTS =====
// list users (admin only)
router.get('/users', adminMiddleware, async (req, res) => {
  try{
    const { role } = req.query
    let query = 'SELECT id, email, role, full_name, phone, created_at FROM users'
    let params = []
    
    if (role) {
      query += ' WHERE role = ?'
      params.push(role)
    }
    
    query += ' ORDER BY created_at DESC LIMIT 200'
    
    const [rows] = await pool.query(query, params)
    res.json({ count: rows.length, users: rows })
  }catch(err){
    console.error('admin/users error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// delete user
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try{
    const id = req.params.id
    await pool.query('DELETE FROM users WHERE id = ?',[id])
    res.json({ ok: true })
  }catch(err){
    console.error('admin/delete user error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// ===== BUSES ENDPOINTS =====
// list buses (admin only)
router.get('/buses', adminMiddleware, async (req, res) => {
  try{
    const [rows] = await pool.query(
      'SELECT b.id, b.plate, b.capacity, b.active, b.students_onboard, b.current_lat, b.current_lng, d.id as driver_id, u.full_name as driver_name FROM buses b LEFT JOIN drivers d ON b.driver_id = d.id LEFT JOIN users u ON d.user_id = u.id ORDER BY b.plate'
    )
    res.json({ count: rows.length, buses: rows })
  }catch(err){ 
    console.error('admin/buses error', err)
    res.status(500).json({ error: 'internal_error' }) 
  }
})

// create bus
router.post('/buses', adminMiddleware, async (req, res) => {
  try{
    const { plate, capacity } = req.body
    if (!plate) return res.status(400).json({ error: 'plate_required' })
    
    const { v4: uuidv4 } = await import('uuid')
    const id = uuidv4()
    await pool.query('INSERT INTO buses (id, plate, capacity, active) VALUES (?,?,?,?)', [id, plate, capacity || 50, true])
    res.json({ id, plate, capacity: capacity || 50, active: true })
  }catch(err){ 
    console.error('admin/create bus error', err)
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'duplicate_plate' })
    res.status(500).json({ error: 'internal_error' }) 
  }
})

// update bus
router.put('/buses/:id', adminMiddleware, async (req, res) => {
  try{
    const busId = req.params.id
    const { plate, capacity, active, driver_id } = req.body
    
    let updateFields = []
    let updateValues = []
    if (plate !== undefined) { updateFields.push('plate = ?'); updateValues.push(plate) }
    if (capacity !== undefined) { updateFields.push('capacity = ?'); updateValues.push(capacity) }
    if (active !== undefined) { updateFields.push('active = ?'); updateValues.push(active) }
    if (driver_id !== undefined) { updateFields.push('driver_id = ?'); updateValues.push(driver_id) }
    
    if (updateFields.length === 0) return res.json({ ok: true, id: busId })
    
    const query = `UPDATE buses SET ${updateFields.join(', ')} WHERE id = ?`
    await pool.query(query, [...updateValues, busId])
    res.json({ ok: true, id: busId })
  }catch(err){ 
    console.error('admin/update bus error', err)
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'duplicate_plate' })
    res.status(500).json({ error: 'internal_error' }) 
  }
})

// delete bus
router.delete('/buses/:id', adminMiddleware, async (req, res) => {
  try{
    await pool.query('DELETE FROM buses WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  }catch(err){ 
    console.error('admin/delete bus error', err)
    res.status(500).json({ error: 'internal_error' }) 
  }
})

// ===== DRIVERS ENDPOINTS =====
// list drivers
router.get('/drivers', adminMiddleware, async (req, res) => {
  try{
    const [rows] = await pool.query(
      `SELECT 
        d.id, 
        d.license_number, 
        d.active, 
        d.created_at, 
        u.id as user_id, 
        u.full_name, 
        u.email, 
        u.phone,
        b.id as bus_id,
        b.plate as bus_plate
      FROM drivers d 
      LEFT JOIN users u ON d.user_id = u.id 
      LEFT JOIN buses b ON b.driver_id = d.id
      ORDER BY u.full_name`
    )
    res.json({ count: rows.length, drivers: rows })
  }catch(err){
    console.error('admin/drivers error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// create driver with user account
router.post('/drivers', adminMiddleware, async (req, res) => {
  try{
    const { full_name, email, phone, password, license_number, bus_id } = req.body
    console.log('Creating driver with data:', { full_name, email, phone, password: !!password, license_number, bus_id })
    
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'required_fields_missing', message: 'Họ tên, email và mật khẩu là bắt buộc' })
    }
    
    const bcrypt = await import('bcryptjs')
    const { v4: uuidv4 } = await import('uuid')
    
    // Check if email exists
    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'email_exists', message: 'Email đã tồn tại' })
    }
    
    // Create user account
    const userId = uuidv4()
    const hashedPassword = await bcrypt.default.hash(password, 10)
    await pool.query(
      'INSERT INTO users (id, role, email, password_hash, full_name, phone) VALUES (?,?,?,?,?,?)',
      [userId, 'driver', email, hashedPassword, full_name, phone || null]
    )
    
    // Create driver record
    const driverId = uuidv4()
    await pool.query(
      'INSERT INTO drivers (id, user_id, full_name, phone, license_number, active) VALUES (?,?,?,?,?,?)',
      [driverId, userId, full_name, phone || null, license_number || null, true]
    )
    
    // Assign bus if provided
    if (bus_id) {
      await pool.query('UPDATE buses SET driver_id = ? WHERE id = ?', [driverId, bus_id])
    }
    
    console.log('Driver created successfully:', driverId)
    res.status(201).json({ 
      id: driverId, 
      user_id: userId,
      full_name, 
      email,
      phone,
      license_number,
      bus_id: bus_id || null,
      active: true 
    })
  }catch(err){
    console.error('admin/create driver error', err)
    res.status(500).json({ error: 'internal_error', message: err.message })
  }
})

// update driver
router.put('/drivers/:id', adminMiddleware, async (req, res) => {
  try{
    const driverId = req.params.id
    const { full_name, phone, email, license_number, active, bus_id } = req.body
    
    // Update driver record
    let driverUpdateFields = []
    let driverUpdateValues = []
    if (full_name !== undefined) { driverUpdateFields.push('full_name = ?'); driverUpdateValues.push(full_name) }
    if (phone !== undefined) { driverUpdateFields.push('phone = ?'); driverUpdateValues.push(phone) }
    if (license_number !== undefined) { driverUpdateFields.push('license_number = ?'); driverUpdateValues.push(license_number) }
    if (active !== undefined) { driverUpdateFields.push('active = ?'); driverUpdateValues.push(active) }
    
    if (driverUpdateFields.length > 0) {
      const query = `UPDATE drivers SET ${driverUpdateFields.join(', ')} WHERE id = ?`
      await pool.query(query, [...driverUpdateValues, driverId])
    }
    
    // Update user record if needed
    const [driverRows] = await pool.query('SELECT user_id FROM drivers WHERE id = ?', [driverId])
    if (driverRows.length > 0 && driverRows[0].user_id) {
      let userUpdateFields = []
      let userUpdateValues = []
      if (full_name !== undefined) { userUpdateFields.push('full_name = ?'); userUpdateValues.push(full_name) }
      if (phone !== undefined) { userUpdateFields.push('phone = ?'); userUpdateValues.push(phone) }
      if (email !== undefined) { userUpdateFields.push('email = ?'); userUpdateValues.push(email) }
      
      if (userUpdateFields.length > 0) {
        const userQuery = `UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = ?`
        await pool.query(userQuery, [...userUpdateValues, driverRows[0].user_id])
      }
    }
    
    // Update bus assignment
    if (bus_id !== undefined) {
      // Remove this driver from all buses first
      await pool.query('UPDATE buses SET driver_id = NULL WHERE driver_id = ?', [driverId])
      // Assign to new bus if provided
      if (bus_id) {
        await pool.query('UPDATE buses SET driver_id = ? WHERE id = ?', [driverId, bus_id])
      }
    }
    
    res.json({ ok: true, id: driverId })
  }catch(err){
    console.error('admin/update driver error', err)
    res.status(500).json({ error: 'internal_error', message: err.message })
  }
})

// delete driver
router.delete('/drivers/:id', adminMiddleware, async (req, res) => {
  try{
    // Delete related records first if needed
    await pool.query('UPDATE buses SET driver_id = NULL WHERE driver_id = ?', [req.params.id])
    await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  }catch(err){
    console.error('admin/delete driver error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// ===== ROUTES ENDPOINTS =====
// list routes
router.get('/routes', adminMiddleware, async (req, res) => {
  try{
    const [routes] = await pool.query(
      'SELECT r.id, r.name, r.description, r.active, r.created_at FROM routes r ORDER BY r.name'
    )
    
    // Get stops for each route
    for (let route of routes) {
      const [stops] = await pool.query(
        'SELECT id, name, lat, lng, stop_order, is_pickup FROM route_stops WHERE route_id = ? ORDER BY stop_order',
        [route.id]
      )
      route.stops = stops || []
    }
    
    res.json({ count: routes.length, routes })
  }catch(err){
    console.error('admin/routes error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// create route
router.post('/routes', adminMiddleware, async (req, res) => {
  try{
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'name_required' })
    
    const { v4: uuidv4 } = await import('uuid')
    const id = uuidv4()
    await pool.query('INSERT INTO routes (id, name, description, active) VALUES (?,?,?,?)', [id, name, description || '', true])
    res.json({ id, name, description: description || '', active: true, stops: [] })
  }catch(err){
    console.error('admin/create route error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// update route
router.put('/routes/:id', adminMiddleware, async (req, res) => {
  try{
    const routeId = req.params.id
    const { name, description, active } = req.body
    
    let updateFields = []
    let updateValues = []
    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name) }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description) }
    if (active !== undefined) { updateFields.push('active = ?'); updateValues.push(active) }
    
    if (updateFields.length === 0) return res.json({ ok: true, id: routeId })
    
    const query = `UPDATE routes SET ${updateFields.join(', ')} WHERE id = ?`
    await pool.query(query, [...updateValues, routeId])
    res.json({ ok: true, id: routeId })
  }catch(err){
    console.error('admin/update route error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// delete route
router.delete('/routes/:id', adminMiddleware, async (req, res) => {
  try{
    await pool.query('DELETE FROM routes WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  }catch(err){
    console.error('admin/delete route error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// ===== SCHEDULES ENDPOINTS =====
// list schedules
router.get('/schedules', adminMiddleware, async (req, res) => {
  try{
    const [schedules] = await pool.query(
      'SELECT s.id, s.route_id, s.bus_id, s.scheduled_date, s.start_time, s.end_time, s.status, r.name as route_name, b.plate as bus_plate FROM schedules s LEFT JOIN routes r ON s.route_id = r.id LEFT JOIN buses b ON s.bus_id = b.id ORDER BY s.scheduled_date DESC, s.start_time'
    )
    res.json({ count: schedules.length, schedules })
  }catch(err){
    console.error('admin/schedules error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// create schedule
router.post('/schedules', adminMiddleware, async (req, res) => {
  try{
    const { route_id, bus_id, scheduled_date, start_time } = req.body
    if (!route_id || !scheduled_date || !start_time) {
      return res.status(400).json({ error: 'required_fields_missing', message: 'Route, date và start time là bắt buộc' })
    }
    
    const { v4: uuidv4 } = await import('uuid')
    const scheduleId = uuidv4()
    
    // Create schedule
    await pool.query(
      'INSERT INTO schedules (id, route_id, bus_id, scheduled_date, start_time, status) VALUES (?,?,?,?,?,?)',
      [scheduleId, route_id, bus_id || null, scheduled_date, start_time, 'scheduled']
    )
    
    console.log(`Created schedule ${scheduleId}`)
    
    // Auto-create trips for students assigned to this bus and route
    if (bus_id) {
      const [students] = await pool.query(
        'SELECT id FROM students WHERE assigned_bus_id = ? AND assigned_route_id = ?',
        [bus_id, route_id]
      )
      
      console.log(`Found ${students.length} students for bus ${bus_id} and route ${route_id}`)
      
      for (const student of students) {
        const tripId = uuidv4()
        await pool.query(
          'INSERT INTO trips (id, schedule_id, student_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [tripId, scheduleId, student.id, 'scheduled']
        )
      }
      
      console.log(`Auto-created ${students.length} trips for schedule ${scheduleId}`)
    }
    
    res.status(201).json({ 
      id: scheduleId, 
      route_id, 
      bus_id: bus_id || null, 
      scheduled_date, 
      start_time, 
      status: 'scheduled',
      trips_created: bus_id ? 'yes' : 'no'
    })
  }catch(err){
    console.error('admin/create schedule error', err)
    res.status(500).json({ error: 'internal_error', message: err.message })
  }
})

// update schedule
router.put('/schedules/:id', adminMiddleware, async (req, res) => {
  try{
    const scheduleId = req.params.id
    const { bus_id, status, end_time } = req.body
    
    let updateFields = []
    let updateValues = []
    if (bus_id !== undefined) { updateFields.push('bus_id = ?'); updateValues.push(bus_id) }
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status) }
    if (end_time !== undefined) { updateFields.push('end_time = ?'); updateValues.push(end_time) }
    
    if (updateFields.length === 0) return res.json({ ok: true, id: scheduleId })
    
    const query = `UPDATE schedules SET ${updateFields.join(', ')} WHERE id = ?`
    await pool.query(query, [...updateValues, scheduleId])
    res.json({ ok: true, id: scheduleId })
  }catch(err){
    console.error('admin/update schedule error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// delete schedule
router.delete('/schedules/:id', adminMiddleware, async (req, res) => {
  try{
    await pool.query('DELETE FROM schedules WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  }catch(err){
    console.error('admin/delete schedule error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// ===== TRIPS ENDPOINTS =====
// list trips
router.get('/trips', adminMiddleware, async (req, res) => {
  try{
    const [trips] = await pool.query(
      'SELECT t.id, t.schedule_id, t.student_id, t.status, t.picked_at, t.dropped_at, st.full_name as student_name, s.scheduled_date FROM trips t LEFT JOIN students st ON t.student_id = st.id LEFT JOIN schedules s ON t.schedule_id = s.id ORDER BY s.scheduled_date DESC'
    )
    res.json({ count: trips.length, trips })
  }catch(err){
    console.error('admin/trips error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// get active trips (for dashboard)
router.get('/trips/active', adminMiddleware, async (req, res) => {
  try{
    const [trips] = await pool.query(
      "SELECT t.id, t.schedule_id, t.student_id, t.status FROM trips t WHERE t.status IN ('waiting', 'onboard') ORDER BY t.created_at DESC LIMIT 100"
    )
    res.json(trips)
  }catch(err){
    console.error('admin/active trips error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// update trip status
router.put('/trips/:id', adminMiddleware, async (req, res) => {
  try{
    const tripId = req.params.id
    const { status, picked_at, dropped_at } = req.body
    
    let updateFields = []
    let updateValues = []
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status) }
    if (picked_at !== undefined) { updateFields.push('picked_at = ?'); updateValues.push(picked_at) }
    if (dropped_at !== undefined) { updateFields.push('dropped_at = ?'); updateValues.push(dropped_at) }
    
    if (updateFields.length === 0) return res.json({ ok: true, id: tripId })
    
    const query = `UPDATE trips SET ${updateFields.join(', ')} WHERE id = ?`
    await pool.query(query, [...updateValues, tripId])
    res.json({ ok: true, id: tripId })
  }catch(err){
    console.error('admin/update trip error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// ===== NOTIFICATIONS ENDPOINTS =====
// list notifications
router.get('/notifications', adminMiddleware, async (req, res) => {
  try{
    const [notifications] = await pool.query(
      'SELECT n.id, n.user_id, n.target_role, n.title, n.body, n.type, n.priority, n.is_read, n.created_at, u.email FROM notifications n LEFT JOIN users u ON n.user_id = u.id ORDER BY n.created_at DESC LIMIT 200'
    )
    res.json({ count: notifications.length, notifications })
  }catch(err){
    console.error('admin/notifications error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// create notification
router.post('/notifications', adminMiddleware, async (req, res) => {
  try{
    const { user_id, target_role, title, body, type, priority } = req.body
    if (!title) return res.status(400).json({ error: 'required_fields_missing' })
    
    const { v4: uuidv4 } = await import('uuid')
    const id = uuidv4()
    await pool.query(
      'INSERT INTO notifications (id, user_id, target_role, title, body, type, priority) VALUES (?,?,?,?,?,?,?)',
      [id, user_id || null, target_role || 'all', title, body || '', type || 'info', priority || 'medium']
    )
    res.status(201).json({ id, user_id: user_id || null, target_role: target_role || 'all', title, body: body || '', type: type || 'info', priority: priority || 'medium' })
  }catch(err){
    console.error('admin/create notification error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// mark notification as read
router.put('/notifications/:id', adminMiddleware, async (req, res) => {
  try{
    const notifId = req.params.id
    const { is_read } = req.body
    await pool.query('UPDATE notifications SET is_read = ? WHERE id = ?', [is_read !== undefined ? is_read : true, notifId])
    res.json({ ok: true, id: notifId })
  }catch(err){
    console.error('admin/update notification error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// ===== STUDENTS ENDPOINTS =====
// list students
router.get('/students', adminMiddleware, async (req, res) => {
  try{
    const [students] = await pool.query(
      `SELECT 
        s.id, s.full_name, s.grade, s.class, 
        s.parent_user_id, s.assigned_route_id, s.assigned_stop_id, s.assigned_bus_id,
        s.address, s.home_lat, s.home_lng, s.created_at, 
        rs.name as stop_name, r.name as route_name, u.full_name as parent_name,
        b.plate as bus_plate
      FROM students s 
      LEFT JOIN route_stops rs ON s.assigned_stop_id = rs.id 
      LEFT JOIN routes r ON s.assigned_route_id = r.id 
      LEFT JOIN users u ON s.parent_user_id = u.id
      LEFT JOIN buses b ON s.assigned_bus_id = b.id
      ORDER BY s.full_name`
    )
    res.json({ count: students.length, students })
  }catch(err){
    console.error('admin/students error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// create student
router.post('/students', adminMiddleware, async (req, res) => {
  try{
    const { full_name, grade, class: studentClass, parent_user_id, assigned_route_id, assigned_stop_id, assigned_bus_id, address } = req.body
    console.log('Creating student with data:', { full_name, grade, studentClass, parent_user_id, assigned_route_id, assigned_stop_id, assigned_bus_id, address })
    
    if (!full_name || !grade) return res.status(400).json({ error: 'required_fields_missing', message: 'Họ tên và lớp là bắt buộc' })
    if (!parent_user_id) return res.status(400).json({ error: 'parent_required', message: 'Phải chọn phụ huynh' })
    
    const { v4: uuidv4 } = await import('uuid')
    const id = uuidv4()
    await pool.query(
      'INSERT INTO students (id, parent_user_id, full_name, grade, class, assigned_route_id, assigned_stop_id, assigned_bus_id, address) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, parent_user_id, full_name, grade, studentClass || null, assigned_route_id || null, assigned_stop_id || null, assigned_bus_id || null, address || null]
    )
    console.log('Student created successfully:', id)
    res.status(201).json({ id, full_name, grade, class: studentClass, parent_user_id, assigned_route_id, assigned_stop_id, assigned_bus_id, address })
  }catch(err){
    console.error('admin/create student error', err)
    res.status(500).json({ error: 'internal_error', message: err.message })
  }
})

// update student
router.put('/students/:id', adminMiddleware, async (req, res) => {
  try{
    const studentId = req.params.id
    const { full_name, grade, class: studentClass, parent_user_id, assigned_route_id, assigned_stop_id, assigned_bus_id, address } = req.body
    
    let updateFields = []
    let updateValues = []
    if (full_name !== undefined) { updateFields.push('full_name = ?'); updateValues.push(full_name) }
    if (grade !== undefined) { updateFields.push('grade = ?'); updateValues.push(grade) }
    if (studentClass !== undefined) { updateFields.push('class = ?'); updateValues.push(studentClass) }
    if (parent_user_id !== undefined) { updateFields.push('parent_user_id = ?'); updateValues.push(parent_user_id) }
    if (assigned_route_id !== undefined) { updateFields.push('assigned_route_id = ?'); updateValues.push(assigned_route_id) }
    if (assigned_stop_id !== undefined) { updateFields.push('assigned_stop_id = ?'); updateValues.push(assigned_stop_id) }
    if (assigned_bus_id !== undefined) { updateFields.push('assigned_bus_id = ?'); updateValues.push(assigned_bus_id) }
    if (address !== undefined) { updateFields.push('address = ?'); updateValues.push(address) }
    
    if (updateFields.length === 0) return res.json({ ok: true, id: studentId })
    
    const query = `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`
    await pool.query(query, [...updateValues, studentId])
    res.json({ ok: true, id: studentId })
  }catch(err){
    console.error('admin/update student error', err)
    res.status(500).json({ error: 'internal_error', message: err.message })
  }
})

// delete student
router.delete('/students/:id', adminMiddleware, async (req, res) => {
  try{
    await pool.query('DELETE FROM students WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  }catch(err){
    console.error('admin/delete student error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

// ===== GENERAL STATS ENDPOINTS =====
// get dashboard stats
router.get('/stats', adminMiddleware, async (req, res) => {
  try{
    const [busStats] = await pool.query('SELECT COUNT(*) as total, SUM(active) as active FROM buses')
    const [driverStats] = await pool.query('SELECT COUNT(*) as total, SUM(active) as active FROM drivers')
    const [studentStats] = await pool.query('SELECT COUNT(*) as total FROM students')
    const [routeStats] = await pool.query('SELECT COUNT(*) as total FROM routes WHERE active = 1')
    
    const today = new Date().toISOString().split('T')[0]
    const [scheduleStats] = await pool.query(
      "SELECT COUNT(*) as total FROM schedules WHERE DATE(scheduled_date) = ?",
      [today]
    )
    const [activeTripsStats] = await pool.query(
      "SELECT COUNT(*) as total FROM trips t JOIN schedules s ON t.schedule_id = s.id WHERE DATE(s.scheduled_date) = ? AND t.status IN ('waiting', 'onboard')",
      [today]
    )
    
    res.json({
      buses: busStats[0]?.total || 0,
      activeBuses: busStats[0]?.active || 0,
      drivers: driverStats[0]?.total || 0,
      activeDrivers: driverStats[0]?.active || 0,
      students: studentStats[0]?.total || 0,
      routes: routeStats[0]?.total || 0,
      todaySchedules: scheduleStats[0]?.total || 0,
      activeTrips: activeTripsStats[0]?.total || 0
    })
  }catch(err){
    console.error('admin/stats error', err)
    res.status(500).json({ error: 'internal_error' })
  }
})

export default router
