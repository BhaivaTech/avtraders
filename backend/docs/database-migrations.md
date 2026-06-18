# Database Migrations

## Overview

The database migration framework provides version-controlled schema changes that can be applied automatically on server startup. This replaces manual SQL scripts and ensures all environments (development, staging, production) have the same schema.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Server Startup                         │
├─────────────────────────────────────────────────────────┤
│  1. Load .env                                           │
│  2. Validate env vars                                   │
│  3. Run migrations  ← NEW                               │
│  4. ensureTables()  ← Existing (idempotent)             │
│  5. Start listening                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Migration System                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  migrations/                      schema_migrations      │
│  ├── 001_initial_schema.sql       ┌──────────────────┐  │
│  ├── 002_add_feature.sql          │ name             │  │
│  └── 003_add_index.sql            ├──────────────────┤  │
│                                    │ 001_initial...   │  │
│         ↓ Apply in order           │ 002_add_feat...  │  │
│                                    └──────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `src/utils/migrations.js` | Migration framework |
| `migrations/` | Directory for migration files |
| `migrations/001_initial_schema.sql` | Baseline schema |

## Usage

### Running Migrations

Migrations run **automatically** on server startup:

```bash
npm start
# Output:
# [migrations] Applying 001_initial_schema.sql...
# [migrations] ✅ Applied
# [migrations] Completed: 1 migration applied
```

### Check Status

```bash
npm run migrate:status
```

Output:
```json
{
  "total": 3,
  "applied": 1,
  "pending": [
    "002_add_blocked_column.sql",
    "003_create_announcements.sql"
  ]
}
```

Or via API (admin only):
```bash
curl -H "Cookie: session=..." http://localhost:5100/api/admin/migrations
```

### Manual Migration

Migrations are applied in the order of their filenames (sorted alphabetically/numerically).

---

## Creating Migrations

### Naming Convention

```
NNN_description.sql
```

Examples:
```
001_initial_schema.sql
002_add_blocked_column.sql
003_create_announcements.sql
004_add_indexes.sql
```

**Important:** Use zero-padded numbers (001, 002, etc.) to ensure correct ordering.

### Migration File Structure

```sql
-- 002_add_blocked_column.sql
-- Add blocked column to users table for user blocking feature.
-- Author: Developer Name
-- Date: 2024-06-12

ALTER TABLE `users`
  ADD COLUMN `blocked` TINYINT(1) NOT NULL DEFAULT 0
  AFTER `is_verified`;
```

### Multi-Statement Migrations

```sql
-- 003_create_announcements.sql

CREATE TABLE IF NOT EXISTS announcements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(20) DEFAULT 'UPDATE',
  title      VARCHAR(200) NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add index
CREATE INDEX idx_announcements_created ON announcements (created_at DESC);
```

### Idempotent Migrations

Use `IF NOT EXISTS` and `IF EXISTS` for safety:

```sql
-- Safe: Won't fail if table exists
CREATE TABLE IF NOT EXISTS new_table (...);

-- Safe: Won't fail if column exists
-- (Note: MySQL doesn't support IF EXISTS for ADD COLUMN,
--  so the framework handles duplicate column errors gracefully)
ALTER TABLE users ADD COLUMN new_col VARCHAR(50);
```

---

## Rollback Support

### Creating Rollback Files

For each migration, optionally create a `.down.sql` file:

```
migrations/
├── 002_add_blocked_column.sql          # Forward migration
└── 002_add_blocked_column.down.sql     # Rollback migration
```

**Rollback file example:**
```sql
-- 002_add_blocked_column.down.sql
-- Rollback: Remove blocked column from users table.

ALTER TABLE `users` DROP COLUMN `blocked`;
```

### Rolling Back

```javascript
import { rollbackMigration } from './src/utils/migrations.js';

await rollbackMigration('002_add_blocked_column.sql');
```

---

## How It Works

### Tracking Table

The framework creates a `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Migration Process

1. **Read** all `.sql` files from `migrations/` directory
2. **Sort** files alphabetically (001, 002, 003...)
3. **Check** which migrations are already applied
4. **Apply** pending migrations in order
5. **Record** each successful migration in `schema_migrations`
6. **Fail fast** if any migration errors

### Error Handling

```javascript
try {
  await runMigrations();
} catch (err) {
  // Migration failed — server won't start
  logger.error({ err }, 'Migration failed');
  process.exit(1);
}
```

If a migration fails:
- The error is logged with the migration filename
- The server **will not start** (prevents inconsistent state)
- Previous migrations remain applied
- Fix the SQL and restart

---

## Examples

### Adding a Column

```sql
-- 004_add_last_login.sql
ALTER TABLE `users`
  ADD COLUMN `last_login_at` DATETIME NULL
  AFTER `created_at`;
```

### Creating a Table

```sql
-- 005_create_audit_log.sql
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NULL,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(100) NOT NULL,
  entity_id  INT NULL,
  details    JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Adding an Index

