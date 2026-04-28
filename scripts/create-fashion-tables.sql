-- Fashion Design Tables

-- Fashion Categories Table
CREATE TABLE IF NOT EXISTS fashion_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Fashion Products Table
CREATE TABLE IF NOT EXISTS fashion_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  fabric_cost_included BOOLEAN DEFAULT TRUE,
  completion_time VARCHAR(100),
  express_charge DECIMAL(10, 2) DEFAULT 0.00,
  commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  category_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES fashion_categories(id) ON DELETE RESTRICT,
  INDEX idx_category (category_id),
  INDEX idx_status (status),
  INDEX idx_code (product_code)
);

-- Fashion Product Images Table
CREATE TABLE IF NOT EXISTS fashion_product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES fashion_products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
);

-- Fashion Referrals Table
CREATE TABLE IF NOT EXISTS fashion_referrals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referrer_name VARCHAR(255) NOT NULL,
  friend_whatsapp VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  referral_token VARCHAR(64) NOT NULL UNIQUE,
  status ENUM('pending','converted','commission_paid') DEFAULT 'pending',
  commission_amount_locked DECIMAL(10, 2) NOT NULL,
  converted_at TIMESTAMP NULL,
  commission_paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES fashion_products(id) ON DELETE CASCADE,
  INDEX idx_token (referral_token),
  INDEX idx_status (status),
  INDEX idx_product (product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fashion_products_category ON fashion_products(category_id);
CREATE INDEX IF NOT EXISTS idx_fashion_products_status ON fashion_products(status);
CREATE INDEX IF NOT EXISTS idx_fashion_referrals_product ON fashion_referrals(product_id);
CREATE INDEX IF NOT EXISTS idx_fashion_referrals_status ON fashion_referrals(status);

-- Insert default categories
INSERT INTO fashion_categories (name, description) VALUES
  ('Traditional Wear', 'Traditional and cultural fashion designs'),
  ('Casual Wear', 'Casual and everyday fashion designs'),
  ('Evening Wear', 'Formal and evening fashion designs'),
  ('Accessories', 'Fashion accessories and add-ons'),
  ('Custom Design', 'Custom designed fashion pieces')
ON DUPLICATE KEY UPDATE name=name;
