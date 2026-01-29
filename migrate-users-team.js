
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
});

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database...');

    // Check users table
    const [usersColumns] = await connection.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'users'`,
      [process.env.DB_NAME]
    );
    const userCols = usersColumns.map(c => c.COLUMN_NAME || c.column_name);
    console.log('Users columns:', userCols);

    // Add phone if missing
    if (!userCols.includes('phone')) {
      console.log('Adding phone to users...');
      await connection.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20)');
    }

    // Add job_title if missing (distinct from role which is for auth)
    if (!userCols.includes('job_title')) {
      console.log('Adding job_title to users...');
      await connection.query('ALTER TABLE users ADD COLUMN job_title VARCHAR(100)');
    }
    
    // Add avatar if missing
    if (!userCols.includes('avatar')) {
      console.log('Adding avatar to users...');
      await connection.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255)');
    }

    // Add identity_document if missing
    if (!userCols.includes('identity_document')) {
      console.log('Adding identity_document to users...');
      await connection.query('ALTER TABLE users ADD COLUMN identity_document VARCHAR(255)');
    }

    // Check employees table to see if we should just drop it or migrate data
    // For now, we'll focus on users table as the source of truth for Team Members who can login
    
    console.log('Migration completed.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrate();
