import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import app from '../helpers/app.js';
import { apiLimiter } from '../../src/middlewares/rateLimiter.js';
import { _seed } from '../helpers/hooks.js';

describe('farmer and admin OTP login rate limits', () => {
  it.each(['farmer', 'admin'])('shares the %s send and resend allowance', async (section) => {
    const farmer = section === 'farmer';
    const mobile = '9123456789';
    if (farmer) _seed('users', [{ mobile, name: 'Blocked test user', blocked: 1, role: 'farmer' }]);
    const sendPath = farmer ? '/api/auth/send-otp' : '/api/admin/login-start';
    const resendPath = farmer ? '/api/auth/resend-otp' : '/api/admin/resend-otp';
    const body = farmer ? { mobile } : { email: 'limit@test.local', password: 'incorrect' };
    // Denied accounts exercise the routes without sending SMS or email.
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post(i % 2 ? resendPath : sendPath).send(body);
      expect(res.status).toBe(farmer ? 403 : 401);
    }
    const blocked = await request(app).post(resendPath).send(body);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect(Number(blocked.headers['retry-after'])).toBeLessThanOrEqual(30);
  });

  it.each([
    '/api/auth/send-otp',
    '/api/auth/resend-otp',
    '/api/auth/verify-otp',
    '/api/auth/login',
    '/api/admin/login-start',
    '/api/admin/resend-otp',
    '/api/admin/verify-otp',
  ])('keeps validating %s beyond the former route and API limits', async (path) => {
    const server = express();
    server.use('/api', apiLimiter());
    server.use(app);

    // Invalid bodies exercise every limiter without sending real SMS or email.
    for (let attempt = 0; attempt < 101; attempt++) {
      const res = await request(server).post(path).send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('validation_error');
    }
  });

  it('still limits other API endpoints', async () => {
    const server = express();
    server.use('/api', apiLimiter());
    server.post('/api/dealer/send-otp', (_req, res) => res.sendStatus(204));

    for (let attempt = 0; attempt < 100; attempt++) {
      expect((await request(server).post('/api/dealer/send-otp')).status).toBe(204);
    }
    expect((await request(server).post('/api/dealer/send-otp')).status).toBe(429);
  });
});
