// test/routes/auth.test.js
// Tests for /api/auth/* — exercises the routes that the previous 6
// improvements touch (rate limiters, env-validated secrets, OTP flows).

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../helpers/app.js';
import { _seed } from '../helpers/hooks.js';
import { _getTable } from '../helpers/db.js';

describe('GET /api/auth/exists/:mobile', () => {
  it('returns exists=false for an unknown number', async () => {
    const res = await request(app).get('/api/auth/exists/9999999999');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ exists: false });
  });

  it('returns exists=true with the user for a known number', async () => {
    _seed('users', [{ mobile: '8888888888', name: 'Ramu', role: 'farmer', is_verified: 1 }]);
    expect(_getTable('users').length).toBe(1);
    const res = await request(app).get('/api/auth/exists/8888888888');
    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(true);
    expect(res.body.user).toMatchObject({ name: 'Ramu', role: 'farmer' });
  });

  it('rejects a non-10-digit number with 400', async () => {
    const res = await request(app).get('/api/auth/exists/abc');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns no farmer/user when no session is present', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, farmer: null, user: null });
  });
});

describe('POST /api/auth/send-otp validation', () => {
  it('rejects an invalid mobile with 400', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ mobile: 'not-a-number' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation_error');
  });

  it('accepts a valid 10-digit mobile (request is not blocked at validation)', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ mobile: '7777777777' });
    // The dev provider path may or may not succeed (depends on env),
    // but the request MUST NOT 400-validate.
    expect(res.status).not.toBe(400);
  });
});
