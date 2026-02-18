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

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT
      )
    `);
    console.log('Settings table created/verified.');

    // Seed default settings if not exist
    const defaultSettings = {
      'currency_code': 'USD',
      'currency_symbol': '$',
      'tax_rate': '8.5',
      'website_title': '',
      'website_description': '',
      'website_favicon': ''
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      const [rows] = await connection.query('SELECT * FROM settings WHERE setting_key = ?', [key]);
      if (rows.length === 0) {
        await connection.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
        console.log(`Seeded ${key}: ${value}`);
      }
    }

    console.log('Migration completed successfully.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
