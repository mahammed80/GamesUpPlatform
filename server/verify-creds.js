const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('🔍 Testing Database Connection...');
    
    const configs = [
        {
            name: 'Localhost (Socket)',
            config: {
                host: 'localhost',
                user: 'u268537024_games',
                password: 'Tal1985#',
                database: 'u268537024_games',
                socketPath: '/var/lib/mysql/mysql.sock' // Standard Hostinger socket
            }
        },
        {
            name: '127.0.0.1 (TCP)',
            config: {
                host: '127.0.0.1',
                user: 'u268537024_games',
                password: 'Tal1985#',
                database: 'u268537024_games',
                port: 3306
            }
        }
    ];

    for (const item of configs) {
        console.log(`\n👉 Testing: ${item.name}`);
        try {
            const conn = await mysql.createConnection(item.config);
            console.log('   ✅ SUCCESS! Connected.');
            await conn.end();
        } catch (err) {
            console.log(`   ❌ FAILED: ${err.message}`);
            if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('      (Authentication failed - wrong user/password)');
            }
        }
    }
}

testConnection();
