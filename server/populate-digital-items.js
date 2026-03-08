const mysql = require('mysql2/promise');
require('dotenv').config();

async function populateProductsWithDigitalItems() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gamesup_platform',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔧 Populating products with digital items...\n');

    // Get existing products
    const [products] = await connection.query('SELECT id, name, digital_items FROM products ORDER BY id');
    console.log(`📦 Found ${products.length} products in database`);

    // Digital items data matching your seeder
    const digitalItemsData = {
      "Marvel's Spider-Man 2": [
        {
          email: 'spiderman@psn-account.com',
          password: 'Spidey2024!Secure',
          code: 'SPIDER-PS4-001-MJ2K\nSPIDER-PS5-002-MJ2K\nSPIDER-SEC-003-MJ2K\nSPIDER-OFF-PS4-004\nSPIDER-OFF-PS5-005\nSPIDER-BACKUP-006\nSPIDER-BACKUP-007',
          outlookEmail: 'spiderman.recovery@outlook.com',
          outlookPassword: 'Outlook@Spidey2024',
          birthdate: '1995-08-10',
          region: 'US',
          onlineId: 'SpiderManPlayer',
          backupCodes: 'SPIDER-BACKUP-006\nSPIDER-BACKUP-007',
          slots: {
            'Primary ps4': { sold: false, orderId: null, code: 'SPIDER-PS4-001-MJ2K' },
            'Primary ps5': { sold: false, orderId: null, code: 'SPIDER-PS5-002-MJ2K' },
            'Secondary': { sold: false, orderId: null, code: 'SPIDER-SEC-003-MJ2K' },
            'Offline ps4': { sold: false, orderId: null, code: 'SPIDER-OFF-PS4-004' },
            'Offline ps5': { sold: false, orderId: null, code: 'SPIDER-OFF-PS5-005' }
          },
          totalCodes: 7
        },
        {
          email: 'milesmorales@psn-account.com',
          password: 'Miles2024!Secure',
          code: 'MILES-PS4-006-MJ2K\nMILES-PS5-007-MJ2K\nMILES-SEC-008-MJ2K\nMILES-OFF-PS4-009\nMILES-OFF-PS5-010\nMILES-BACKUP-011\nMILES-BACKUP-012',
          outlookEmail: 'milesm.recovery@outlook.com',
          outlookPassword: 'Outlook@Miles2024',
          birthdate: '1998-12-10',
          region: 'US',
          onlineId: 'MilesMorales',
          backupCodes: 'MILES-BACKUP-011\nMILES-BACKUP-012',
          slots: {
            'Primary ps4': { sold: false, orderId: null, code: 'MILES-PS4-006-MJ2K' },
            'Primary ps5': { sold: false, orderId: null, code: 'MILES-PS5-007-MJ2K' },
            'Secondary': { sold: false, orderId: null, code: 'MILES-SEC-008-MJ2K' },
            'Offline ps4': { sold: false, orderId: null, code: 'MILES-OFF-PS4-009' },
            'Offline ps5': { sold: false, orderId: null, code: 'MILES-OFF-PS5-010' }
          },
          totalCodes: 7
        }
      ],
      "God of War Ragnarök": [
        {
          email: 'kratos@psn-account.com',
          password: 'Kratos2024!Secure',
          code: 'GOW-PS4-001-RAGNAR\nGOW-PS5-002-RAGNAR\nGOW-SEC-003-RAGNAR\nGOW-OFF-PS4-004\nGOW-OFF-PS5-005',
          outlookEmail: 'kratos.recovery@outlook.com',
          outlookPassword: 'Outlook@Kratos2024',
          birthdate: '1985-03-15',
          region: 'EU',
          onlineId: 'KratosPlayer',
          backupCodes: 'GOW-BACKUP-006\nGOW-BACKUP-007',
          slots: {
            'Primary ps4': { sold: false, orderId: null, code: 'GOW-PS4-001-RAGNAR' },
            'Primary ps5': { sold: false, orderId: null, code: 'GOW-PS5-002-RAGNAR' },
            'Secondary': { sold: false, orderId: null, code: 'GOW-SEC-003-RAGNAR' },
            'Offline ps4': { sold: false, orderId: null, code: 'GOW-OFF-PS4-004' },
            'Offline ps5': { sold: false, orderId: null, code: 'GOW-OFF-PS5-005' }
          },
          totalCodes: 7
        }
      ],
      "Horizon Forbidden West": [
        {
          email: 'aloy@psn-account.com',
          password: 'Aloy2024!Secure',
          code: 'HORIZON-PS4-001-FW\nHORIZON-PS5-002-FW\nHORIZON-SEC-003-FW\nHORIZON-OFF-PS4-004\nHORIZON-OFF-PS5-005',
          outlookEmail: 'aloy.recovery@outlook.com',
          outlookPassword: 'Outlook@Aloy2024',
          birthdate: '1998-03-06',
          region: 'UK',
          onlineId: 'AloyHunter',
          backupCodes: 'HORIZON-BACKUP-006\nHORIZON-BACKUP-007',
          slots: {
            'Primary ps4': { sold: false, orderId: null, code: 'HORIZON-PS4-001-FW' },
            'Primary ps5': { sold: false, orderId: null, code: 'HORIZON-PS5-002-FW' },
            'Secondary': { sold: false, orderId: null, code: 'HORIZON-SEC-003-FW' },
            'Offline ps4': { sold: false, orderId: null, code: 'HORIZON-OFF-PS4-004' },
            'Offline ps5': { sold: false, orderId: null, code: 'HORIZON-OFF-PS5-005' }
          },
          totalCodes: 7
        }
      ],
      "The Last of Us Part I": [
        {
          email: 'joel@psn-account.com',
          password: 'Joel2024!Secure',
          code: 'TLOU-PS4-001-REMASTER\nTLOU-PS5-002-REMASTER\nTLOU-SEC-003-REMASTER\nTLOU-OFF-PS4-004\nTLOU-OFF-PS5-005',
          outlookEmail: 'joel.recovery@outlook.com',
          outlookPassword: 'Outlook@Joel2024',
          birthdate: '1980-09-26',
          region: 'US',
          onlineId: 'JoelSurvivor',
          backupCodes: 'TLOU-BACKUP-006\nTLOU-BACKUP-007',
          slots: {
            'Primary ps4': { sold: false, orderId: null, code: 'TLOU-PS4-001-REMASTER' },
            'Primary ps5': { sold: false, orderId: null, code: 'TLOU-PS5-002-REMASTER' },
            'Secondary': { sold: false, orderId: null, code: 'TLOU-SEC-003-REMASTER' },
            'Offline ps4': { sold: false, orderId: null, code: 'TLOU-OFF-PS4-004' },
            'Offline ps5': { sold: false, orderId: null, code: 'TLOU-OFF-PS5-005' }
          },
          totalCodes: 7
        },
        {
          email: 'ellie@psn-account.com',
          password: 'Ellie2024!Secure',
          code: 'ELLIE-PS4-008-REMASTER\nELLIE-PS5-009-REMASTER\nELLIE-SEC-010-REMASTER\nELLIE-OFF-PS4-011\nELLIE-OFF-PS5-012',
          outlookEmail: 'ellie.recovery@outlook.com',
          outlookPassword: 'Outlook@Ellie2024',
          birthdate: '2003-03-14',
          region: 'US',
          onlineId: 'EllieSurvivor',
          backupCodes: 'ELLIE-BACKUP-013\nELLIE-BACKUP-014',
          slots: {
            'Primary ps4': { sold: false, orderId: null, code: 'ELLIE-PS4-008-REMASTER' },
            'Primary ps5': { sold: false, orderId: null, code: 'ELLIE-PS5-009-REMASTER' },
            'Secondary': { sold: false, orderId: null, code: 'ELLIE-SEC-010-REMASTER' },
            'Offline ps4': { sold: false, orderId: null, code: 'ELLIE-OFF-PS4-011' },
            'Offline ps5': { sold: false, orderId: null, code: 'ELLIE-OFF-PS5-012' }
          },
          totalCodes: 7
        }
      ],
      "Gran Turismo 7": [
        {
          email: 'gtplayer@psn-account.com',
          password: 'GT72024!Secure',
          code: 'GT7-PS4-001-ULTIMATE\nGT7-PS5-002-ULTIMATE\nGT7-SEC-003-ULTIMATE\nGT7-OFF-PS4-004\nGT7-OFF-PS5-005',
          outlookEmail: 'gtplayer.recovery@outlook.com',
          outlookPassword: 'Outlook@GT72024',
          birthdate: '1992-05-10',
          region: 'JP',
          onlineId: 'GT7Racer',
          backupCodes: 'GT7-BACKUP-006\nGT7-BACKUP-007',
          slots: {
            'Primary ps4': { sold: false, orderId: null, code: 'GT7-PS4-001-ULTIMATE' },
            'Primary ps5': { sold: false, orderId: null, code: 'GT7-PS5-002-ULTIMATE' },
            'Secondary': { sold: false, orderId: null, code: 'GT7-SEC-003-ULTIMATE' },
            'Offline ps4': { sold: false, orderId: null, code: 'GT7-OFF-PS4-004' },
            'Offline ps5': { sold: false, orderId: null, code: 'GT7-OFF-PS5-005' }
          },
          totalCodes: 7
        }
      ],
      "Demon's Souls": [
        {
          email: 'demon@psn-account.com',
          password: 'Demon2024!Secure',
          code: 'DEMON-PS4-001-REMAKE\nDEMON-PS5-002-REMAKE\nDEMON-SEC-003-REMAKE\nDEMON-OFF-PS4-004\nDEMON-OFF-PS5-005',
          outlookEmail: 'demon.recovery@outlook.com',
          outlookPassword: 'Outlook@Demon2024',
          birthdate: '2009-10-06',
          region: 'EU',
          onlineId: 'DemonSlayer',
          backupCodes: 'DEMON-BACKUP-006\nDEMON-BACKUP-007',
          slots: {
            'Primary ps4': { sold: false, orderId: null, code: 'DEMON-PS4-001-REMAKE' },
            'Primary ps5': { sold: false, orderId: null, code: 'DEMON-PS5-002-REMAKE' },
            'Secondary': { sold: false, orderId: null, code: 'DEMON-SEC-003-REMAKE' },
            'Offline ps4': { sold: false, orderId: null, code: 'DEMON-OFF-PS4-004' },
            'Offline ps5': { sold: false, orderId: null, code: 'DEMON-OFF-PS5-005' }
          },
          totalCodes: 7
        }
      ]
    };

    let updatedCount = 0;

    // Update each product with digital items
    for (const product of products) {
      const digitalItems = digitalItemsData[product.name];
      
      if (digitalItems) {
        console.log(`\n🎮 Updating: ${product.name}`);
        console.log(`   📧 Adding ${digitalItems.length} digital item(s)`);
        
        // Update product with digital items
        await connection.query(
          'UPDATE products SET digital_items = ?, stock = ? WHERE id = ?',
          [JSON.stringify(digitalItems), digitalItems.length * 5, product.id]
        );
        
        updatedCount++;
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`\n⚠️  No digital items data for: ${product.name}`);
      }
    }

    console.log(`\n🎉 Summary:`);
    console.log(`   ✅ Updated ${updatedCount} products with digital items`);
    console.log(`   📦 Total digital items added: ${Object.values(digitalItemsData).flat().length}`);
    console.log(`   🔑 Total codes/slots: ${Object.values(digitalItemsData).flat().reduce((sum, item) => sum + (item.totalCodes || 0), 0)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

populateProductsWithDigitalItems();
