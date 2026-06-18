// test/middlewares/rateLimiter.test.js
// Verifies the per-mobile / per-email identifier limiters shipped
// in the previous quick-win batch.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  farmerOtpSendByMobileLimiter,
  dealerOtpVerifyByMobileLimiter,
  adminLoginByEmailLimiter,
} from '../../src/middlewares/rateLimiter.js';

function makeRes() {
  return {
    setHeader: vi.fn(),
    status: vi.fn(function (s) { this._s = s; return this; }),
    json: vi.fn(function (j) { this._j = j; return this; }),
  };
}

describe('farmerOtpSendByMobileLimiter', () => {
  it('passes the first 5 requests for the same mobile, blocks the 6th', () => {
    const lim = farmerOtpSendByMobileLimiter();
    const req = { body: { mobile: '9999999999' } };

    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      let next = false;
      lim(req, res, () => { next = true; });
      expect(next).toBe(true);
    }

    const blocked = makeRes();
    let next = false;
    lim(req, blocked, () => { next = true; });
    expect(next).toBe(false);
    expect(blocked.status).toHaveBeenCalledWith(429);
    expect(blocked.json).toHaveBeenCalled();
    expect(blocked._j).toMatchObject({ ok: false });
  });

  it('does not block a different mobile number', () => {
    const lim = farmerOtpSendByMobileLimiter();
    const res1 = makeRes(), res2 = makeRes();
    let next1 = false, next2 = false;
    lim({ body: { mobile: '1111111111' } }, res1, () => { next1 = true; });
    lim({ body: { mobile: '2222222222' } }, res2, () => { next2 = true; });
    expect(next1).toBe(true);
    expect(next2).toBe(true);
  });
});

describe('dealerOtpVerifyByMobileLimiter', () => {
  it('uses req.body.phone (not .mobile) for dealers', () => {
    const lim = dealerOtpVerifyByMobileLimiter();
    // 10 attempts should pass before the 11th is blocked (max=10)
    for (let i = 0; i < 10; i++) {
      const res = makeRes();
      let next = false;
      lim({ body: { phone: '7777777777' } }, res, () => { next = true; });
      expect(next).toBe(true);
    }
    const res = makeRes();
    let next = false;
    lim({ body: { phone: '7777777777' } }, res, () => { next = true; });
    expect(next).toBe(false);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});

describe('adminLoginByEmailLimiter', () => {
  it('keys by lowercased email', () => {
    const lim = adminLoginByEmailLimiter();
    // max=5; first 5 pass
    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      let next = false;
      lim({ body: { email: 'Admin@Test.local' } }, res, () => { next = true; });
      expect(next).toBe(true);
    }
    // 6th — even with a different casing — should be blocked
    const res = makeRes();
    let next = false;
    lim({ body: { email: 'admin@test.local' } }, res, () => { next = true; });
    expect(next).toBe(false);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
