const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envFiles = ['.env.production', '.env', '../.env'];
for (const file of envFiles) {
  const envPath = path.resolve(__dirname, file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Database Configuration
let dbHost = process.env.DB_HOST || 'localhost';
if (dbHost === '127.0.0.1') {
  dbHost = 'localhost';
}

const config = {
  host: dbHost,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0
};

async function checkSchema() {
  let connection;
  try {
    console.log('\n🔍 Checking Database Schema...\n');
    
    // Connect to database
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');

    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    
    if (Array.isArray(tables)) {
      tables.forEach(table => {
        const tableName = table[`Tables_in_${config.database}`];
        console.log(`   - ${tableName}`);
      });
    } else {
      console.log('   No tables found or unexpected format');
    }

    // Check categories table structure
    console.log('\n🏷️  Categories table structure:');
    const [categoriesDesc] = await connection.execute('DESCRIBE categories');
    categoriesDesc.forEach(row => {
      console.log(`   ${row.Field.padEnd(20)} | ${row.Type.padEnd(20)} | ${row.Null.padEnd(5)} | ${row.Key.padEnd(10)} | ${row.Default || 'NULL'}`);
    });

    // Check products table structure
    console.log('\n📦 Products table structure:');
    const [productsDesc] = await connection.execute('DESCRIBE products');
    productsDesc.forEach(row => {
      console.log(`   ${row.Field.padEnd(20)} | ${row.Type.padEnd(20)} | ${row.Null.padEnd(5)} | ${row.Key.padEnd(10)} | ${row.Default || 'NULL'}`);
    });

    // Check sample data
    console.log('\n📊 Sample data check:');
    try {
      const [categoriesCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
      console.log(`   Categories: ${categoriesCount[0].count} rows`);

      const [productsCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
      console.log(`   Products: ${productsCount[0].count} rows`);

      if (categoriesCount[0].count > 0) {
        const [sampleCategories] = await connection.execute('SELECT name, slug, icon FROM categories LIMIT 3');
        console.log('\n   Sample categories:');
        sampleCategories.forEach(cat => {
          console.log(`     - ${cat.name} (${cat.slug}) ${cat.icon}`);
        });
      }

      if (productsCount[0].count > 0) {
        const [sampleProducts] = await connection.execute('SELECT name, price, category_id FROM products LIMIT 3');
        console.log('\n   Sample products:');
        sampleProducts.forEach(prod => {
          console.log(`     - ${prod.name} | $${prod.price} | Cat: ${prod.category_id}`);
        });
      }
    } catch (error) {
      console.log('   ❌ Error checking sample data:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkSchema();
