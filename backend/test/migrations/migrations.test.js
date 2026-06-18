// test/migrations/migrations.test.js
// Static checks on the migrations directory. We don't spin up a real
// MySQL in tests (that needs testcontainers), but we can at least
// assert that the migrations directory contains the expected
// sequence, the SQL files are non-empty, and 005 (soft-delete) is
// wired up correctly.

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

function readMigrations() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

describe('migrations directory', () => {
  it('contains a strictly-ordered, gap-free sequence 001..005', () => {
    const files = readMigrations();
    const expected = [
      '001_initial_schema.sql',
      '002_add_indexes.sql',
      '003_auth_audit.sql',
      '004_canonicalize_schema.sql',
      '005_soft_delete_messages.sql',
    ];
    // Subset check: every expected migration must be present.
    for (const f of expected) {
      expect(files).toContain(f);
    }
    // And the first five should be exactly these.
    expect(files.slice(0, expected.length)).toEqual(expected);
  });

  it('every migration file is non-empty and well-formed', () => {
    const files = readMigrations();
    for (const f of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
      expect(sql.length).toBeGreaterThan(0);
      // Each file should end in a newline for tooling that cats them
      expect(sql.endsWith('\n')).toBe(true);
    }
  });

  it('005 declares the soft-delete columns and the chat-deleted index', () => {
    const sql = fs.readFileSync(
      path.join(MIGRATIONS_DIR, '005_soft_delete_messages.sql'),
      'utf8'
    );
    expect(sql).toMatch(/`deleted_for_admin`/);
    expect(sql).toMatch(/`deleted_for_farmer`/);
    expect(sql).toMatch(/`idx_messages_chat_deleted`/);
  });

  it('004 and 005 are idempotent (use INFORMATION_SCHEMA guards)', () => {
    for (const file of ['004_canonicalize_schema.sql', '005_soft_delete_messages.sql']) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      expect(sql).toMatch(/INFORMATION_SCHEMA\.(COLUMNS|STATISTICS|REFERENTIAL_CONSTRAINTS)/i);
      // Every file uses the SET @sql := IF(...) + PREPARE pattern
      expect(sql).toMatch(/PREPARE stmt FROM @sql/);
    }
  });
});
