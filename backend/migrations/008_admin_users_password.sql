-- migrations/008_admin_users_password.sql
-- Add password_hash column to admin_users table for per-user passwords

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_users'
    AND COLUMN_NAME = 'password_hash'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE admin_users ADD COLUMN password_hash VARCHAR(255) NULL AFTER role;',
  'SELECT "Column password_hash already exists on admin_users";'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
