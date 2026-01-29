
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

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL Database!');

    // Create roles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Roles table created/verified.');

    // Seed roles
    const roles = [
      {
        name: 'admin',
        description: 'Full access to all features and settings',
        permissions: JSON.stringify({
          dashboard: true, products: true, orders: true, pos: true,
          analytics: true, customers: true, banners: true, outlook: true,
          hr: true, tasks: true, team: true, roles: true, system: true,
          delivery: true, settings: true
        })
      },
      {
        name: 'manager',
        description: 'Manage products, orders, and view analytics',
        permissions: JSON.stringify({
          dashboard: true, products: true, orders: true, pos: true,
          analytics: true, customers: true, banners: true, outlook: false,
          hr: true, tasks: true, team: true, roles: false, system: false,
          delivery: true, settings: true
        })
      },
      {
        name: 'staff',
        description: 'Process orders and manage customers',
        permissions: JSON.stringify({
          dashboard: true, products: false, orders: true, pos: true,
          analytics: false, customers: true, banners: false, outlook: false,
          hr: false, tasks: true, team: false, roles: false, system: false,
          delivery: false, settings: false
        })
      }
    ];

    for (const role of roles) {
      await connection.query(`
        INSERT INTO roles (name, description, permissions)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description), permissions = VALUES(permissions)
      `, [role.name, role.description, role.permissions]);
    }
    console.log('Roles seeded.');

    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

migrate();
