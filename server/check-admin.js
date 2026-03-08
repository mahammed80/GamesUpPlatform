const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdminCredentials() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gamesup_platform',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔍 Checking admin credentials in database...\n');

    // Check users table
    const [users] = await connection.query('SELECT * FROM users');
    console.log(`📊 Found ${users.length} users in database:`);
    
    users.forEach(user => {
      console.log(`\n👤 User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Password Hash: ${user.password ? 'Present' : 'Missing'}`);
    });

    // Check if admin@gamesup.com exists
    const adminUser = users.find(u => u.email === 'admin@gamesup.com');
    
    if (adminUser) {
      console.log('\n✅ Found admin@gamesup.com in database');
      
      // Test password verification
      const bcrypt = require('bcrypt');
      const testPassword = 'AdminPassword2025!';
      
      try {
        const isValid = await bcrypt.compare(testPassword, adminUser.password);
        console.log(`🔐 Password test: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        
        if (!isValid) {
          console.log('\n🔧 Let me check what the correct password might be...');
          
          // Try common admin passwords
          const commonPasswords = [
            'admin',
            'Admin123!',
            'password',
            'AdminPassword2024!',
            'admin123',
            'Admin@2025'
          ];
          
          for (const pwd of commonPasswords) {
            const valid = await bcrypt.compare(pwd, adminUser.password);
            if (valid) {
              console.log(`✅ Found working password: ${pwd}`);
              break;
            }
          }
        }
      } catch (error) {
        console.log('❌ Error verifying password:', error.message);
      }
    } else {
      console.log('\n❌ admin@gamesup.com NOT found in database');
      
      // Check what emails exist
      console.log('\n📧 Available emails:');
      users.forEach(user => {
        console.log(`   - ${user.email}`);
      });
    }

    // Check if there are any admin role users
    const adminUsers = users.filter(u => u.role === 'admin');
    console.log(`\n👑 Found ${adminUsers.length} users with 'admin' role:`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdminCredentials();
