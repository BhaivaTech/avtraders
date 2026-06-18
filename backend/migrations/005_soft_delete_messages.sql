-- 005_soft_delete_messages.sql
-- Soft-delete support for chat messages.
--
-- The chat thread (chatModel.getChatThread) and the admin chat list
-- (chatModel.getAllChatsForAdmin) already reference
-- `messages.deleted_for_admin` and `messages.deleted_for_farmer`,
-- but those columns were never declared in the canonical schema —
-- they only existed in the now-deleted ensureTables.js. This
-- migration adds the columns and the supporting index.
--
-- The matching idx_messages_chat_deleted index was previously
-- declared in 002_add_indexes.sql and intentionally dropped from
-- that file when we deleted the soft-delete reference. It is
-- reintroduced here, alongside the column it depends on.

/* ------------------------------------------------------------------ */
/*  messages.deleted_for_admin  +  messages.deleted_for_farmer        */
/* ------------------------------------------------------------------ */
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'messages'
               AND COLUMN_NAME  = 'deleted_for_admin');
SET @sql := IF(@col = 0,
  'ALTER TABLE `messages` ADD COLUMN `deleted_for_admin` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'messages'
               AND COLUMN_NAME  = 'deleted_for_farmer');
SET @sql := IF(@col = 0,
  'ALTER TABLE `messages` ADD COLUMN `deleted_for_farmer` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

/* ------------------------------------------------------------------ */
/*  Composite index for the most frequent query pattern in           */
/*  getAllChatsForAdmin (filters by chat_id + deleted_for_admin).    */
/* ------------------------------------------------------------------ */
SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'messages'
               AND INDEX_NAME   = 'idx_messages_chat_deleted');
SET @sql := IF(@idx = 0,
  'ALTER TABLE `messages` ADD INDEX `idx_messages_chat_deleted` (`chat_id`, `deleted_for_admin`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
