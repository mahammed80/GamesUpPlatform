
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('Testing Database Connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    
    // Check password special chars
    const password = process.env.DB_PASSWORD || '';
    if (password.includes('#')) {
        console.log('⚠️  WARNING: Password contains "#". Ensure it is wrapped in quotes in .env: DB_PASSWORD="Your#Password"');
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Connection Successful!');
        const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
        console.log('Test Query Result:', rows[0].solution);
        
        await connection.end();
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('👉 Tip: Check your username and password. If password has special characters, wrap it in quotes.');
        }
    }
}

testConnection();
