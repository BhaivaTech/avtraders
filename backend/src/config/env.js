// src/config/env.js
// Validates critical environment variables at server startup.
// Imported BEFORE any other module in server.js.

const REQUIRED = [
  { key: 'SESSION_SECRET',  bad: ['change_me', 'changeme', ''],      minLen: 32 },
  { key: 'JWT_SECRET',      bad: ['CHANGE_ME', 'changeme', ''],       minLen: 16 },
  { key: 'ADMIN_EMAIL',     bad: [''],                                 minLen: 5  },
  { key: 'ADMIN_PASSWORD',  bad: [''],                                 minLen: 8  },
];

const errors = [];

for (const { key, bad, minLen } of REQUIRED) {
  const val = (process.env[key] || '').trim();
  if (!val || bad.includes(val)) {
    errors.push(`  ❌ ${key} is not set (or is still the placeholder value).`);
  } else if (val.length < minLen) {
    errors.push(`  ❌ ${key} is too short (min ${minLen} chars, got ${val.length}).`);
  }
}

if (errors.length) {
  console.error('\n[startup] ⛔  Server refused to start — fix your .env file:\n');
  errors.forEach((e) => console.error(e));
  console.error('\n  Copy .env.example → .env and fill in all values.\n');
  process.exit(1);
}

console.log('[startup] ✅  Environment variables validated.');
