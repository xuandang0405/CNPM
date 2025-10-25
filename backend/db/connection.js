import mysql from 'mysql2/promise';

// Configuration for local development
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  port: 3306,
  database: 'cnpm',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+00:00',
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}

export { pool, testConnection };
