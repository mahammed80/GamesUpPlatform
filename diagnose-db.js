const net = require('net');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  database: process.env.DB_NAME
};

console.log('--- Database Configuration Check ---');
console.log(`Host: ${config.host}`);
console.log(`Port: ${config.port}`);
console.log(`User: ${config.user}`);
console.log(`Database: ${config.database}`);
console.log('-----------------------------------');

// Check if port looks like MySQL
if (config.port === 3306) {
  console.warn('WARNING: Port 3306 is typically used for MySQL/MariaDB.');
  console.warn('The current server implementation uses PostgreSQL (pg package).');
  console.warn('Connection will likely fail if you are trying to connect to MySQL with the PostgreSQL client.');
}

const client = new net.Socket();

console.log(`Attempting to connect to ${config.host}:${config.port}...`);

client.connect(config.port, config.host, () => {
  console.log('SUCCESS: TCP connection established!');
  console.log('The database server is running and reachable.');
  client.destroy();
});

client.on('error', (err) => {
  console.error('FAILURE: Could not connect to database server.');
  console.error(`Error: ${err.message}`);
  if (err.code === 'ECONNREFUSED') {
    console.error('Hint: Is the database server running? Check your service status.');
  }
  client.destroy();
});

client.on('close', () => {
  console.log('Connection closed.');
});
