CREATE TABLE IF NOT EXISTS auth_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_type ENUM('farmer','dealer','admin','system') NOT NULL,
  actor_id VARCHAR(64) NULL,
  identifier VARCHAR(255) NULL,
  action VARCHAR(80) NOT NULL,
  success TINYINT(1) NOT NULL DEFAULT 1,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  meta JSON NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_auth_audit_actor (actor_type, actor_id),
  INDEX idx_auth_audit_identifier (identifier),
  INDEX idx_auth_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
