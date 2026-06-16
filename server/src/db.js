const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'youxurichang',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z'
})

// Log connection pool errors instead of crashing
pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.message || err)
})

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params)
  return rows
}

module.exports = {
  pool,
  query
}
