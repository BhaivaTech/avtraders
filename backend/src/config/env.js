// src/config/env.js
// Validates critical environment variables at server startup.
// Imported BEFORE any other module in server.js so a missing secret
// stops the process before any route / DB work is initialised.
//
// IMPORTANT: this file is imported as a side-effect from server.js AFTER
// dotenv has populated process.env. We only validate here — we do NOT
// load .env again, because that would race with server.js and re-introduce
// the "override" / "shell exports empty string" bug we just fixed.

import logger from '../utils/logger.js';

/* ------------------------------------------------------------------ */
/*  Rules                                                              */
/* ------------------------------------------------------------------ */

// Strings that are placeholders from .env.example and must never be used.
const PLACEHOLDER_TOKENS = [
  'change_me', 'changeme', 'change-me',
  'your_strong_random_session_secret_here',
  'your_jwt_secret_here',
  'your_admin_password',
  'your_db_user', 'your_db_password', 'your_db_name',
  'your_msg91_auth_key', 'your_msg91_namespace_uuid',
  'your_smtp_email', 'your_smtp_app_password',
  'your_merchant_id', 'your_salt_key',
];

const REQUIRED = [
  { key: 'SESSION_SECRET', minLen: 32 },
  { key: 'JWT_SECRET',     minLen: 16 },
  { key: 'ADMIN_EMAIL',    minLen: 5, isEmail: true },
  { key: 'ADMIN_PASSWORD', minLen: 8 },
  { key: 'DB_HOST',        minLen: 1 },
  { key: 'DB_USER',        minLen: 1 },
  { key: 'DB_PASS',        minLen: 1 },
  { key: 'DB_NAME',        minLen: 1 },
];

/* ------------------------------------------------------------------ */
/*  Validate                                                            */
/* ------------------------------------------------------------------ */

export function validate() {
  const errors = [];

  for (const { key, minLen, isEmail } of REQUIRED) {
    const val = (process.env[key] || '').trim();

    if (!val) {
      errors.push(`  ❌ ${key} is not set.`);
      continue;
    }

    // Reject obvious placeholders from .env.example
    if (PLACEHOLDER_TOKENS.includes(val.toLowerCase())) {
      errors.push(`  ❌ ${key} is still the placeholder value from .env.example.`);
      continue;
    }

    if (val.length < minLen) {
      errors.push(`  ❌ ${key} is too short (min ${minLen} chars, got ${val.length}).`);
      continue;
    }

    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      errors.push(`  ❌ ${key} does not look like a valid email.`);
    }
  }

  if (errors.length) {
    // Use console here intentionally: logger may depend on env-derived
    // configuration that has not finished validating yet, and we want the
    // message to reach the operator's terminal at exit.
    // eslint-disable-next-line no-console
    console.error('\n[startup] ⛔  Server refused to start — fix your .env file:\n');
    for (const e of errors) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    // eslint-disable-next-line no-console
    console.error('\n  Copy .env.example → .env and fill in all values.\n');
    process.exit(1);
  }

  logger.info({ keys: REQUIRED.map((r) => r.key) }, '[startup] env validated');
}

// Auto-run only when this module is the entry point. When imported
// by tests we expose `validate()` for explicit invocation.
if (import.meta.url === `file://${process.argv[1]}`) {
  validate();
}

