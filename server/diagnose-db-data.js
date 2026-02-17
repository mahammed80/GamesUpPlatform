const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const serverEnvPath = path.resolve(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(serverEnvPath)) {
  console.log('Loading .env from server directory:', serverEnvPath);
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  console.log('Loading .env from root directory:', rootEnvPath);
  dotenv.config({ path: rootEnvPath });
}

async function checkDatabase() {
  console.log('----------------------------------------');
  console.log('🔍 Starting Database Diagnostic Check');
  console.log('----------------------------------------');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  };
  
  console.log(`Target: ${config.user}@${config.host}/${config.database}`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connection Successful!');

    // 1. Check Tables
    console.log('\n📋 Checking Tables...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Found Tables:', tableNames.join(', '));

    const requiredTables = ['products', 'categories', 'sub_categories', 'settings'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.error('❌ MISSING TABLES:', missingTables.join(', '));
    } else {
      console.log('✅ All core tables present.');
    }

    // 2. Check Settings
    if (tableNames.includes('settings')) {
        console.log('\n⚙️ Checking Settings Data...');
        const [settings] = await connection.query('SELECT * FROM settings');
        console.log(`Found ${settings.length} settings entries.`);
        if (settings.length === 0) {
            console.warn('⚠️ Settings table is empty! This might cause 500 errors if code expects defaults.');
        } else {
            console.log('Sample settings:', settings.slice(0, 3));
        }
    }

    // 3. Check Categories
    if (tableNames.includes('categories')) {
        console.log('\nVg Checking Categories Data...');
        const [cats] = await connection.query('SELECT * FROM categories');
        console.log(`Found ${cats.length} categories.`);
        if (cats.length > 0) {
            console.log('Sample category:', cats[0]);
        }
    }

    // 4. Check Products
    if (tableNames.includes('products')) {
        console.log('\n📦 Checking Products Data...');
        const [products] = await connection.query('SELECT * FROM products LIMIT 1');
        if (products.length > 0) {
            console.log('Sample product:', products[0]);
            
            // Check for JSON fields
            try {
                if (products[0].digital_items && typeof products[0].digital_items === 'string') {
                    JSON.parse(products[0].digital_items);
                    console.log('✅ digital_items is valid JSON');
                }
            } catch (e) {
                console.error('❌ digital_items has INVALID JSON:', e.message);
            }
        } else {
            console.log('No products found.');
        }
    }

    await connection.end();
    console.log('\n----------------------------------------');
    console.log('✅ Diagnostic Complete');
    console.log('----------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  }
}

checkDatabase();
