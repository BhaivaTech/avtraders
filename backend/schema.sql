-- backend/schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('farmer','dealer','admin') NOT NULL DEFAULT 'farmer',
  name VARCHAR(120),
  address TEXT,
  mobile VARCHAR(15) UNIQUE,
  whatsapp VARCHAR(15),
  email VARCHAR(120),
  is_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile VARCHAR(15),
  code VARCHAR(6),
  expires_at DATETIME,
  verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(mobile)
);

CREATE TABLE IF NOT EXISTS chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  status ENUM('UNREAD','READ','SENT') DEFAULT 'UNREAD',
  last_spray_date DATE NULL,
  last_chemical VARCHAR(120) NULL,
  last_dosage VARCHAR(60) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT,
  sender_role ENUM('farmer','dealer','admin','system'),
  text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT,
  file_path VARCHAR(255),
  mime_type VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT,
  file_path VARCHAR(255),
  amount DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT,
  provider VARCHAR(32),
  status ENUM('pending','success','failed') DEFAULT 'pending',
  amount DECIMAL(12,2) DEFAULT 0,
  txn_id VARCHAR(120),
  meta JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  unit VARCHAR(32) DEFAULT 'pcs',
  price DECIMAL(12,2) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dealer_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dealer_id INT,
  status ENUM('placed','paid','shipped','completed','cancelled') DEFAULT 'placed',
  total DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dealer_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  qty DECIMAL(12,2) DEFAULT 1,
  price DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES dealer_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- seed admin if absent
INSERT INTO users (role, name, mobile, is_verified)
SELECT 'admin', 'Site Admin', '9886371630', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role='admin' LIMIT 1);
