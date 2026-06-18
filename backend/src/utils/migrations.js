// src/utils/migrations.js
// Lightweight database migration framework for MySQL.
//
// How it works:
//   1. Creates a `schema_migrations` table to track applied migrations.
//   2. Reads .sql files from the `migrations/` directory (sorted by filename).
//   3. Applies any migrations not yet recorded in the tracking table.
//   4. Each migration runs as a single multi-statement query (with
//      `multipleStatements: true` on a dedicated connection) inside a
//      transaction, so PREPARE / EXECUTE / user-variable blocks all
//      see the same session state.
//
// Migration file naming:
//   001_add_blocked_column.sql
//   002_create_announcements_table.sql
//   ...
//
// Usage in server.js:
//   import { runMigrations } from './src/utils/migrations.js';
//   await runMigrations();

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { pool } from '../config/db.js';
import logger from './logger.js';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

/* ------------------------------------------------------------------ */
/*  Tracking table                                                       */
/* ------------------------------------------------------------------ */

async function ensureTrackingTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL UNIQUE,
      applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function getAppliedMigrations(conn) {
  const [rows] = await conn.query('SELECT name FROM schema_migrations ORDER BY id');
  return new Set(rows.map((r) => r.name));
}

/* ------------------------------------------------------------------ */
/*  Run migrations                                                       */
/* ------------------------------------------------------------------ */

export async function runMigrations() {
  // Ensure migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    logger.info('[migrations] Created migrations/ directory (no migrations yet)');
    return;
  }

  // Read and sort migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    logger.info('[migrations] No migration files found');
    return;
  }

  // multipleStatements must be a CONNECTION-level option on mysql2 —
  // it cannot be set per-query. We grab a dedicated connection from
  // a fresh pool that has the flag enabled, so the rest of the app's
  // pool stays single-statement.
  const env = (() => {
    const r = { multipleStatements: true };
    for (const k of ['DB_HOST','DB_PORT','DB_USER','DB_PASS','DB_NAME','MYSQL_HOST','MYSQL_PORT','MYSQL_USER','MYSQL_PASSWORD','MYSQL_DATABASE']) {
      if (process.env[k]) r[k] = process.env[k];
    }
    return r;
  })();
  const migPool = mysql.createPool({
    host:                  env.DB_HOST || env.MYSQL_HOST,
    port:                  Number(env.DB_PORT || env.MYSQL_PORT || 3306),
    user:                  env.DB_USER || env.MYSQL_USER,
    password:              env.DB_PASS || env.MYSQL_PASSWORD,
    database:              env.DB_NAME || env.MYSQL_DATABASE,
    multipleStatements:    true,
    waitForConnections:    true,
    connectionLimit:       1,
    queueLimit:            0,
    timezone:              'Z',
    enableKeepAlive:       true,
    keepAliveInitialDelay: 0,
    connectTimeout:        20000,
  });
  const conn = await migPool.getConnection();
  try {
    await ensureTrackingTable(conn);
    const applied = await getAppliedMigrations(conn);

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info({ migration: file }, '[migrations] Applying...');

      // Run the whole migration as a single unit — if any statement
      // fails, roll back so the schema is never left half-applied.
      // The migration row is only inserted on success.
      await conn.beginTransaction();
      try {
        await conn.query(sql);

        // Record successful migration
        await conn.query(
          'INSERT INTO schema_migrations (name) VALUES (?)',
          [file]
        );
        await conn.commit();
        count++;
        logger.info({ migration: file }, '[migrations] ✅ Applied');
      } catch (err) {
        await conn.rollback();
        logger.error(
          { migration: file, err: err.message },
          '[migrations] ❌ Failed — rolled back'
        );
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    if (count === 0) {
      logger.info('[migrations] All migrations already applied');
    } else {
      logger.info({ count }, '[migrations] Completed');
    }
  } finally {
    conn.release();
    await migPool.end();
  }
}

/* ------------------------------------------------------------------ */
/*  Rollback helper (manual use)                                         */
/* ------------------------------------------------------------------ */

export async function rollbackMigration(name) {
  // Look for a corresponding .down.sql file
  const downFile = name.replace('.sql', '.down.sql');
  const downPath = path.join(MIGRATIONS_DIR, downFile);

  if (!fs.existsSync(downPath)) {
    throw new Error(`Rollback file not found: ${downFile}`);
  }

  const sql = fs.readFileSync(downPath, 'utf8');
  const env = (() => {
    const r = { multipleStatements: true };
    for (const k of ['DB_HOST','DB_PORT','DB_USER','DB_PASS','DB_NAME','MYSQL_HOST','MYSQL_PORT','MYSQL_USER','MYSQL_PASSWORD','MYSQL_DATABASE']) {
      if (process.env[k]) r[k] = process.env[k];
    }
    return r;
  })();
  const migPool = mysql.createPool({
    host: env.DB_HOST || env.MYSQL_HOST,
    port: Number(env.DB_PORT || env.MYSQL_PORT || 3306),
    user: env.DB_USER || env.MYSQL_USER,
    password: env.DB_PASS || env.MYSQL_PASSWORD,
    database: env.DB_NAME || env.MYSQL_DATABASE,
    multipleStatements: true,
    connectionLimit: 1,
  });
  const conn = await migPool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      await conn.query(sql);
      await conn.query('DELETE FROM schema_migrations WHERE name = ?', [name]);
      await conn.commit();
      logger.info({ migration: name }, '[migrations] Rolled back');
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  } finally {
    conn.release();
    await migPool.end();
  }
}

/* ------------------------------------------------------------------ */
/*  Status helper                                                        */
/* ------------------------------------------------------------------ */

export async function migrationStatus() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return { total: 0, applied: 0, pending: [] };

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();

  const conn = await pool.getConnection();
  try {
    await ensureTrackingTable(conn);
    const applied = await getAppliedMigrations(conn);
    const pending = files.filter((f) => !applied.has(f));
    return { total: files.length, applied: files.length - pending.length, pending };
  } finally {
    conn.release();
  }
}
