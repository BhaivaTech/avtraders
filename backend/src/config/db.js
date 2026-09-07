// backend/src/config/db.js
//
// Pool is created lazily so this file can be imported BEFORE
// process.env is populated without throwing. The actual pool is
// created on first call to `getPool()` / `pool`. server.js does the
// early env validation; we just read the values here.

import mysql from 'mysql2/promise';

let _pool = null;
let _pingedOk = false;

function readDbEnv() {
  return {
    host:     process.env.DB_HOST     || process.env.MYSQL_HOST,
    port:     Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user:     process.env.DB_USER     || process.env.MYSQL_USER,
    password: process.env.DB_PASS     || process.env.MYSQL_PASSWORD,
    database: process.env.DB_NAME     || process.env.MYSQL_DATABASE,
  };
}

function validate() {
  const env = readDbEnv();
  const missing = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'].filter(
    (k) => !process.env[k] && !process.env[`MYSQL_${k.replace('DB_', '')}`]
  );
  if (missing.length) {
    throw new Error(
      `[DB] Missing required environment variables: ${missing.join(', ')}. ` +
        'Set them in your .env file and restart the server.'
    );
  }
  return env;
}

function buildPool() {
  if (_pool) return _pool;
  const env = validate();
  // Helpful startup log (no password)
  // eslint-disable-next-line no-console
  console.log(`[DB] host=${env.host}:${env.port} user=${env.user} db=${env.database}`);
  _pool = mysql.createPool({
    host:            env.host,
    port:            env.port,
    user:            env.user,
    password:        env.password,
    database:        env.database,
    waitForConnections: true,
    connectionLimit:    10,
    // Cull idle pooled connections BEFORE intermediate firewalls/NAT
    // or the remote server's wait_timeout silently kill them.
    // Prevents "read ECONNRESET" on the first query after an idle gap.
    maxIdle:            4,
    idleTimeout:        60_000,
    queueLimit:         0,
    timezone:        'Z',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    connectTimeout:  20000,
  });
  // Non-fatal upfront ping (so you see EHOSTUNREACH cleanly)
  _pool.getConnection()
    .then(async (conn) => {
      try { await conn.ping(); } finally { conn.release(); }
      _pingedOk = true;
      // eslint-disable-next-line no-console
      console.log('[DB] ping ok');
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[DB] initial connect failed:', e?.code || e?.message || e);
    });
  return _pool;
}

// Transient connection errors: a pooled socket died while idle.
// Retrying once on a fresh connection is safe (the query never started).
function isTransientConnError(e) {
  const code = String(e?.code || '');
  return (
    ['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(code) ||
    /connection lost|econnreset|socket.*ended/i.test(String(e?.message || ''))
  );
}

async function poolQueryWithRetry(p, fn, args) {
  try {
    return await p[fn](...args);
  } catch (e) {
    if (!isTransientConnError(e)) throw e;
    // Run on a brand-new dedicated connection, bypassing stale pooled ones
    const conn = await p.getConnection();
    try {
      return await conn[fn](...args);
    } finally {
      conn.release();
    }
  }
}

// Proxy: any access to `pool.query(...)`, `pool.getConnection()`, etc.
// goes through buildPool(), so importing this file before env is set
// no longer throws. query/execute get one transparent retry against
// dead-idle-connection resets.
export const pool = new Proxy({}, {
  get(_t, prop) {
    const p = buildPool();
    if (prop === 'query' || prop === 'execute') {
      return (...args) => poolQueryWithRetry(p, prop, args);
    }
    const v = p[prop];
    return typeof v === 'function' ? v.bind(p) : v;
  },
});

export const dbPingedOk = () => _pingedOk;
