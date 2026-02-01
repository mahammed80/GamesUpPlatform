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

    // Check if cost column exists in orders
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cost'
    `, [process.env.DB_NAME]);

    if (columns.length === 0) {
      console.log('Adding cost column to orders table...');
      await connection.query('ALTER TABLE orders ADD COLUMN cost DECIMAL(10, 2) DEFAULT 0.00 AFTER amount');
      console.log('Cost column added to orders successfully.');
    } else {
      console.log('Cost column already exists in orders.');
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
