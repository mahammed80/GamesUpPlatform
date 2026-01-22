const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const orders = [
  {
    order_number: '#PS-10234',
    customer_name: 'Alex Johnson',
    customer_email: 'alex.j@email.com',
    product_name: 'PS5 Console + 2 Games',
    date: '2026-01-04',
    status: 'completed',
    amount: 599.99,
    digital_email: 'alex.psn@email.com',
    digital_password: 'securepass123',
    digital_code: 'XXXX-YYYY-ZZZZ',
    inventory_id: 'INV-001'
  },
  {
    order_number: '#PS-10235',
    customer_name: 'Sarah Williams',
    customer_email: 'sarah.w@email.com',
    product_name: 'DualSense Midnight Black',
    date: '2026-01-04',
    status: 'pending',
    amount: 74.99,
    digital_email: 'sarah.gamer@email.com',
    digital_password: 'password456',
    digital_code: 'AAAA-BBBB-CCCC',
    inventory_id: 'INV-002'
  },
  {
    order_number: '#PS-10236',
    customer_name: 'Mike Chen',
    customer_email: 'mike.c@email.com',
    product_name: 'PS5 Digital Edition',
    date: '2026-01-03',
    status: 'processing',
    amount: 449.99,
    digital_email: 'mike.chen@email.com',
    digital_password: 'gamerpass789',
    digital_code: '1234-5678-9012',
    inventory_id: 'INV-003'
  },
  {
    order_number: '#PS-10237',
    customer_name: 'Emma Davis',
    customer_email: 'emma.d@email.com',
    product_name: 'PlayStation Plus 12-Month',
    date: '2026-01-03',
    status: 'completed',
    amount: 59.99,
    digital_email: 'emma.plus@email.com',
    digital_password: 'pluspassword',
    digital_code: 'PLUS-12MO-CODE',
    inventory_id: 'INV-004'
  }
];

async function seedOrders() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'games',
    port: process.env.DB_PORT || 3306,
  };

  console.log('Connecting to database...');
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected!');

    // Ensure orders table exists
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract orders table creation
    // Simple parsing to find the CREATE TABLE orders statement
    // Note: This is a bit fragile but works for this context if we just run the specific CREATE statement
    // simpler: just run the create statement directly here to be safe and self-contained
    
    await connection.query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Orders table ensured.');

    console.log('Seeding orders...');
    
    for (const order of orders) {
      // Check if order exists
      const [rows] = await connection.query('SELECT id FROM orders WHERE order_number = ?', [order.order_number]);
      
      if (rows.length === 0) {
        await connection.query(
          'INSERT INTO orders (order_number, customer_name, customer_email, product_name, date, status, amount, digital_email, digital_password, digital_code, inventory_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [order.order_number, order.customer_name, order.customer_email, order.product_name, order.date, order.status, order.amount, order.digital_email, order.digital_password, order.digital_code, order.inventory_id]
        );
        console.log(`Added order: ${order.order_number}`);
      } else {
        console.log(`Skipped order (already exists): ${order.order_number}`);
      }
    }

    console.log('Seeding complete!');
    await connection.end();
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seedOrders();
