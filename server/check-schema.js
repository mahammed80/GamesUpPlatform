
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkSchema() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL Database!');
    
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));
    
    // Check columns for users
    const [userColumns] = await connection.query('SHOW COLUMNS FROM users');
    console.log('\nUsers table columns:', userColumns.map(c => c.Field));
    
    // Check if roles table exists
    const rolesTable = tables.find(t => Object.values(t)[0] === 'roles');
    if (rolesTable) {
      const [roleColumns] = await connection.query('SHOW COLUMNS FROM roles');
      console.log('\nRoles table columns:', roleColumns.map(c => c.Field));
    } else {
        console.log('\nRoles table does not exist.');
    }
    
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();
