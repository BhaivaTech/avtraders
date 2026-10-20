CREATE TABLE IF NOT EXISTS dealer_categories (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL UNIQUE,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dealer_products (
 id INT AUTO_INCREMENT PRIMARY KEY,
 category_id INT NOT NULL,
 name VARCHAR(180) NOT NULL,
 details TEXT NOT NULL,
 brand VARCHAR(120) NOT NULL DEFAULT '',
 product_code VARCHAR(80) NOT NULL DEFAULT '',
 pack_quantity DECIMAL(12,3) NOT NULL,
 unit ENUM('mg','gm','kg','ml','litre','pcs') NOT NULL,
 price DECIMAL(12,2) NOT NULL,
 gst_included TINYINT(1) NOT NULL DEFAULT 1,
 status ENUM('draft','published','hidden','archived') NOT NULL DEFAULT 'draft',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (category_id) REFERENCES dealer_categories(id),
 INDEX idx_catalogue_status_category (status, category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dealer_product_history (
 id INT AUTO_INCREMENT PRIMARY KEY,
 product_id INT NOT NULL,
 old_price DECIMAL(12,2) NULL,
 new_price DECIMAL(12,2) NOT NULL,
 action VARCHAR(40) NOT NULL,
 actor VARCHAR(190) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (product_id) REFERENCES dealer_products(id),
 INDEX idx_catalogue_history_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