```sql
-- 006_add_user_indexes.sql
-- Note: MySQL doesn't support IF NOT EXISTS for indexes,
-- so we use CREATE INDEX and catch the duplicate error.

CREATE INDEX idx_users_mobile ON users (mobile);
CREATE INDEX idx_users_role ON users (role);
```

### Modifying Column

```sql
-- 007_alter_user_email.sql
ALTER TABLE `users`
  MODIFY COLUMN `email` VARCHAR(255) NULL;
```

### Data Migration

```sql
-- 008_backfill_user_roles.sql
-- Set default role for existing users without one
UPDATE `users`
SET `role` = 'farmer'
WHERE `role` IS NULL OR `role` = '';
```

---

## Best Practices

### 1. Keep Migrations Small

```sql
-- ❌ Bad: One giant migration
-- 001_everything.sql (500 lines)

-- ✅ Good: Focused migrations
-- 001_create_users.sql
-- 002_create_chats.sql
-- 003_create_messages.sql
```

### 2. Make Migrations Idempotent

```sql
-- ✅ Safe to run multiple times
CREATE TABLE IF NOT EXISTS users (...);

-- ⚠️ Will fail if column exists (framework handles this)
ALTER TABLE users ADD COLUMN blocked TINYINT(1) DEFAULT 0;
```

### 3. Always Add Comments

```sql
-- 009_add_payment_refunds.sql
-- Adds refund tracking columns to payments table.
-- Related to feature: Payment refunds (JIRA-123)
-- Author: Developer Name
-- Date: 2024-06-12

ALTER TABLE `payments`
  ADD COLUMN `refunded_at` DATETIME NULL,
  ADD COLUMN `refund_amount` DECIMAL(12,2) NULL;
```

### 4. Test Rollbacks

```bash
# Apply migration
npm start

# Verify it works
npm run migrate:status

# Test rollback (in dev)
node -e "import('./src/utils/migrations.js').then(m => m.rollbackMigration('009_add_payment_refunds.sql'))"
```

### 5. Don't Modify Applied Migrations

```bash
# ❌ BAD: Edit 001_initial_schema.sql after it's been applied
# The framework won't re-run it (already in schema_migrations)

# ✅ GOOD: Create a new migration for changes
# 010_fix_users_table.sql
```

---

## Integration with ensureTables()

The existing `ensureTables()` function remains for backward compatibility:

```javascript
// server.js
await runMigrations();   // NEW: Version-controlled migrations
await ensureTables();    // EXISTING: Idempotent table creation
```

### Migration vs ensureTables()

| Aspect | Migrations | ensureTables() |
|--------|------------|----------------|
| Purpose | Schema evolution | Initial setup |
| Tracking | Yes (schema_migrations) | No |
| Rollback | Yes (.down.sql) | No |
| Order | Sequential | Idempotent |
| Production use | Yes | Yes (backup) |

**Recommendation:** Use migrations for all schema changes. Keep `ensureTables()` as a safety net for new deployments.

---

## Troubleshooting

### Migration Already Applied But Failed

If `schema_migrations` records a migration but it actually failed:

```sql
-- Remove the record manually
DELETE FROM schema_migrations WHERE name = '002_problematic.sql';

-- Fix the migration file and restart
```

### Duplicate Column Error

```
Error: Duplicate column name 'blocked'
```

**Cause:** Column already exists (migration was partially applied before).

**Solution:** The framework handles errno 1060 (duplicate column) gracefully. If it still fails, add error handling:

```sql
-- Use stored procedure for conditional ALTER
-- Or: just let the framework catch the error
```

### Migration Order Issues

**Problem:** Migrations applied in wrong order.

**Solution:** Use consistent zero-padded numbering:
```
001_first.sql    ✅
002_second.sql   ✅
010_tenth.sql    ✅
```

Not:
```
1_first.sql      ❌ (sorts after 10)
2_second.sql     ❌
10_tenth.sql     ❌ (sorts before 2)
```

---

## Advanced Usage

### Programmatic Access

```javascript
import { runMigrations, rollbackMigration, migrationStatus } from './src/utils/migrations.js';

// Run all pending migrations
await runMigrations();

// Rollback a specific migration
await rollbackMigration('002_add_feature.sql');

// Get status
const status = await migrationStatus();
console.log(`Applied: ${status.applied}/${status.total}`);
console.log('Pending:', status.pending);
```

### Custom Migration Directory

```javascript
// Override default directory
process.env.MIGRATIONS_DIR = '/path/to/custom/migrations';
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run migrations
  run: |
    npm run migrate:status
    npm start &
    sleep 5
    npm run migrate:status
```

---

## Resources

- [Flyway](https://flywaydb.org/) — Inspiration for this framework
- [Knex Migrations](https://knexjs.org/guide/migrations.html) — Alternative approach
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/database-migration-best-practices)
