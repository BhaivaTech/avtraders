-- 006_announcement_management.sql
-- Adds the columns the announcement admin page already wants to set
-- (image_url, active) plus the management columns (starts_at, ends_at,
-- pinned, created_by, updated_at). Idempotent via the
-- INFORMATION_SCHEMA pattern used by 004.

/* ------------------------------------------------------------------ */
/*  New columns on announcements                                       */
/* ------------------------------------------------------------------ */

-- image_url: shown next to the ticker banner.
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND COLUMN_NAME  = 'image_url');
SET @sql := IF(@col = 0,
  'ALTER TABLE `announcements` ADD COLUMN `image_url` VARCHAR(500) NULL AFTER `link_url`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- message: back-compat alias for the React form which posts `message`.
-- The controller maps body <-> message so the value stays consistent.
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND COLUMN_NAME  = 'message');
SET @sql := IF(@col = 0,
  'ALTER TABLE `announcements` ADD COLUMN `message` TEXT NULL AFTER `body`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- active: 0 = hidden, 1 = visible. Default 1 keeps existing rows showing.
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND COLUMN_NAME  = 'active');
SET @sql := IF(@col = 0,
  'ALTER TABLE `announcements` ADD COLUMN `active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `image_url`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- starts_at / ends_at: optional schedule window. NULL = always-while-active.
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND COLUMN_NAME  = 'starts_at');
SET @sql := IF(@col = 0,
  'ALTER TABLE `announcements` ADD COLUMN `starts_at` DATETIME NULL AFTER `active`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND COLUMN_NAME  = 'ends_at');
SET @sql := IF(@col = 0,
  'ALTER TABLE `announcements` ADD COLUMN `ends_at` DATETIME NULL AFTER `starts_at`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pinned: sticky-at-top flag for the ticker.
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND COLUMN_NAME  = 'pinned');
SET @sql := IF(@col = 0,
  'ALTER TABLE `announcements` ADD COLUMN `pinned` TINYINT(1) NOT NULL DEFAULT 0 AFTER `ends_at`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- created_by: actor email / id captured at write time.
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND COLUMN_NAME  = 'created_by');
SET @sql := IF(@col = 0,
  'ALTER TABLE `announcements` ADD COLUMN `created_by` VARCHAR(120) NULL AFTER `pinned`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- updated_at: auto-bumped on every UPDATE.
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND COLUMN_NAME  = 'updated_at');
SET @sql := IF(@col = 0,
  'ALTER TABLE `announcements` ADD COLUMN `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP AFTER `created_by`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

/* ------------------------------------------------------------------ */
/*  Index for the most common admin list query:                        */
/*    WHERE active = ? ORDER BY pinned DESC, created_at DESC           */
/* ------------------------------------------------------------------ */
SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'announcements'
               AND INDEX_NAME   = 'idx_announcements_active_pinned');
SET @sql := IF(@idx = 0,
  'ALTER TABLE `announcements` ADD INDEX `idx_announcements_active_pinned` (`active`, `pinned`, `created_at`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

/* ------------------------------------------------------------------ */
/*  Backfill: copy body -> message for any existing rows where message */
/*  is NULL. This keeps the React form's "message" key working.        */
/* ------------------------------------------------------------------ */
UPDATE `announcements`
   SET `message` = `body`
 WHERE `message` IS NULL;
