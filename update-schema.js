
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateSchema() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Adding payment columns to orders table...');
    
    // Check if columns exist (simple way: try to select them, or just use ADD COLUMN IF NOT EXISTS syntax if supported)
    // MySQL 8.0 supports IF NOT EXISTS, but older versions might not.
    // Safe way: catch error if column exists or just run it.
    
    try {
      await pool.query('ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT "credit_card"');
      console.log('Added payment_method column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('payment_method column already exists');
      } else {
        throw e;
      }
    }

    try {
      await pool.query('ALTER TABLE orders ADD COLUMN payment_proof TEXT DEFAULT NULL');
      console.log('Added payment_proof column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('payment_proof column already exists');
      } else {
        throw e;
      }
    }

    console.log('Schema update complete.');
  } catch (error) {
    console.error('Error updating schema:', error.message);
  } finally {
    pool.end();
  }
}

updateSchema();
