const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'live',
  port: process.env.DB_PORT || 3306
};

async function checkDigitalItems() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected');

    const [rows] = await connection.query('SELECT id, name, digital_items FROM products LIMIT 5');
    
    rows.forEach(row => {
      console.log(`\nProduct: ${row.name} (ID: ${row.id})`);
      if (row.digital_items) {
        // It's likely a JSON string or object (if mysql2 parses it)
        const items = typeof row.digital_items === 'string' ? JSON.parse(row.digital_items) : row.digital_items;
        console.log(`Digital Items Count: ${Array.isArray(items) ? items.length : 'Not an array'}`);
        if (Array.isArray(items) && items.length > 0) {
            console.log('Sample Item:', items[0]);
        }
      } else {
        console.log('No digital items');
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.end();
  }
}

checkDigitalItems();
