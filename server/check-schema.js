
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const [rows] = await pool.query('DESCRIBE orders');
    console.log('Orders Table Schema:', rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

checkSchema();
