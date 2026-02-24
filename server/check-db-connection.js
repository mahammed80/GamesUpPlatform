const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('🔍 Starting Database Connection Diagnostics...');

// Load Environment Variables with priority
// We check .env in server dir first, then root
const envFiles = ['.env.production', '.env', '../.env'];
let loadedEnv = null;

// Try to find .env files
for (const file of envFiles) {
  const envPath = path.resolve(__dirname, file);
  if (fs.existsSync(envPath)) {
    console.log(`✅ Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    loadedEnv = file;
    break;
  }
}

if (!loadedEnv) {
  console.warn('⚠️  No specific .env file found. Using process.env');
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

async function testConnection(hostOverride = null, extraOptions = {}) {
  const testConfig = { ...config, ...extraOptions };
  if (hostOverride) {
    testConfig.host = hostOverride;
  }
  
  const desc = [];
  if (hostOverride) desc.push(`Host=${hostOverride}`);
  if (extraOptions.family === 4) desc.push('Family=4 (IPv4)');
  if (extraOptions.socketPath) desc.push(`Socket=${extraOptions.socketPath}`);
  
  console.log(`\n🔄 Testing connection: ${desc.join(', ') || 'Standard Config'}...`);

  let connection;
  try {
    connection = await mysql.createConnection(testConfig);
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
       console.error(`   👉 User: '${testConfig.user}'@'${testConfig.host}'`);
    }
    return false;
  }
}

(async () => {
  // Test 1: Standard
  console.log('\n--- Test 1: Standard Connection ---');
  let success = await testConnection();

  if (!success) {
      // Test 2: Force IPv4 (family: 4) - Keeps 'localhost' but avoids ::1
      console.log('\n--- Test 2: Force IPv4 (family: 4) ---');
      success = await testConnection(null, { family: 4 });
  }

  if (!success && (config.host === 'localhost' || config.host === '::1')) {
    // Test 3: Force 127.0.0.1 (TCP)
    console.log('\n--- Test 3: Force 127.0.0.1 (TCP) ---');
    success = await testConnection('127.0.0.1');
  }

  // Test 4: Common Socket Paths (Linux/Hostinger specific)
  if (!success && process.platform !== 'win32') {
       const sockets = ['/var/lib/mysql/mysql.sock', '/tmp/mysql.sock'];
       for (const sock of sockets) {
           if (fs.existsSync(sock)) {
               console.log(`\n--- Test Socket: ${sock} ---`);
               success = await testConnection('localhost', { socketPath: sock });
               if (success) break;
           }
       }
  }

  if (success) {
    console.log('\n✅ Diagnostics completed: A valid connection method was found.');
    process.exit(0);
  } else {
    console.error('\n❌ Diagnostics completed: All connection methods failed.');
    process.exit(1);
  }
})();
