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

    // Check for payment_method column
    const [pmColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_method'
    `, [process.env.DB_NAME]);

    if (pmColumns.length === 0) {
      console.log('Adding payment_method column...');
      await connection.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'card' AFTER cost");
    } else {
      console.log('payment_method column exists.');
    }

    // Check for payment_proof column
    const [ppColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_proof'
    `, [process.env.DB_NAME]);

    if (ppColumns.length === 0) {
      console.log('Adding payment_proof column...');
      await connection.query("ALTER TABLE orders ADD COLUMN payment_proof TEXT AFTER payment_method");
    } else {
      console.log('payment_proof column exists.');
    }

    console.log('Migration completed.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
