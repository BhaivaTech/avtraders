-- backend/schema.sql
-- Authoritative schema for AV Traders Agri Clinic.
-- Kept in sync with src/utils/ensureTables.js.
-- All indexes are named to allow idempotent re-runs.

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  role       ENUM('farmer','dealer','admin') NOT NULL DEFAULT 'farmer',
  name       VARCHAR(120),
  address    TEXT,
  mobile     VARCHAR(15) UNIQUE,
  whatsapp   VARCHAR(15),
  email      VARCHAR(120),
  blocked    TINYINT(1) NOT NULL DEFAULT 0,
  is_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS farmer_profiles (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  full_name  VARCHAR(120) NOT NULL,
  mobile     VARCHAR(15) NOT NULL,
  whatsapp   VARCHAR(15) NOT NULL,
  village    VARCHAR(120) NOT NULL,
  taluk      VARCHAR(120) NOT NULL,
  district   VARCHAR(120) NOT NULL,
  pincode    VARCHAR(10) NOT NULL,
  land_size  VARCHAR(60),
  crops_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE  KEY uq_farmer_profiles_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS otps (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  mobile     VARCHAR(15),
  code       VARCHAR(6),
  expires_at DATETIME,
  verified   TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otps_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Farmer OTP table (used by otpFarmer.js)
CREATE TABLE IF NOT EXISTS farmer_otps (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  mobile     VARCHAR(10) NOT NULL,
  code       VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified   TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_farmer_otps_mobile_created (mobile, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin OTP table (used by otpAdmin.js)
CREATE TABLE IF NOT EXISTS admin_otps (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  code       VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified   TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_otps_email_created (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chats (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT,
  status          ENUM('UNREAD','READ','SENT') DEFAULT 'UNREAD',
  last_spray_date DATE NULL,
  last_chemical   VARCHAR(120) NULL,
  last_dosage     VARCHAR(60) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chats_user_id (user_id),
  INDEX idx_chats_status  (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  chat_id     INT,
  sender_role ENUM('farmer','dealer','admin','system'),
  text        TEXT,
  meta        JSON,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_chat_id    (chat_id),
  INDEX idx_messages_created_at (created_at),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attachments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  message_id       INT,
  file_path        VARCHAR(255),
  mime_type        VARCHAR(120),
  kind             VARCHAR(20),
  original_name    VARCHAR(255),
  duration_seconds INT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attachments_message_id (message_id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quotations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  chat_id    INT,
  message_id INT NULL,
  file_path  VARCHAR(255),
  amount     DECIMAL(12,2) DEFAULT 0,
  currency   VARCHAR(8) DEFAULT 'INR',
  paid       TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quotations_chat_id (chat_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  chat_id    INT,
  provider   VARCHAR(32),
  status     ENUM('pending','success','failed') DEFAULT 'pending',
  amount     DECIMAL(12,2) DEFAULT 0,
  txn_id     VARCHAR(120),
  meta       JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_chat_id (chat_id),
  INDEX idx_payments_txn_id  (txn_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(160) NOT NULL,
  unit       VARCHAR(32) DEFAULT 'pcs',
  price      DECIMAL(12,2) DEFAULT 0,
  is_active  TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dealer_orders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  dealer_id  INT,
  status     ENUM('placed','paid','shipped','completed','cancelled') DEFAULT 'placed',
  total      DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dealer_orders_dealer_id (dealer_id),
  FOREIGN KEY (dealer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dealer_order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT,
  product_id INT,
  qty        DECIMAL(12,2) DEFAULT 1,
  price      DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES dealer_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
--  Dealer Portal Tables
-- =========================

CREATE TABLE IF NOT EXISTS dealer_otp_sessions (
  phone      VARCHAR(10) PRIMARY KEY,
  otp_hash   VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts   INT DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dealers (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(120) NOT NULL,
  firm_name        VARCHAR(180) NOT NULL,
  phone            VARCHAR(10) UNIQUE NOT NULL,
  email            VARCHAR(160) NULL,
  gst              VARCHAR(20) NOT NULL,
  village_post     VARCHAR(160) NOT NULL,
  taluk            VARCHAR(120) NOT NULL,
  district         VARCHAR(120) NOT NULL,
  pincode          VARCHAR(10) NOT NULL,
  status           ENUM('pending','approved','rejected') DEFAULT 'pending',
  blocked          TINYINT(1) NOT NULL DEFAULT 0,
  rejection_reason TEXT NULL,
  created_at       DATETIME,
  updated_at       DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dealer_documents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  dealer_id   INT NOT NULL,
  type        ENUM('gst','insecticide') NOT NULL,
  file_path   VARCHAR(255) NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_hash   VARCHAR(64) NOT NULL,
  uploaded_at DATETIME,
  INDEX idx_dealer_docs_dealer_id (dealer_id),
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dealer_audit (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  dealer_id  INT NOT NULL,
  action     VARCHAR(50) NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  actor_id   VARCHAR(50) NULL,
  note       TEXT NULL,
  created_at DATETIME,
  INDEX idx_dealer_audit_dealer_id (dealer_id),
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS auth_audit (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_type  ENUM('farmer','dealer','admin','system') NOT NULL,
  actor_id    VARCHAR(64) NULL,
  identifier  VARCHAR(255) NULL,
  action      VARCHAR(80) NOT NULL,
  success     TINYINT(1) NOT NULL DEFAULT 1,
  ip          VARCHAR(64) NULL,
  user_agent  VARCHAR(500) NULL,
  meta        JSON NULL,
  created_at  DATETIME NOT NULL,
  INDEX idx_auth_audit_actor (actor_type, actor_id),
  INDEX idx_auth_audit_identifier (identifier),
  INDEX idx_auth_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS price_lists (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  file_path   VARCHAR(255) NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  active      TINYINT(1) DEFAULT 0,
  uploaded_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dealer_download_tokens (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  token         VARCHAR(100) UNIQUE NOT NULL,
  dealer_id     INT NOT NULL,
  pricelist_id  INT NOT NULL,
  expires_at    DATETIME,
  created_at    DATETIME,
  FOREIGN KEY (dealer_id)    REFERENCES dealers(id)     ON DELETE CASCADE,
  FOREIGN KEY (pricelist_id) REFERENCES price_lists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed admin if absent (idempotent)
INSERT INTO users (role, name, mobile, is_verified)
SELECT 'admin', 'Site Admin', '9886371630', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role='admin' LIMIT 1);
