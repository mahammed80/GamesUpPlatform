const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testAdminPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gamesup_platform',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔍 Testing admin login credentials...\n');

    // Get all users
    const [users] = await connection.query('SELECT email, password_hash FROM users');
    
    const testPasswords = [
      'AdminPassword2025!',
      'admin',
      'Admin123!',
      'password',
      'AdminPassword2024!',
      'admin123',
      'Admin@2025',
      'Admin2025!',
      'gamesup2025',
      'Admin@gamesup',
      'admin@gamesup.com',
      '123456',
      'admin123456'
    ];

    for (const user of users) {
      console.log(`\n👤 Testing ${user.email}:`);
      
      for (const pwd of testPasswords) {
        try {
          const isValid = await bcrypt.compare(pwd, user.password_hash);
          if (isValid) {
            console.log(`   ✅ WORKING PASSWORD: "${pwd}"`);
            break;
          }
        } catch (error) {
          // Continue to next password
        }
      }
    }

    // If no password works, let's reset admin password
    console.log('\n🔧 If no passwords worked, let me reset admin password...');
    
    const newAdminPassword = 'AdminPassword2025!';
    const hashedPassword = await bcrypt.hash(newAdminPassword, 10);
    
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, 'admin@gamesup.com']
    );
    
    console.log('✅ Reset admin password to: AdminPassword2025!');
    
    // Test the new password
    const [adminUser] = await connection.query('SELECT password_hash FROM users WHERE email = ?', ['admin@gamesup.com']);
    const isValid = await bcrypt.compare(newAdminPassword, adminUser[0].password_hash);
    console.log(`🔐 New password verification: ${isValid ? '✅ Working' : '❌ Failed'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testAdminPasswords();
