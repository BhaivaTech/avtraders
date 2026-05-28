// backend/src/config/db.js
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || process.env.MYSQL_HOST || '46.28.44.56';
const DB_PORT = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
const DB_USER = process.env.DB_USER || process.env.MYSQL_USER || 'appuser';
const DB_PASS = process.env.DB_PASS || process.env.MYSQL_PASSWORD || 'DataSync@VPS1';
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'avtradersdb';

// Helpful startup log (no password)
console.log(`[DB] host=${DB_HOST}:${DB_PORT} user=${DB_USER} db=${DB_NAME}`);

export const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,                  // ✅ important
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 20000,
});

// Non-fatal upfront ping (so you see EHOSTUNREACH cleanly)
try {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('[DB] ping ok');
} catch (e) {
  console.warn('[DB] initial connect failed:', e?.code || e?.message || e);
}
