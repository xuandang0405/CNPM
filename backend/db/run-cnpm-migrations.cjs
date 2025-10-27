const mysql = require('mysql2/promise')
require('dotenv').config()

async function ensureColumn(conn, table, columnDef){
  try{
    await conn.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`)
    console.log(`✔ Added column ${table}.${columnDef}`)
  }catch(e){
    if (e && (e.code === 'ER_DUP_FIELDNAME' || String(e.message||'').includes('Duplicate column name'))){
      console.log(`• Column already exists: ${table}.${columnDef.split(' ')[0]}`)
    } else {
      throw e
    }
  }
}

async function ensureTable(conn){
  const sql = `
  CREATE TABLE IF NOT EXISTS password_reset_requests (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by CHAR(36) NULL,
    approved_at TIMESTAMP NULL,
    notes TEXT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at),
    CONSTRAINT fk_prr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_prr_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;
  `
  await conn.query(sql)
  console.log('✔ Ensured table password_reset_requests')
}

async function ensureResetTokensTable(conn){
  const sql = `
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_token_hash (token_hash),
    INDEX idx_user_expires (user_id, expires_at),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;
  `
  await conn.query(sql)
  console.log('✔ Ensured table password_reset_tokens')
}

async function main(){
  const dbName = 'cnpm'
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName
  })
  try{
    console.log('Running migrations on DB:', dbName)
    await ensureColumn(conn, 'users', 'must_change_password BOOLEAN DEFAULT FALSE')
    // Align students table with frontend requirements
    await ensureColumn(conn, 'students', 'address TEXT NULL')
    await ensureColumn(conn, 'students', 'assigned_bus_id CHAR(36) NULL')
    await ensureTable(conn)
    await ensureResetTokensTable(conn)
  }catch(e){
    console.error('Migration error:', e.message)
    process.exitCode = 1
  }finally{
    await conn.end()
  }
}

main()
