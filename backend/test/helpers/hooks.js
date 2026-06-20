// test/helpers/hooks.js
// Vitest setup file. Wires the in-memory pool into every test BEFORE
// any application module is imported. We do this by stubbing the ESM
// module loader for the db config path.

import { vi, beforeEach } from 'vitest';
import * as db from './db.js';

vi.mock('../../src/config/db.js', () => ({
  pool: db.pool,
}));

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-32chars-or-more-xxxxxx';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-16chars';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.local';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-admin-pass';
process.env.DB_HOST = process.env.DB_HOST || 'test_db_host';
process.env.DB_USER = process.env.DB_USER || 'test';
process.env.DB_PASS = process.env.DB_PASS || 'test';
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.NODE_ENV = 'test';
process.env.CSRF_DISABLED = '1';

beforeEach(() => {
  db._resetDb();
});

export const _seed = db._seed;
export const _getTable = db._getTable;
