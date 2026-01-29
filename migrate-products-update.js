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

    // Check if columns exist
    const [columns] = await connection.query(`SHOW COLUMNS FROM products`);
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('sub_category_slug')) {
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN sub_category_slug VARCHAR(255) DEFAULT NULL AFTER category_slug
      `);
      console.log('Added sub_category_slug column to products table.');
    } else {
      console.log('sub_category_slug column already exists.');
    }

    if (!columnNames.includes('attributes')) {
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN attributes JSON DEFAULT NULL AFTER description
      `);
      console.log('Added attributes column to products table.');
    } else {
      console.log('attributes column already exists.');
    }

    console.log('Products table migration completed successfully.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
