const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('🔍 Starting Database Connection Diagnostics...');

// Load Environment Variables with priority
const envFiles = ['.env.local', '.env.production', '.env', '../.env'];
let loadedEnv = null;

for (const file of envFiles) {
  const envPath = path.resolve(__dirname, file);
  if (fs.existsSync(envPath)) {
    console.log(`✅ Loading environment from: ${file}`);
    dotenv.config({ path: envPath });
    loadedEnv = file;
    break;
  }
}

if (!loadedEnv) {
  console.error('❌ No .env file found in server directory or parent!');
}

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

console.log('📋 Configuration loaded:');
console.log(`   Host: ${config.host}`);
console.log(`   User: ${config.user}`);
console.log(`   Database: ${config.database}`);
console.log(`   Port: ${config.port}`);
console.log(`   Password: ${config.password ? '******' : '(not set)'}`);

async function testConnection(hostOverride = null) {
  const testConfig = { ...config };
  if (hostOverride) {
    testConfig.host = hostOverride;
    console.log(`\n🔄 Testing connection with forced host: ${hostOverride}...`);
  } else {
    console.log(`\n🔄 Testing connection with configured host: ${testConfig.host}...`);
  }

  try {
    const connection = await mysql.createConnection(testConfig);
    console.log('✅ Connection SUCCESSFUL!');
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`   Server Version: ${rows[0].version}`);
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Connection FAILED:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   👉 Check your username and password.');
      if (testConfig.host === 'localhost' || testConfig.host === '127.0.0.1') {
         console.error('   👉 Ensure the user is allowed to connect from localhost (127.0.0.1).');
      } else {
         console.error(`   👉 Ensure the user is allowed to connect from ${testConfig.host}.`);
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   👉 Database server is not reachable on this port.');
    }
    return false;
  }
}

(async () => {
  // Test 1: Configured Host
  let success = await testConnection();

  // Test 2: Force 127.0.0.1 if failed and was localhost
  if (!success && (config.host === 'localhost' || config.host === '::1')) {
    console.log('\n⚠️  "localhost" failed. Attempting to force IPv4 (127.0.0.1)...');
    success = await testConnection('127.0.0.1');
  }

  // Test 3: Force localhost if failed and was 127.0.0.1 (unlikely but possible)
  if (!success && config.host === '127.0.0.1') {
    console.log('\n⚠️  "127.0.0.1" failed. Attempting to force "localhost"...');
    success = await testConnection('localhost');
  }

  if (success) {
    console.log('\n✅ Diagnostics completed: Database is accessible.');
    process.exit(0);
  } else {
    console.error('\n❌ Diagnostics completed: Database is NOT accessible.');
    process.exit(1);
  }
})();
