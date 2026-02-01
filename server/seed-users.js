const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
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

async function seedUsers() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to database...');

        // Create test users with different roles
        const users = [
            {
                email: 'admin@gamesup.com',
                password: 'admin123',
                name: 'Admin User',
                role: 'admin'
            },
            {
                email: 'manager@gamesup.com',
                password: 'manager123',
                name: 'Manager User',
                role: 'manager'
            },
            {
                email: 'staff@gamesup.com',
                password: 'staff123',
                name: 'Staff User',
                role: 'staff'
            }
        ];

        for (const user of users) {
            // Hash password
            const passwordHash = await bcrypt.hash(user.password, 10);

            // Insert or update user
            await connection.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name), role = VALUES(role)
      `, [user.email, passwordHash, user.name, user.role]);

            console.log(`✓ Created/Updated user: ${user.email} (password: ${user.password})`);
        }

        console.log('\nTest users created successfully!');
        console.log('\nYou can now login with:');
        console.log('- admin@gamesup.com / admin123');
        console.log('- manager@gamesup.com / manager123');
        console.log('- staff@gamesup.com / staff123');

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedUsers();
