// Run this script to create password_reset_requests table
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createPasswordResetTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'schoolbus'
  });

  try {
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
        INDEX idx_requested_at (requested_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ password_reset_requests table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    await connection.end();
  }
}

createPasswordResetTable();