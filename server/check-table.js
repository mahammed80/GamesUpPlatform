const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsersTableStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gamesup_platform',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔍 Checking users table structure...\n');

    // Get table structure
    const [columns] = await connection.query('DESCRIBE users');
    
    console.log('📊 Users table columns:');
    columns.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key || 'No Key'} - ${col.Default || 'No Default'}`);
    });

    // Check what data exists
    const [users] = await connection.query('SELECT * FROM users');
    console.log(`\n📋 Current users (${users.length}):`);
    
    users.forEach(user => {
      console.log(`\n👤 User ID: ${user.id}`);
      Object.keys(user).forEach(key => {
        console.log(`   ${key}: ${user[key]}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsersTableStructure();
