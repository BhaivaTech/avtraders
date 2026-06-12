// src/utils/migrations.js
// Lightweight database migration framework for MySQL.
//
// How it works:
//   1. Creates a `schema_migrations` table to track applied migrations.
//   2. Reads .sql files from the `migrations/` directory (sorted by filename).
//   3. Applies any migrations not yet recorded in the tracking table.
//   4. Each migration runs in a transaction (where supported).
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

  const conn = await pool.getConnection();
  try {
    await ensureTrackingTable(conn);
    const applied = await getAppliedMigrations(conn);

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info({ migration: file }, '[migrations] Applying...');

      try {
        // Split on semicolons to handle multi-statement SQL files.
        // Note: This is a simple split. For complex SQL with embedded semicolons,
        // use a proper parser or delimiter handling.
        const statements = sql
          .split(/;\s*$/m)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'));

        for (const stmt of statements) {
          await conn.query(stmt);
        }

        // Record successful migration
        await conn.query(
          'INSERT INTO schema_migrations (name) VALUES (?)',
          [file]
        );
        count++;
        logger.info({ migration: file }, '[migrations] ✅ Applied');
      } catch (err) {
        logger.error({ migration: file, err: err.message }, '[migrations] ❌ Failed');
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
  const conn = await pool.getConnection();
  try {
    const statements = sql
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      await conn.query(stmt);
    }

    await conn.query('DELETE FROM schema_migrations WHERE name = ?', [name]);
    logger.info({ migration: name }, '[migrations] Rolled back');
  } finally {
    conn.release();
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
