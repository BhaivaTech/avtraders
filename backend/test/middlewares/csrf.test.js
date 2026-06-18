// test/middlewares/csrf.test.js
// Verifies the CSRF sameSite default and the CSRF_SAMESITE env opt-in
// introduced in the previous quick-win batch.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Build the test app fresh inside each `it` so we can vary the env.
// The helpers/app.js module is cached after first import, so we vary
// process.env before importing and use a fresh supertest agent.

describe('CSRF sameSite default + opt-in', () => {
  const prevEnv = process.env.CSRF_SAMESITE;

  afterAll(() => {
    if (prevEnv === undefined) delete process.env.CSRF_SAMESITE;
    else process.env.CSRF_SAMESITE = prevEnv;
  });

  it('default is "lax" when CSRF_SAMESITE is unset', async () => {
    delete process.env.CSRF_SAMESITE;
    // Use vi.resetModules + dynamic import to pick up the new env.
    const { default: app } = await import('../helpers/app.js');
    const res = await request(app).get('/api/csrf-token');
    const cookie = res.headers['set-cookie']?.[0] || '';
    expect(cookie).toMatch(/csrf_secret=/);
    // Lax is the modern default; assert the directive is present and
    // is NOT "Strict".
    expect(cookie.toLowerCase()).toMatch(/samesite=lax/);
    expect(cookie.toLowerCase()).not.toMatch(/samesite=strict/);
  });

  it('honors CSRF_SAMESITE=strict when set', async () => {
    process.env.CSRF_SAMESITE = 'strict';
    // Build an app with the env flag honored. We bypass the cached
    // import by using a tiny inline app that imports the same
    // middleware factory under the new env.
    const { csrfCookieSetter, csrfTokenEndpoint } = await import('../../src/middlewares/csrf.js');
    const express = (await import('express')).default;
    const cookieParser = (await import('cookie-parser')).default;
    const a = express();
    a.use(cookieParser());
    a.use(csrfCookieSetter);
    a.get('/csrf', csrfTokenEndpoint);
    const res = await request(a).get('/csrf');
    const cookie = res.headers['set-cookie']?.[0] || '';
    expect(cookie.toLowerCase()).toMatch(/samesite=strict/);
  });
});
