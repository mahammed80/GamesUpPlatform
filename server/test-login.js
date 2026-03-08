const mysql = require('mysql2/promise');
require('dotenv').config();

async function testLogin() {
  try {
    console.log('🔍 Testing login endpoint and database users...');
    
    // Test database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gamesup_platform'
    });

    console.log('✅ Database connected');

    // Check if users table exists and has data
    const [users] = await connection.query('SELECT id, email, role, permissions FROM users LIMIT 5');
    console.log(`📊 Found ${users.length} users in database:`);
    
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Permissions: ${user.permissions}`);
    });

    // Test login endpoint
    console.log('\n🧪 Testing login endpoint...');
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gamesup.co',
        password: 'admin'
      })
    });

    const result = await response.json();
    console.log(`📡 Login Response (${response.status}):`, result);

    await connection.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin();
