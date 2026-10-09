import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import app from '../helpers/app.js';
import { apiLimiter } from '../../src/middlewares/rateLimiter.js';

describe('farmer and admin OTP login rate limits', () => {
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
