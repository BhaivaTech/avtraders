# Local Database Setup Guide

> **AV Traders Agri Clinic — Backend**  
> Use this guide whenever you need to run the project locally against a local MySQL database instead of the live VPS.

---

## Overview

The project uses **MySQL 8.0** with a custom migration system. Migrations live in `backend/migrations/` and are numbered sequentially. They are **idempotent** (safe to re-run).

| Environment | DB Host | DB Name | User |
|-------------|---------|---------|------|
| **Local Dev** | `127.0.0.1` | `avtradersdb` | `avtraders_dev` |
| **Production** | `46.28.44.56` | `avtradersdb` | `appuser` |

---

## Prerequisites

- Ubuntu / Debian Linux
- MySQL 8.0 installed (see below if not installed)

### Install MySQL (one-time)

```bash
sudo apt install mysql-server mysql-client -y
```

MySQL starts automatically after install. Verify:

```bash
systemctl is-active mysql   # should print: active
mysql --version
```

---

## First-Time Local Setup

### Step 1 — Create the database and dev user

Run once with `sudo` (uses the root MySQL socket):

```bash
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS avtradersdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'avtraders_dev'@'127.0.0.1' IDENTIFIED BY 'DevLocal@123';
GRANT ALL PRIVILEGES ON avtradersdb.* TO 'avtraders_dev'@'127.0.0.1';
CREATE USER IF NOT EXISTS 'avtraders_dev'@'localhost' IDENTIFIED BY 'DevLocal@123';
GRANT ALL PRIVILEGES ON avtradersdb.* TO 'avtraders_dev'@'localhost';
FLUSH PRIVILEGES;
"
```

### Step 2 — Run all migrations

```bash
cd "/path/to/avtraders/backend"
bash scripts/setup-local-db.sh
```

Expected output:

```
==========================================
  AV Traders — Local DB Migration Runner
==========================================
  Host : 127.0.0.1:3306
  DB   : avtradersdb
  User : avtraders_dev
==========================================

→ Testing connection...
   ✓  Connection OK

→ Running 001_initial_schema.sql ... ✓ done
→ Running 002_add_indexes.sql ...    ✓ done
→ Running 003_auth_audit.sql ...     ✓ done
→ Running 004_canonicalize_schema.sql ... ✓ done
→ Running 005_soft_delete_messages.sql ... ✓ done
→ Running 006_announcement_management.sql ... ✓ done

==========================================
  ✅  All 6 migrations applied successfully!
==========================================
```

---

## Environment Configuration (`.env`)

The `.env` file is pre-configured for local dev. Production credentials are **commented out** for quick switching.

### Local dev (active)

```env
# ---- mysql (LOCAL DEV) ----
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=avtraders_dev
DB_PASS=DevLocal@123
DB_NAME=avtradersdb
```

### Switch back to production

Comment out the local block and uncomment the production block:

```env
# ---- mysql (PRODUCTION - uncomment to switch back) ----
# DB_HOST=46.28.44.56
# DB_PORT=3306
# DB_USER=appuser
# DB_PASS=DataSync@VPS1
# DB_NAME=avtradersdb
```

> ⚠️ **Never commit the production credentials.** The `.env` file is in `.gitignore`.

### Other dev-specific settings changed

| Key | Local Value | Production Value |
|-----|-------------|-----------------|
| `OTP_DEV_FALLBACK` | `1` (skip real WhatsApp OTP) | `0` |
| `COOKIE_DOMAIN` | commented out | `.avtradersagriclinic.com` |
| `PUBLIC_BASE_URL` | `http://localhost:5100` | `https://www.avtradersagriclinic.com` |
| `BACKEND_BASE_URL` | `http://localhost:5100` | `https://www.avtradersagriclinic.com` |
| `APP_ORIGIN` | `http://localhost:5173` | `https://www.avtradersagriclinic.com` |

---

## Migrations

### Directory structure

```
backend/migrations/
  001_initial_schema.sql          — Core tables (users, chats, messages, etc.)
  002_add_indexes.sql             — Additional indexes
  003_auth_audit.sql              — auth_audit table
  004_canonicalize_schema.sql     — Schema cleanup and normalization
  005_soft_delete_messages.sql    — Soft delete support on messages
  006_announcement_management.sql — Announcement table columns + indexes
```

### Adding a new migration

1. Create a new file: `migrations/007_your_feature.sql`
2. Use the idempotent pattern (check before alter):

```sql
-- 007_your_feature.sql
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'your_table'
               AND COLUMN_NAME  = 'new_column');
SET @sql := IF(@col = 0,
  'ALTER TABLE `your_table` ADD COLUMN `new_column` VARCHAR(120) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
```

3. Re-run the migration script:

```bash
bash scripts/setup-local-db.sh
```

### Checking migration status (via app)

```bash
npm run migrate:status
```

---

## Tables Created

After running all migrations, the following 21 tables exist:

| Table | Purpose |
|-------|---------|
| `users` | Farmers, dealers, admin accounts |
| `farmer_profiles` | Extended farmer info |
| `farmer_otps` | WhatsApp OTP sessions (farmers) |
| `admin_otps` | Email OTP sessions (admin) |
| `otps` | Legacy OTP table |
| `chats` | Farmer–dealer consultation threads |
| `messages` | Chat messages (with soft delete) |
| `attachments` | Files attached to messages |
| `quotations` | Quotation PDFs linked to chats |
| `payments` | PhonePe payment records |
| `products` | Product catalogue |
| `dealer_orders` | Dealer purchase orders |
| `dealer_order_items` | Line items in dealer orders |
| `dealers` | Dealer registration records |
| `dealer_otp_sessions` | OTP sessions for dealer login |
| `dealer_documents` | GST / insecticide licence files |
| `dealer_audit` | Audit log for dealer actions |
| `dealer_download_tokens` | Secure pricelist download tokens |
| `price_lists` | Uploaded pricelist files |
| `auth_audit` | Auth event log (login/logout/fail) |
| `announcements` | Ticker/banner announcements |

---

## Starting the Backend

```bash
cd backend
npm run dev
```

The server starts on `http://localhost:5100`.

---

## Troubleshooting

### `Access denied for user 'avtraders_dev'`
Re-run Step 1 (the `sudo mysql` command).

### `Can't connect to MySQL server`
```bash
sudo systemctl start mysql
sudo systemctl enable mysql   # auto-start on boot
```

### Migration warnings about password on CLI
The `mysql: [Warning] Using a password on the command line...` messages are harmless — MySQL prints them when `-p` is used inline. Migrations still apply correctly.

### Reset the local database completely

```bash
sudo mysql -e "DROP DATABASE avtradersdb; CREATE DATABASE avtradersdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
bash scripts/setup-local-db.sh
```
