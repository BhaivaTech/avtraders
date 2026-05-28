// backend/src/utils/ensureTables.js
import { pool } from "../config/db.js";

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('farmer','dealer','admin') NOT NULL DEFAULT 'farmer',
    name VARCHAR(120),
    address TEXT,
    mobile VARCHAR(15) UNIQUE,
    whatsapp VARCHAR(15),
    email VARCHAR(120),
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS farmer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    whatsapp VARCHAR(15) NOT NULL,
    village VARCHAR(120) NOT NULL,
    taluk VARCHAR(120) NOT NULL,
    district VARCHAR(120) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    land_size VARCHAR(60),
    crops_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(15),
    code VARCHAR(6),
    expires_at DATETIME,
    verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(mobile)
  )`,

  `CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    status ENUM('UNREAD','READ','SENT') DEFAULT 'UNREAD',
    last_spray_date DATE NULL,
    last_chemical VARCHAR(120) NULL,
    last_dosage VARCHAR(60) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT,
    sender_role ENUM('farmer','dealer','admin','system'),
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT,
    file_path VARCHAR(255),
    mime_type VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT,
    file_path VARCHAR(255),
    amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(8) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT,
    provider VARCHAR(32),
    status ENUM('pending','success','failed') DEFAULT 'pending',
    amount DECIMAL(12,2) DEFAULT 0,
    txn_id VARCHAR(120),
    meta JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    unit VARCHAR(32) DEFAULT 'pcs',
    price DECIMAL(12,2) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS dealer_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dealer_id INT,
    status ENUM('placed','paid','shipped','completed','cancelled') DEFAULT 'placed',
    total DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dealer_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS dealer_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    qty DECIMAL(12,2) DEFAULT 1,
    price DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES dealer_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  )`,

  /* =========================
     ✅ Dealer Portal Tables
  ========================= */

  `CREATE TABLE IF NOT EXISTS dealer_otp_sessions (
    phone VARCHAR(10) PRIMARY KEY,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
  )`,

  `CREATE TABLE IF NOT EXISTS dealers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    firm_name VARCHAR(180) NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(160) NULL,
    gst VARCHAR(20) NOT NULL,
    village_post VARCHAR(160) NOT NULL,
    taluk VARCHAR(120) NOT NULL,
    district VARCHAR(120) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    rejection_reason TEXT NULL,
    created_at DATETIME,
    updated_at DATETIME
  )`,

  `CREATE TABLE IF NOT EXISTS dealer_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dealer_id INT NOT NULL,
    type ENUM('gst','insecticide') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    uploaded_at DATETIME,
    FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS dealer_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dealer_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    actor_id VARCHAR(50) NULL,
    note TEXT NULL,
    created_at DATETIME,
    FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS price_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    active TINYINT(1) DEFAULT 0,
    uploaded_at DATETIME
  )`,

  `CREATE TABLE IF NOT EXISTS dealer_download_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(100) UNIQUE NOT NULL,
    dealer_id INT NOT NULL,
    pricelist_id INT NOT NULL,
    expires_at DATETIME,
    created_at DATETIME,
    FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE,
    FOREIGN KEY (pricelist_id) REFERENCES price_lists(id) ON DELETE CASCADE
  )`,
];

export async function ensureTables() {
  const conn = await pool.getConnection();
  try {
    for (const sql of statements) await conn.query(sql);

    // seed an admin if missing
    const [rows] = await conn.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (!rows.length) {
      await conn.query(
        "INSERT INTO users (role, name, mobile, is_verified) VALUES ('admin', ?, ?, 1)",
        [process.env.ADMIN_DEFAULT_NAME || "Site Admin", process.env.ADMIN_DEFAULT_MOBILE || "9886371630"]
      );
    }
  } finally {
    conn.release();
  }
}