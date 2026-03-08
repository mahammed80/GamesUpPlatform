const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'games',
    port: process.env.DB_PORT || 3306,
  };

  console.log('🔍 Testing database connection and data...');

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to database!');

    // Check products table
    const [products] = await connection.query('SELECT id, name, digital_items FROM products ORDER BY id DESC LIMIT 10');
    console.log(`\n📦 Found ${products.length} products:`);
    
    for (const product of products) {
      console.log(`\n🎮 Product: ${product.name} (ID: ${product.id})`);
      
      try {
        const digitalItems = typeof product.digital_items === 'string' 
          ? JSON.parse(product.digital_items) 
          : (product.digital_items || []);
        
        if (Array.isArray(digitalItems) && digitalItems.length > 0) {
          console.log(`   📧 Digital Items: ${digitalItems.length}`);
          digitalItems.forEach((item, index) => {
            console.log(`      ${index + 1}. Email: ${item.email || 'N/A'}`);
            console.log(`         Password: ${item.password ? '***' : 'N/A'}`);
            console.log(`         Code: ${item.code || 'N/A'}`);
            console.log(`         Region: ${item.region || 'N/A'}`);
            console.log(`         Online ID: ${item.onlineId || 'N/A'}`);
            console.log(`         Slots: ${Object.keys(item.slots || {}).length}`);
          });
        } else {
          console.log('   ❌ No digital items found');
        }
      } catch (e) {
        console.log('   ❌ Error parsing digital items:', e.message);
      }
    }

    await connection.end();
    console.log('\n🎉 Database test completed!');
  } catch (err) {
    console.error('❌ Database test failed:', err);
  }
}

testDatabase();
