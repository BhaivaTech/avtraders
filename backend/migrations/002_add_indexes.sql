-- 002_add_indexes.sql
-- Add performance indexes and security improvements.

-- Composite index for the most frequent query pattern in getAllChatsForAdmin
CREATE INDEX idx_messages_chat_deleted ON messages (chat_id, deleted_for_admin);

-- Index for unread count subquery
CREATE INDEX idx_messages_chat_role_created ON messages (chat_id, sender_role, created_at);
