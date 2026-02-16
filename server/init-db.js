const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const serverEnvPath = path.resolve(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(serverEnvPath)) {
  console.log('Loading .env from server directory:', serverEnvPath);
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  console.log('Loading .env from root directory:', rootEnvPath);
  dotenv.config({ path: rootEnvPath });
} else {
  console.log('No .env file found, relying on environment variables.');
}

async function initDb() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  };

  const dbName = process.env.DB_NAME || 'gamesup_platform';

  console.log(`Connecting to database host: ${config.host}...`);
  
  try {
    // First connect without selecting a database to check/create it
    const connection = await mysql.createConnection(config);
    console.log('Connected to MySQL server!');

    // Check if database exists
    const [rows] = await connection.query(`SHOW DATABASES LIKE '${dbName}'`);
    if (rows.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      await connection.query(`CREATE DATABASE \`${dbName}\``);
      console.log(`Database '${dbName}' created.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }

    // Now use the database
    await connection.query(`USE \`${dbName}\``);
    console.log(`Using database '${dbName}'.`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      console.log('Executing schema...');
      await connection.query(schema);
      console.log('Schema executed successfully!');
    } else {
      console.error('Schema file not found at:', schemaPath);
    }
    
    await connection.end();
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Check your database username and password.');
    }
  }
}

initDb();
