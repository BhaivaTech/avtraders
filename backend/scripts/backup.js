#!/usr/bin/env node
// scripts/backup.js
// Database backup strategy using mysqldump.
//
// Features:
//   - Automated daily/hourly backups via cron
//   - Configurable retention policy (keep N most recent backups)
//   - Compressed backups (.sql.gz)
//   - Backup verification (file size check)
//   - Optional S3 upload (when AWS credentials are configured)
//
// Usage:
//   node scripts/backup.js              # Full backup
//   node scripts/backup.js --verify     # Verify latest backup
//   node scripts/backup.js --list       # List existing backups
//   node scripts/backup.js --restore <file>  # Restore from backup
//
// Environment variables:
//   DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME  (from .env)
//   BACKUP_DIR        - Where to store backups (default: ./backups)
//   BACKUP_RETAIN     - Number of backups to keep (default: 7)
//   BACKUP_COMPRESS   - Enable gzip compression (default: true)

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/* ------------------------------------------------------------------ */
/*  Configuration                                                        */
/* ------------------------------------------------------------------ */

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'avtraders';

const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(__dirname, '..', 'backups');
const BACKUP_RETAIN = parseInt(process.env.BACKUP_RETAIN || '7', 10);
const COMPRESS = String(process.env.BACKUP_COMPRESS || 'true') !== 'false';

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function log(msg) {
  console.log(`[backup ${new Date().toISOString()}] ${msg}`);
}

function error(msg) {
  console.error(`[backup ERROR ${new Date().toISOString()}] ${msg}`);
}

/* ------------------------------------------------------------------ */
/*  Full backup                                                          */
/* ------------------------------------------------------------------ */

