const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('🔄 Starting Admin Password Reset Script...');

// Load Environment Variables
const envFiles = ['.env.production', '.env', '../.env'];
let loadedEnv = null;

for (const file of envFiles) {
  const envPath = path.resolve(__dirname, file);
  if (fs.existsSync(envPath)) {
    console.log(`✅ Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    loadedEnv = file;
    break;
  }
}

// Database Configuration
let dbHost = process.env.DB_HOST || 'localhost';
if (dbHost === '127.0.0.1') {
  dbHost = 'localhost'; // Force localhost for Hostinger
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

// Admin User Details
const ADMIN_EMAIL = 'admin@gamesup.com';
const NEW_PASSWORD = 'AdminPassword2025!'; // You can change this or generate randomly

async function resetAdminPassword() {
  let connection;
  try {
    console.log(`\n🔌 Connecting to database at ${config.host}...`);
    connection = await mysql.createConnection(config);
    console.log('✅ Connected successfully!');

    // 1. Hash the new password
    console.log(`\n🔒 Hashing password for ${ADMIN_EMAIL}...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, salt);

    // 2. Check if admin user exists
    const [rows] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    );

    if (rows.length > 0) {
      // Update existing user
      console.log(`👤 User found (ID: ${rows[0].id}). Updating password...`);
      await connection.execute(
        'UPDATE users SET password_hash = ?, role = "admin" WHERE email = ?',
        [passwordHash, ADMIN_EMAIL]
      );
      console.log('✅ Password updated successfully!');
    } else {
      // Create new admin user
      console.log('⚠️ User not found. Creating new admin user...');
      const userId = require('crypto').randomUUID();
      await connection.execute(
        `INSERT INTO users (id, email, password_hash, name, role, created_at) 
         VALUES (?, ?, ?, 'Admin User', 'admin', NOW())`,
        [userId, ADMIN_EMAIL, passwordHash]
      );
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n----------------------------------------');
    console.log('🔑 CREDENTIALS UPDATED');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${NEW_PASSWORD}`);
    console.log('----------------------------------------');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

resetAdminPassword();
