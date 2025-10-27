// Create database first, then run password reset table migration
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabaseAndTable() {
  // First connect without database to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    const dbName = process.env.DB_NAME || 'schoolbus';
    console.log(`Creating database ${dbName}...`);
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database ${dbName} created/exists`);
    
    // Now connect to the database
    await connection.query(`USE \`${dbName}\``);
    
    console.log('Creating password_reset_requests table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by VARCHAR(36) NULL,
        approved_at TIMESTAMP NULL,
        notes TEXT NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_requested_at (requested_at)
      );
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ password_reset_requests table created successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createDatabaseAndTable();