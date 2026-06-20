// test/config/env.test.js
// Verifies the strict env validator introduced in the previous
// quick-win batch.
//
// config/env.js calls process.exit(1) on bad input, which would
// terminate the test runner. We instead stub process.exit to throw
// a synthetic EXIT_N error, catch it, and assert the call happened.

import { describe, it, expect, vi } from 'vitest';

const MIN_REAL = {
  SESSION_SECRET: 'a'.repeat(32),
  JWT_SECRET: 'a'.repeat(20),
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'a'.repeat(8),
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASS: 'secret',
  DB_NAME: 'app',
};

function withEnv(overrides = {}) {
  const keys = Object.keys(MIN_REAL);
  const saved = {};
  for (const k of keys) {
    saved[k] = process.env[k];
    if (k in overrides) process.env[k] = overrides[k];
    else process.env[k] = MIN_REAL[k];
  }
  return () => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  };
}

function trapExit() {
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error('EXIT_' + code);
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return { exitSpy, errSpy, restore: () => { exitSpy.mockRestore(); errSpy.mockRestore(); } };
}

describe('config/env.js validate()', () => {
  it('accepts a fully-populated real-looking env', async () => {
    const restore = withEnv();
    try {
      const { validate } = await import('../../src/config/env.js?v=' + Date.now());
      const traps = trapExit();
      try { validate(); } catch (e) { expect(e.message).not.toMatch(/EXIT_/); }
      expect(traps.exitSpy).not.toHaveBeenCalled();
      traps.restore();
    } finally {
      restore();
    }
  });

  it('rejects JWT_SECRET="CHANGE_ME" placeholder', async () => {
    const restore = withEnv({ JWT_SECRET: 'CHANGE_ME' });
    try {
      const { validate } = await import('../../src/config/env.js?v=' + Math.random());
      const traps = trapExit();
      try { validate(); } catch (_) { /* expected */ }
      expect(traps.exitSpy).toHaveBeenCalledWith(1);
      const messages = traps.errSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(messages).toMatch(/JWT_SECRET/);
      traps.restore();
    } finally {
      restore();
    }
  });

  it('rejects short SESSION_SECRET', async () => {
    const restore = withEnv({ SESSION_SECRET: 'short' });
    try {
      const { validate } = await import('../../src/config/env.js?v=' + Math.random());
      const traps = trapExit();
      try { validate(); } catch (_) { /* expected */ }
      expect(traps.exitSpy).toHaveBeenCalledWith(1);
      const messages = traps.errSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(messages).toMatch(/SESSION_SECRET/);
      traps.restore();
    } finally {
      restore();
    }
  });

  it('rejects an invalid ADMIN_EMAIL', async () => {
    const restore = withEnv({ ADMIN_EMAIL: 'not-an-email' });
    try {
      const { validate } = await import('../../src/config/env.js?v=' + Math.random());
      const traps = trapExit();
      try { validate(); } catch (_) { /* expected */ }
      expect(traps.exitSpy).toHaveBeenCalledWith(1);
      const messages = traps.errSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(messages).toMatch(/ADMIN_EMAIL/);
      traps.restore();
    } finally {
      restore();
    }
  });

  it('rejects missing DB_PASS', async () => {
    const restore = withEnv({ DB_PASS: '' });
    try {
      const { validate } = await import('../../src/config/env.js?v=' + Math.random());
      const traps = trapExit();
      try { validate(); } catch (_) { /* expected */ }
      expect(traps.exitSpy).toHaveBeenCalledWith(1);
      const messages = traps.errSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(messages).toMatch(/DB_PASS/);
      traps.restore();
    } finally {
      restore();
    }
  });
});
