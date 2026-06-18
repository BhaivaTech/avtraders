-- 004_canonicalize_schema.sql
-- Canonicalises the live schema against the source-of-truth in
-- `migrations/001_initial_schema.sql`. After this migration runs,
-- `src/utils/ensureTables.js`, `ensureDealerTables()` in
-- `src/models/dealerModel.js`, and `ensureQuotationSchema()` in
-- `src/models/quotationModel.js` are removed and the migrations
-- directory becomes the single source of truth.
--
-- Each statement is idempotent (uses IF NOT EXISTS / safe guards) so
-- a partially-applied production DB will converge on this state
-- without losing data.

/* ------------------------------------------------------------------ */
/*  Announcements table (was only declared in ensureTables.js)         */
/* ------------------------------------------------------------------ */
CREATE TABLE IF NOT EXISTS announcements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(20) DEFAULT 'UPDATE',
  title      VARCHAR(200) NULL,
  body       TEXT NOT NULL,
  link_url   VARCHAR(500) NULL,
  image_url  VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ------------------------------------------------------------------ */
/*  Columns that ensureTables.js + ensureQuotationSchema() added late  */
/* ------------------------------------------------------------------ */

-- users.farmer_last_seen_at  +  its index
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'users'
               AND COLUMN_NAME  = 'farmer_last_seen_at');
SET @sql := IF(@col = 0,
  'ALTER TABLE `users` ADD COLUMN `farmer_last_seen_at` DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'users'
               AND INDEX_NAME   = 'idx_users_farmer_seen');
SET @sql := IF(@idx = 0,
  'ALTER TABLE `users` ADD INDEX `idx_users_farmer_seen` (`farmer_last_seen_at`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- quotations.message_id
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'quotations'
               AND COLUMN_NAME  = 'message_id');
SET @sql := IF(@col = 0,
  'ALTER TABLE `quotations` ADD COLUMN `message_id` BIGINT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- quotations.status  (and paid_at)
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'quotations'
               AND COLUMN_NAME  = 'status');
SET @sql := IF(@col = 0,
  'ALTER TABLE `quotations` ADD COLUMN `status` ENUM(''PENDING'',''PAID'',''DELETED'') NOT NULL DEFAULT ''PENDING''',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'quotations'
               AND COLUMN_NAME  = 'paid_at');
SET @sql := IF(@col = 0,
  'ALTER TABLE `quotations` ADD COLUMN `paid_at` DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- quotations FK to messages
SET @fk := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND CONSTRAINT_NAME   = 'fk_quotations_message');
SET @sql := IF(@fk = 0,
  'ALTER TABLE `quotations` ADD CONSTRAINT `fk_quotations_message` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- dealers.blocked
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'dealers'
               AND COLUMN_NAME  = 'blocked');
SET @sql := IF(@col = 0,
  'ALTER TABLE `dealers` ADD COLUMN `blocked` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- users.blocked (re-applied for safety even though 001.sql declares it)
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'users'
               AND COLUMN_NAME  = 'blocked');
SET @sql := IF(@col = 0,
  'ALTER TABLE `users` ADD COLUMN `blocked` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_verified`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- chats.last_read_admin_at
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'chats'
               AND COLUMN_NAME  = 'last_read_admin_at');
SET @sql := IF(@col = 0,
  'ALTER TABLE `chats` ADD COLUMN `last_read_admin_at` DATETIME NULL AFTER `updated_at`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
