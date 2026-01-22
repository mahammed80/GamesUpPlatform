const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection(user, password, database) {
  console.log(`\nTesting connection for User: '${user}', Password: '${password ? '***' : '(empty)'}', Database: '${database}'...`);
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: user,
      password: password,
      database: database
    });
    console.log('✅ SUCCESS! Connected successfully.');
    await connection.end();
    return true;
  } catch (err) {
    console.log(`❌ FAILED. Error: ${err.message}`);
    return false;
  }
}

(async () => {
  const envUser = process.env.DB_USER;
  const envDb = process.env.DB_NAME;
  
  // 1. Try credentials from .env
  console.log('--- Attempt 1: Using credentials from .env ---');
  await testConnection(envUser, process.env.DB_PASSWORD || '', envDb);

  // 2. Try 'root' user with empty password (common default)
  if (envUser !== 'root') {
    console.log('--- Attempt 2: Trying "root" user with empty password ---');
    await testConnection('root', '', envDb);
  }
  
  // 3. Try 'root' user with 'root' password
  console.log('--- Attempt 3: Trying "root" user with "root" password ---');
  await testConnection('root', 'root', envDb);

})();
