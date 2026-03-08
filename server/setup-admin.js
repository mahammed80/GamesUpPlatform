const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupAdminCredentials() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gamesup_platform',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔧 Setting up admin credentials...\n');

    // Hash the admin password
    const adminPassword = 'AdminPassword2025!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    console.log('🔐 Generated password hash for admin@gamesup.com');

    // Update admin user with password
    const [result] = await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@gamesup.com']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Successfully updated admin password');
      
      // Verify the update
      const [users] = await connection.query('SELECT email, password FROM users WHERE email = ?', ['admin@gamesup.com']);
      
      if (users.length > 0) {
        // Test the password
        const isValid = await bcrypt.compare(adminPassword, users[0].password);
        console.log(`🔐 Password verification: ${isValid ? '✅ Working' : '❌ Failed'}`);
      }
    } else {
      console.log('❌ Failed to update admin password');
    }

    // Also set up manager and staff passwords
    const managerPassword = 'Manager123!';
    const staffPassword = 'Staff123!';
    
    const managerHash = await bcrypt.hash(managerPassword, 10);
    const staffHash = await bcrypt.hash(staffPassword, 10);

    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [managerHash, 'manager@gamesup.com']
    );
    
    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [staffHash, 'staff@gamesup.com']
    );

    console.log('\n📋 All login credentials set up:');
    console.log('👑 Admin: admin@gamesup.com / AdminPassword2025!');
    console.log('👔 Manager: manager@gamesup.com / Manager123!');
    console.log('👤 Staff: staff@gamesup.com / Staff123!');

  } catch (error) {
    console.error('❌ Error setting up credentials:', error.message);
  } finally {
    await connection.end();
  }
}

setupAdminCredentials();
