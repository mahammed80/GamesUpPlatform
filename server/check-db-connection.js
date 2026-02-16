const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables - mimicking server/index.js logic
const serverEnvPath = path.resolve(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '../.env');

console.log('--- Database Connection Check ---');
console.log('Current Working Directory:', process.cwd());
console.log('__dirname:', __dirname);

let envResult;
if (fs.existsSync(serverEnvPath)) {
  console.log('✅ Loading .env from server directory:', serverEnvPath);
  envResult = dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  console.log('⚠️  Server .env not found, falling back to root .env:', rootEnvPath);
  envResult = dotenv.config({ path: rootEnvPath });
} else {
  console.log('❌ No .env file found! Relying on process environment variables.');
}

if (envResult && envResult.error) {
  console.error('Dotenv error:', envResult.error);
}

// Connection Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '****' : '(not set)', // Hide password in logs
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

console.log('Connection Config:', config);

// Validate critical variables
if (!process.env.DB_USER || !process.env.DB_NAME) {
  console.error('❌ Missing DB_USER or DB_NAME environment variables.');
  console.log('Please check your Hostinger Environment Variables configuration.');
}

async function checkConnection() {
  try {
    console.log('Attempting to connect...');
    // Use createConnection for a single check instead of pool
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Successfully connected to MySQL Database!');
    
    const [rows] = await connection.query('SELECT NOW() as now, VERSION() as version');
    console.log('⏰ Database Time:', rows[0].now);
    console.log('MySQL Version:', rows[0].version);

    await connection.end();
    console.log('Connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    console.error('Error Code:', err.code);
    console.error('Error No:', err.errno);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('👉 Hint: Check your username and password.');
    } else if (err.code === 'ENOTFOUND') {
      console.log('👉 Hint: Check your DB_HOST (hostname).');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('👉 Hint: Check if MySQL server is running and port is correct.');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('👉 Hint: Check if the database name is correct and exists.');
    }

    process.exit(1);
  }
}

checkConnection();
