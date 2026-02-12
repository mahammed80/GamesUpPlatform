const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function initDb() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME || 'u123456789_gamesup', // Don't connect to DB initially
    port: process.env.DB_PORT || 3306,
    multipleStatements: true // Enable multiple statements
  };

  console.log('Connecting to database...');
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected!');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'u123456789_gamesup';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);


    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await connection.query(schema);
    
    console.log('Schema executed successfully!');
    await connection.end();
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
}

initDb();
