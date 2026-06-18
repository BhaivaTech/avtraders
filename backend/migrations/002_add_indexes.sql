-- 002_add_indexes.sql
-- Add performance indexes.
-- Idempotent: uses INFORMATION_SCHEMA checks before each ALTER so
-- this migration is safe to re-run even if the index already exists.
--
-- NOTE: idx_messages_chat_deleted was previously defined here on
-- (chat_id, deleted_for_admin). It depended on a soft-delete column
-- that is not yet in the canonical schema, so it is intentionally
-- dropped from this migration. The column and the index will be
-- reintroduced together in a later migration once the soft-delete
-- feature lands.

-- Index for the unread-count subquery in getAllChatsForAdmin.
SET @idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'messages'
               AND INDEX_NAME   = 'idx_messages_chat_role_created');
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_messages_chat_role_created ON messages (chat_id, sender_role, created_at)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
