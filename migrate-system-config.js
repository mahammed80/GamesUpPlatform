const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database...');

    // Drop tables if they exist to ensure schema is correct
    await connection.query('DROP TABLE IF EXISTS product_attributes');
    await connection.query('DROP TABLE IF EXISTS sub_categories');
    await connection.query('DROP TABLE IF EXISTS categories');

    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        icon VARCHAR(50),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Categories table created/verified.');

    // Create sub_categories table
    await connection.query(`
      CREATE TABLE sub_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        slug VARCHAR(255) UNIQUE NOT NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    console.log('Sub-categories table created/verified.');

    // Create product_attributes table
    await connection.query(`
      CREATE TABLE product_attributes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        options JSON,
        is_required BOOLEAN DEFAULT FALSE,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Attributes table created/verified.');

    // Seed default categories if empty
    const [rows] = await connection.query('SELECT * FROM categories');
    if (rows.length === 0) {
      const defaultCategories = [
        { name: 'All', slug: 'all', icon: 'Grid', display_order: 1 },
        { name: 'Games', slug: 'games', icon: 'Gamepad', display_order: 2 },
        { name: 'Consoles', slug: 'consoles', icon: 'Monitor', display_order: 3 },
        { name: 'Accessories', slug: 'accessories', icon: 'Headphones', display_order: 4 }
      ];

      for (const cat of defaultCategories) {
        await connection.query(
          'INSERT INTO categories (name, slug, icon, display_order) VALUES (?, ?, ?, ?)',
          [cat.name, cat.slug, cat.icon, cat.display_order]
        );
      }
      console.log('Seeded default categories.');
    }

    console.log('System configuration migration completed successfully.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
