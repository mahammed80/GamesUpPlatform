
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_slug VARCHAR(100),
  sub_category_slug VARCHAR(255),
  price DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  stock INT DEFAULT 0,
  image VARCHAR(255),
  description TEXT,
  attributes JSON,
  digital_items JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  job_title VARCHAR(100),
  phone VARCHAR(50),
  avatar VARCHAR(255),
  identity_document VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  product_name VARCHAR(255),
  date DATE,
  status VARCHAR(50),
  amount DECIMAL(10, 2),
  digital_email VARCHAR(255),
  digital_password VARCHAR(255),
  digital_code VARCHAR(255),
  inventory_id VARCHAR(50),
  payment_method VARCHAR(50),
  payment_proof VARCHAR(255),
  shipping_address JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure orders table has new columns (Migration Fix)
-- We use simple ALTER statements because the runner ignores "Duplicate column" errors (1060)
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN payment_proof VARCHAR(255);
ALTER TABLE orders ADD COLUMN shipping_address JSON;
 
 CREATE TABLE IF NOT EXISTS employees (
   id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  department VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active',
  join_date DATE,
  salary DECIMAL(10, 2),
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT,
  date DATE,
  check_in TIME,
  check_out TIME,
  status VARCHAR(50),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  link VARCHAR(255),
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSON,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure products table has all required columns (for existing installs)
ALTER TABLE products ADD COLUMN sub_category_slug VARCHAR(255);
ALTER TABLE products ADD COLUMN cost DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN attributes JSON;
ALTER TABLE products MODIFY digital_items JSON;

-- Ensure icon is TEXT for existing tables (Migration Fix)
SET @dbname = DATABASE();
SET @tablename = "categories";
SET @columnname = "icon";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE categories ADD COLUMN icon TEXT"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ensure users table columns exist (Migration Fix)
SET @tablename_users = "users";
SET @columnname_phone = "phone";
SET @preparedStatementUsers = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename_users)
      AND (table_schema = @dbname)
      AND (column_name = @columnname_phone)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN phone VARCHAR(50)"
));
PREPARE alterUsers FROM @preparedStatementUsers;
EXECUTE alterUsers;
DEALLOCATE PREPARE alterUsers;

CREATE TABLE IF NOT EXISTS sub_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_attributes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  options JSON,
  is_required BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
