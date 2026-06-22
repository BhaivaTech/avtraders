-- migrations/007_admin_users_rbac.sql
-- Creates the admin_users table for RBAC.
-- Seeds the env-configured superadmin email as the first record (idempotent).

CREATE TABLE IF NOT EXISTS admin_users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        VARCHAR(120) NOT NULL DEFAULT 'Admin',
  role        ENUM('superadmin','manager','support','finance') NOT NULL DEFAULT 'support',
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admin_users_email (email),
  INDEX idx_admin_users_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