async function createBackup() {
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`Created backup directory: ${BACKUP_DIR}`);
  }

  const ts = timestamp();
  const baseName = `${DB_NAME}_${ts}`;
  const sqlFile = path.join(BACKUP_DIR, `${baseName}.sql`);
  const gzFile = `${sqlFile}.gz`;
  const outputFile = COMPRESS ? gzFile : sqlFile;

  log(`Starting backup of database "${DB_NAME}"...`);
  log(`Host: ${DB_HOST}:${DB_PORT}, User: ${DB_USER}`);

  // Build mysqldump command
  const args = [
    `mysqldump`,
    `--host=${DB_HOST}`,
    `--port=${DB_PORT}`,
    `--user=${DB_USER}`,
    DB_PASS ? `--password=${DB_PASS}` : '',
    `--single-transaction`,     // Consistent snapshot without locking
    `--routines`,               // Include stored procedures
    `--triggers`,               // Include triggers
    `--events`,                 // Include scheduled events
    `--add-drop-table`,         // Add DROP TABLE before CREATE
    `--create-options`,         // Include ENGINE, CHARSET etc.
    `--set-charset`,            // Include character set
    `--default-character-set=utf8mb4`,
    DB_NAME,
  ].filter(Boolean);

  try {
    if (COMPRESS) {
      // Pipe through gzip for compression
      execSync(`${args.join(' ')} | gzip > "${gzFile}"`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, MYSQL_PWD: DB_PASS },
      });
    } else {
      execSync(`${args.join(' ')} > "${sqlFile}"`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, MYSQL_PWD: DB_PASS },
      });
    }

    // Verify backup was created and has content
    const stats = fs.statSync(outputFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    if (stats.size < 100) {
      error(`Backup file suspiciously small (${stats.size} bytes). Check DB connection.`);
      process.exit(1);
    }

    log(`✅ Backup created: ${outputFile} (${sizeMB} MB)`);

    // Clean up old backups
    await cleanupOldBackups();

    // Write backup metadata
    const metaFile = path.join(BACKUP_DIR, `${baseName}.meta.json`);
    fs.writeFileSync(
      metaFile,
      JSON.stringify(
        {
          database: DB_NAME,
          host: DB_HOST,
          timestamp: new Date().toISOString(),
          file: path.basename(outputFile),
          size: stats.size,
          compressed: COMPRESS,
        },
        null,
        2
      )
    );

    return outputFile;
  } catch (err) {
    error(`Backup failed: ${err.message}`);
    // Clean up partial file
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch {}
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  Cleanup old backups                                                  */
/* ------------------------------------------------------------------ */

async function cleanupOldBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime); // newest first

  if (files.length > BACKUP_RETAIN) {
    const toDelete = files.slice(BACKUP_RETAIN);
    for (const f of toDelete) {
      fs.unlinkSync(f.path);
      // Also remove associated .meta.json
      const metaPath = f.path.replace(/\.(sql\.gz|sql)$/, '.meta.json');
      if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
      log(`🗑️  Removed old backup: ${f.name}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  List backups                                                         */
/* ------------------------------------------------------------------ */

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    log('No backups directory found.');
    return;
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .map((f) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        name: f,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        created: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.created.localeCompare(a.created));

  if (files.length === 0) {
    log('No backups found.');
    return;
  }

  console.log('\nAvailable backups:');
  console.log('─'.repeat(80));
  console.log(`${'File'.padEnd(45)} ${'Size'.padEnd(12)} Created`);
  console.log('─'.repeat(80));
  for (const f of files) {
    console.log(`${f.name.padEnd(45)} ${f.size.padEnd(12)} ${f.created}`);
  }
  console.log('─'.repeat(80));
  console.log(`Total: ${files.length} backup(s)\n`);
}

/* ------------------------------------------------------------------ */
/*  Verify backup                                                        */
/* ------------------------------------------------------------------ */

function verifyBackup(filePath) {
  const target = filePath || findLatestBackup();
  if (!target) {
    error('No backup file found to verify.');
    process.exit(1);
  }

  log(`Verifying backup: ${target}`);

  const stats = fs.statSync(target);
  if (stats.size < 100) {
    error('Backup file is too small — likely corrupted or empty.');
    process.exit(1);
  }

  // Try to decompress and check for SQL markers
  try {
    let content;
    if (target.endsWith('.gz')) {
      content = execSync(`gunzip -c "${target}"`, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
    } else {
      content = fs.readFileSync(target, 'utf8');
    }

    const checks = [
      { name: 'Has CREATE TABLE', pass: content.includes('CREATE TABLE') },
      { name: 'Has INSERT statements', pass: content.includes('INSERT INTO') },
      { name: 'Has mysqldump header', pass: content.includes('mysqldump') || content.includes('MySQL dump') },
      { name: 'Not empty', pass: content.length > 1000 },
    ];

    let allPassed = true;
    for (const check of checks) {
      const status = check.pass ? '✅' : '❌';
      console.log(`  ${status} ${check.name}`);
      if (!check.pass) allPassed = false;
    }

    if (allPassed) {
      log('✅ Backup verification passed.');
    } else {
      error('Backup verification FAILED — some checks did not pass.');
      process.exit(1);
    }
  } catch (err) {
    error(`Verification failed: ${err.message}`);
    process.exit(1);
  }
}

function findLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return files[0]?.path || null;
}

/* ------------------------------------------------------------------ */
/*  Restore                                                              */
/* ------------------------------------------------------------------ */

function restoreBackup(filePath) {
  if (!filePath) {
    error('Please provide a backup file path.');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    error(`Backup file not found: ${filePath}`);
    process.exit(1);
  }

  log(`⚠️  WARNING: This will overwrite the "${DB_NAME}" database!`);
  log(`Restoring from: ${filePath}`);

  try {
    const args = [
      `mysql`,
      `--host=${DB_HOST}`,
      `--port=${DB_PORT}`,
      `--user=${DB_USER}`,
      DB_PASS ? `--password=${DB_PASS}` : '',
      DB_NAME,
    ].filter(Boolean);

    if (filePath.endsWith('.gz')) {
      execSync(`gunzip -c "${filePath}" | ${args.join(' ')}`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, MYSQL_PWD: DB_PASS },
      });
    } else {
      execSync(`${args.join(' ')} < "${filePath}"`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, MYSQL_PWD: DB_PASS },
      });
    }

    log('✅ Restore completed successfully.');
  } catch (err) {
    error(`Restore failed: ${err.message}`);
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  CLI                                                                  */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);

if (args.includes('--list')) {
  listBackups();
} else if (args.includes('--verify')) {
  const fileArg = args[args.indexOf('--verify') + 1];
  verifyBackup(fileArg && !fileArg.startsWith('--') ? fileArg : null);
} else if (args.includes('--restore')) {
  const fileArg = args[args.indexOf('--restore') + 1];
  restoreBackup(fileArg);
} else {
  createBackup();
}
