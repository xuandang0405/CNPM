// Upsert a specific admin user into the DB
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function main(){
  const email = process.argv[2] || 'admin@gmaill.com'
  const plain = process.argv[3] || 'dang123'
  const full_name = process.argv[4] || 'Admin User'
  const phone = process.argv[5] || null

  // Use the same DB name as server connection.js
  const dbName = 'cnpm'
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName
  })
  try{
    console.log('Connecting to DB:', dbName)
    const hashed = await bcrypt.hash(plain, 10)
    const id = require('crypto').randomUUID()

    try{
      await conn.execute(
        'INSERT INTO users (id, role, email, password_hash, full_name, phone, must_change_password) VALUES (?,?,?,?,?,?,FALSE)',
        [id, 'admin', email, hashed, full_name, phone]
      )
      console.log('✅ Inserted new admin user:', email)
      console.log('   Password:', plain)
      console.log('   id:', id)
    }catch(e){
      if (e && e.code === 'ER_DUP_ENTRY'){
        await conn.execute(
          'UPDATE users SET role = \'admin\', password_hash = ?, full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), must_change_password = FALSE WHERE email = ?',
          [hashed, full_name, phone, email]
        )
        const [rows] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
        console.log('♻️  Updated existing user to admin:', email)
        console.log('   Password:', plain)
        console.log('   id:', rows[0] && rows[0].id)
      } else {
        throw e
      }
    }
  }catch(err){
    console.error('❌ Error:', err.message)
    process.exitCode = 1
  }finally{
    await conn.end()
  }
}

main()