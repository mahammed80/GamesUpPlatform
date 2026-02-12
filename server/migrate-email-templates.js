const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'live',
    port: process.env.DB_PORT || 3306
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database...');

        // Create email_templates table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS email_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL UNIQUE,
                subject VARCHAR(255) NOT NULL,
                body TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Created email_templates table');

        // Seed default templates
        const templates = [
            {
                type: 'registration',
                subject: 'Welcome to GamesUp!',
                body: '<h1>Welcome, {{name}}!</h1><p>Thank you for registering with GamesUp. We are excited to have you on board.</p>'
            },
            {
                type: 'order',
                subject: 'Order Confirmation #{{orderId}}',
                body: '<h1>Order Confirmation</h1><p>Dear {{name}},</p><p>Your order #{{orderId}} has been received.</p>'
            },
            {
                type: 'reset_password',
                subject: 'Password Reset Request',
                body: '<h1>Password Reset</h1><p>Click the link below to reset your password:</p><a href="{{link}}">Reset Password</a>'
            }
        ];

        for (const tmpl of templates) {
            await connection.execute(`
                INSERT INTO email_templates (type, subject, body)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body)
            `, [tmpl.type, tmpl.subject, tmpl.body]);
            console.log(`✓ Seeded template: ${tmpl.type}`);
        }

        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
