# AV Traders Backend — Infrastructure Improvements

This document covers the 8 major infrastructure improvements implemented in the backend codebase.

## Table of Contents

| # | Improvement | Documentation |
|---|-------------|---------------|
| 15 | CSRF Protection | [csrf-protection.md](./csrf-protection.md) |
| 16 | Webhook Signature Verification | [webhook-verification.md](./webhook-verification.md) |
| 17 | Input Validation (Zod) | [input-validation.md](./input-validation.md) |
| 18 | Shared Modules | [shared-modules.md](./shared-modules.md) |
| 19 | Split Components | [component-architecture.md](./component-architecture.md) |
| 20 | Error Logging (Pino/Sentry) | [error-logging.md](./error-logging.md) |
| 21 | Database Migrations | [database-migrations.md](./database-migrations.md) |
| 22 | Backup Strategy | [backup-strategy.md](./backup-strategy.md) |

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Update Environment Variables

Copy the new variables from `.env.example` to your `.env`:

```bash
# Required for CSRF protection
CSRF_DISABLED=0

# Logging level (trace|debug|info|warn|error|fatal)
LOG_LEVEL=info

# Optional: Sentry error tracking
SENTRY_DSN=

# Backup configuration
BACKUP_DIR=./backups
BACKUP_RETAIN=7
BACKUP_COMPRESS=true
```

### 3. Run Database Migrations

```bash
# Check migration status
npm run migrate:status

# Migrations run automatically on server startup
npm start
```

### 4. Create First Backup

```bash
npm run backup
```

---

## Architecture Overview

```
backend/
├── docs/                          # 📖 Documentation (NEW)
│   ├── README.md                  # This file
│   ├── csrf-protection.md
│   ├── webhook-verification.md
│   ├── input-validation.md
│   ├── shared-modules.md
│   ├── component-architecture.md
│   ├── error-logging.md
│   ├── database-migrations.md
│   └── backup-strategy.md
├── migrations/                    # 📦 Database migrations (NEW)
│   └── 001_initial_schema.sql
├── scripts/                       # 🔧 Utility scripts (NEW)
│   └── backup.js
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── dealer/               # 🆕 Split dealer controller
│   │   │   ├── auth.js
│   │   │   ├── register.js
│   │   │   ├── pricelist.js
│   │   │   └── index.js
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── dealerController.js   # Re-exports from dealer/
│   │   └── ...
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── csrf.js               # 🆕 CSRF protection
│   │   ├── rateLimiter.js        # 🆕 Shared rate limiters
│   │   ├── upload.js
│   │   └── validate.js           # 🆕 Zod validation middleware
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   │   ├── helpers.js            # 🆕 Shared utilities
│   │   ├── logger.js             # 🆕 Pino structured logging
│   │   ├── migrations.js         # 🆕 Migration framework
│   │   ├── sentry.js             # 🆕 Sentry integration
│   │   └── ...
│   └── validations/
│       └── schemas.js            # 🆕 Zod schemas
└── server.js                     # Updated with all integrations
```

---

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | ^4.4.3 | Runtime input validation |
| `pino` | ^10.3.1 | Structured JSON logging |
| `pino-pretty` | ^13.1.3 | Pretty log formatting (dev) |
| `cookie-parser` | ^1.4.7 | Cookie parsing for CSRF |

### Optional Dependencies

| Package | Purpose |
|---------|---------|
| `@sentry/node` | Production error tracking (install only if using Sentry) |

---

## New npm Scripts

```bash
npm run backup          # Create database backup
npm run backup:list     # List existing backups
npm run backup:verify   # Verify latest backup integrity
npm run migrate:status  # Check migration status
```

---

## New API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/csrf-token` | Get CSRF token for frontend |
| `GET` | `/api/admin/migrations` | View migration status (admin only) |

---

## Environment Variables Reference

### CSRF Protection
| Variable | Default | Description |
|----------|---------|-------------|
| `CSRF_DISABLED` | `0` | Set to `1` to disable CSRF checks (testing only) |

### Logging
| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Minimum log level |

### Sentry (Optional)
| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | (empty) | Sentry DSN URL for error tracking |

### Backup
| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `./backups` | Directory to store backups |
| `BACKUP_RETAIN` | `7` | Number of backups to keep |
| `BACKUP_COMPRESS` | `true` | Enable gzip compression |

---

## Migration Checklist

When deploying these changes to production:

- [ ] Run `npm install` to install new dependencies
- [ ] Add new environment variables to `.env`
- [ ] Run database migrations (happens automatically on startup)
- [ ] Update frontend `api.js` (already done — handles CSRF tokens)
- [ ] Test CSRF token flow with frontend
- [ ] Verify webhook signature verification with PhonePe
- [ ] Set up automated backup cron job
- [ ] (Optional) Install `@sentry/node` and configure `SENTRY_DSN`
- [ ] Monitor logs for any validation errors after deployment

---

## Rollback Plan

If issues arise after deployment:

1. **CSRF Issues**: Set `CSRF_DISABLED=1` in `.env` to temporarily disable
2. **Validation Errors**: The Zod middleware returns `400` with detailed error messages
3. **Logging Issues**: Set `LOG_LEVEL=error` to reduce log noise
4. **Database Issues**: Use `scripts/backup.js --restore <file>` to restore from backup

---

## Support

For questions or issues with these improvements, refer to the individual documentation files in this directory.
