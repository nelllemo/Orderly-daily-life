/*
 * Simple DB initialization script.
 * Usage: node scripts/init_db.js
 * Requires DB_* env vars set (see .env.example)
 */

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

async function run() {
  const host = process.env.DB_HOST || '127.0.0.1'
  const port = Number(process.env.DB_PORT || 3306)
  const user = process.env.DB_USER || 'root'
  const password = process.env.DB_PASSWORD || ''
  const database = process.env.DB_NAME || 'youxurichang'

  const envPath = path.resolve(__dirname, '../.env')
  if (!fs.existsSync(envPath)) {
    console.error(`Missing .env file at ${envPath}`)
    console.error('Create it from .env.example and fill DB_HOST/DB_USER/DB_PASSWORD/DB_NAME before running again.')
    process.exit(1)
  }

  if (!user) {
    console.error('DB_USER not set')
    process.exit(1)
  }

  if (!process.env.DB_PASSWORD) {
    console.error('DB_PASSWORD not set in .env')
    console.error('Use a dedicated MySQL user with a password instead of root/no-password login.')
    process.exit(1)
  }

  const schemaPath = path.resolve(__dirname, '../src/schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')

  // connect without database to ensure DB exists
  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true })
  try {
    console.log('Creating database if not exists:', database)
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await conn.changeUser({ database })

    console.log('Running schema SQL...')
    // Execute statements - use multipleStatements via connection
    await conn.query(sql)

    console.log('Schema applied successfully.')
  } catch (err) {
    console.error('Failed to apply schema:', err.message)
    process.exitCode = 2
  } finally {
    await conn.end()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
