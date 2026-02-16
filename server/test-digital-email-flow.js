const mysql = require('mysql2/promise');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'live',
  port: process.env.DB_PORT || 3306
};

async function runTest() {
  console.log('🚀 Starting Digital Email Flow Test...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // 1. Create/Update a Test Product with Digital Items
    console.log('📦 Setting up test product...');
    const digitalItems = [
      { email: 'test_acc1@game.com', password: 'pass123', code: 'TEST-CODE-1111' },
      { email: 'test_acc2@game.com', password: 'pass456', code: 'TEST-CODE-2222' }
    ];
    
    // Check if test product exists
    const [products] = await connection.query('SELECT id FROM products WHERE name = ?', ['Test Digital Game']);
    let productId;

    if (products.length > 0) {
      productId = products[0].id;
      // Update stock and digital items
      await connection.query(
        'UPDATE products SET stock = ?, digital_items = ? WHERE id = ?',
        [10, JSON.stringify(digitalItems), productId]
      );
      console.log(`✅ Updated existing test product (ID: ${productId})`);
    } else {
      // Create new product
      const [result] = await connection.query(
        'INSERT INTO products (name, category_slug, price, stock, description, image, digital_items) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Test Digital Game', 'games', 10.00, 10, 'Test product for digital delivery', 'https://via.placeholder.com/150', JSON.stringify(digitalItems)]
      );
      productId = result.insertId;
      console.log(`✅ Created new test product (ID: ${productId})`);
    }

    // 2. Create a Pending Order via API (to simulate real flow) OR insert directly
    // Using direct insert to control the state exactly as "pending" before we trigger completion
    console.log('📝 Creating pending order...');
    const orderNumber = `TEST-${Date.now()}`;
    const customerEmail = 'ibrahim.talat18@gmail.com';
    
    // We need to simulate the "purchase" which pops an item.
    // Actually, let's let the order creation logic handle assignment if possible, 
    // BUT the standard /customer-orders endpoint does assignment at creation time.
    // If we want to test "assignment and email sending", we should use the API to create the order too.
    
    const BASE_PATH = process.env.VITE_API_URL || '/api';
    const API_URL = `http://localhost:${process.env.PORT || 5000}${BASE_PATH}`;
    
    // Let's use the API to create the order to ensure full logic (assignment) runs.
    console.log(`🌐 Calling API to create order at ${API_URL}/customer-orders...`);
    try {
      const createResponse = await axios.post(`${API_URL}/customer-orders`, {
        customerEmail: customerEmail,
        customerName: 'Ibrahim Test',
        items: [{ id: productId, quantity: 1, price: 10.00 }], // The API expects items array
        total: 10.00,
        paymentMethod: 'test',
        deliveryMethod: 'email'
      });
      
      const orderNum = createResponse.data.orderNumber;
      console.log(`✅ Order created successfully! Order Number: ${orderNum}`);

      // Get the order ID from DB
      const [orders] = await connection.query('SELECT id, status, digital_code FROM orders WHERE order_number = ?', [orderNum]);
      const order = orders[0];
      
      if (!order) {
        throw new Error('Order not found in DB after creation');
      }
      
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Initial Status: ${order.status}`);
      console.log(`   Assigned Code: ${order.digital_code}`);

      // 3. Trigger Completion via API
      console.log('📧 Triggering "Completed" status to send email...');
      
      // Update status to completed
      await axios.put(`${API_URL}/orders/${order.id}`, {
        status: 'completed'
      });
      
      console.log('✅ Order marked as completed via API');
      console.log(`📨 Email should have been sent to ${customerEmail}`);
      console.log('✨ Test passed! Please check your inbox.');

    } catch (apiError) {
      console.error('❌ API Error:', apiError.response ? apiError.response.data : apiError.message);
      if (apiError.code === 'ECONNREFUSED') {
        console.error('   Make sure the server is running on port ' + (process.env.PORT || 5000));
      }
    }

  } catch (err) {
    console.error('❌ Database/Script Error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

runTest();
