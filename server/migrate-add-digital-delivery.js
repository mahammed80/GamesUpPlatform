const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const localEnvPath = path.resolve(__dirname, '.env.local');
const productionEnvPath = path.resolve(__dirname, '.env.production');
const serverEnvPath = path.resolve(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(productionEnvPath)) {
  dotenv.config({ path: productionEnvPath });
} else if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  dotenv.config({ path: rootEnvPath });
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  family: 4
});

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database...');

    // Check if digital_delivery column exists in orders
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'digital_delivery'
    `, [process.env.DB_NAME]);

    if (columns.length === 0) {
      console.log('Adding digital_delivery column to orders table...');
      await connection.query('ALTER TABLE orders ADD COLUMN digital_delivery JSON AFTER digital_code');
      console.log('digital_delivery column added to orders successfully.');
    } else {
      console.log('digital_delivery column already exists in orders.');
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
