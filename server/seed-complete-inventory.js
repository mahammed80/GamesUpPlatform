const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const products = [
  {
    name: "Marvel's Spider-Man 2",
    description: 'Swing, jump and utilize the new Web Wings to travel across Marvel\'s New York. Experience the main story of Peter Parker and Miles Morales as they face the ultimate test.',
    price: 69.99,
    cost: 45.00,
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=300&fit=crop',
    category_slug: 'games',
    sub_category_slug: 'action',
    stock: 15,
    digital_items: [
      {
        email: 'spiderman@psn-account.com',
        password: 'Spidey2024!Secure',
        code: 'SPIDER-PS4-001-MJ2K',
        outlookEmail: 'spiderman.recovery@outlook.com',
        outlookPassword: 'Outlook@Spidey2024',
        birthdate: '1995-08-10',
        region: 'US',
        onlineId: 'SpiderManPlayer',
        backupCodes: 'SPIDER-BACKUP-002\nSPIDER-BACKUP-003',
        slots: {
          'Primary ps4': { sold: false, orderId: null, code: 'SPIDER-PS4-001-MJ2K' },
          'Primary ps5': { sold: false, orderId: null, code: 'SPIDER-PS5-002-MJ2K' },
          'Secondary': { sold: false, orderId: null, code: 'SPIDER-SEC-003-MJ2K' },
          'Offline ps4': { sold: false, orderId: null, code: 'SPIDER-OFF-PS4-004' },
          'Offline ps5': { sold: false, orderId: null, code: 'SPIDER-OFF-PS5-005' }
        },
        totalCodes: 5
      },
      {
        email: 'milesmorales@psn-account.com',
        password: 'Miles2024!Secure',
        code: 'MILES-PS4-006-MJ2K',
        outlookEmail: 'milesm.recovery@outlook.com',
        outlookPassword: 'Outlook@Miles2024',
        birthdate: '1998-12-10',
        region: 'US',
        onlineId: 'MilesMorales',
        backupCodes: 'MILES-BACKUP-007\nMILES-BACKUP-008',
        slots: {
          'Primary ps4': { sold: false, orderId: null, code: 'MILES-PS4-006-MJ2K' },
          'Primary ps5': { sold: false, orderId: null, code: 'MILES-PS5-007-MJ2K' },
          'Secondary': { sold: false, orderId: null, code: 'MILES-SEC-008-MJ2K' },
          'Offline ps4': { sold: false, orderId: null, code: 'MILES-OFF-PS4-009' },
          'Offline ps5': { sold: false, orderId: null, code: 'MILES-OFF-PS5-010' }
        },
        totalCodes: 5
      }
    ]
  },
  {
    name: 'God of War Ragnarök',
    description: 'The sequel to critically acclaimed God of War (2018). Kratos and Atreus must journey to each of the Nine Realms in search of answers as Asgardian forces prepare for a prophesied battle that will end the world.',
    price: 69.99,
    cost: 45.00,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e9b4e?w=300&h=300&fit=crop',
    category_slug: 'games',
    sub_category_slug: 'action',
    stock: 12,
    digital_items: [
      {
        email: 'kratos@psn-account.com',
        password: 'Kratos2024!Secure',
        code: 'GOW-PS4-001-RAGNAR',
        outlookEmail: 'kratos.recovery@outlook.com',
        outlookPassword: 'Outlook@Kratos2024',
        birthdate: '1985-06-15',
        region: 'EU',
        onlineId: 'KratosPlayer',
        backupCodes: 'GOW-BACKUP-002\nGOW-BACKUP-003',
        slots: {
          'Primary ps4': { sold: false, orderId: null, code: 'GOW-PS4-001-RAGNAR' },
          'Primary ps5': { sold: false, orderId: null, code: 'GOW-PS5-002-RAGNAR' },
          'Secondary': { sold: false, orderId: null, code: 'GOW-SEC-003-RAGNAR' },
          'Offline ps4': { sold: false, orderId: null, code: 'GOW-OFF-PS4-004' },
          'Offline ps5': { sold: false, orderId: null, code: 'GOW-OFF-PS5-005' }
        },
        totalCodes: 5
      }
    ]
  },
  {
    name: 'Horizon Forbidden West',
    description: 'Join Aloy as she braves a dangerous new frontier to uncover the secrets behind Earth\'s ancient civilizations and face awe-inspiring machines.',
    price: 59.99,
    cost: 35.00,
    image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=300&h=300&fit=crop',
    category_slug: 'games',
    sub_category_slug: 'rpg',
    stock: 10,
    digital_items: [
      {
        email: 'aloy@psn-account.com',
        password: 'Aloy2024!Secure',
        code: 'HORIZON-PS4-001-FW',
        outlookEmail: 'aloy.recovery@outlook.com',
        outlookPassword: 'Outlook@Aloy2024',
        birthdate: '2000-03-15',
        region: 'UK',
        onlineId: 'AloyHunter',
        backupCodes: 'HZ-BACKUP-002\nHZ-BACKUP-003',
        slots: {
          'Primary ps4': { sold: false, orderId: null, code: 'HORIZON-PS4-001-FW' },
          'Primary ps5': { sold: false, orderId: null, code: 'HORIZON-PS5-002-FW' },
          'Secondary': { sold: false, orderId: null, code: 'HORIZON-SEC-003-FW' },
          'Offline ps4': { sold: false, orderId: null, code: 'HORIZON-OFF-PS4-004' },
          'Offline ps5': { sold: false, orderId: null, code: 'HORIZON-OFF-PS5-005' }
        },
        totalCodes: 5
      }
    ]
  },
  {
    name: 'The Last of Us Part I',
    description: 'Experience the emotional storytelling and unforgettable characters in this rebuilt-from-the-ground-up version of the game that started it all.',
    price: 49.99,
    cost: 30.00,
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=300&fit=crop',
    category_slug: 'games',
    sub_category_slug: 'action',
    stock: 8,
    digital_items: [
      {
        email: 'joel@psn-account.com',
        password: 'Joel2024!Secure',
        code: 'TLOU-PS4-001-REMASTER',
        outlookEmail: 'joel.recovery@outlook.com',
        outlookPassword: 'Outlook@Joel2024',
        birthdate: '1980-09-26',
        region: 'US',
        onlineId: 'JoelSurvivor',
        backupCodes: 'TLOU-BACKUP-002\nTLOU-BACKUP-003',
        slots: {
          'Primary ps4': { sold: false, orderId: null, code: 'TLOU-PS4-001-REMASTER' },
          'Primary ps5': { sold: false, orderId: null, code: 'TLOU-PS5-002-REMASTER' },
          'Secondary': { sold: false, orderId: null, code: 'TLOU-SEC-003-REMASTER' },
          'Offline ps4': { sold: false, orderId: null, code: 'TLOU-OFF-PS4-004' },
          'Offline ps5': { sold: false, orderId: null, code: 'TLOU-OFF-PS5-005' }
        },
        totalCodes: 5
      },
      {
        email: 'ellie@psn-account.com',
        password: 'Ellie2024!Secure',
        code: 'ELLIE-PS4-006-REMASTER',
        outlookEmail: 'ellie.recovery@outlook.com',
        outlookPassword: 'Outlook@Ellie2024',
        birthdate: '2003-03-14',
        region: 'US',
        onlineId: 'EllieWilliams',
        backupCodes: 'ELLIE-BACKUP-007\nELLIE-BACKUP-008',
        slots: {
          'Primary ps4': { sold: false, orderId: null, code: 'ELLIE-PS4-006-REMASTER' },
          'Primary ps5': { sold: false, orderId: null, code: 'ELLIE-PS5-007-REMASTER' },
          'Secondary': { sold: false, orderId: null, code: 'ELLIE-SEC-008-REMASTER' },
          'Offline ps4': { sold: false, orderId: null, code: 'ELLIE-OFF-PS4-009' },
          'Offline ps5': { sold: false, orderId: null, code: 'ELLIE-OFF-PS5-010' }
        },
        totalCodes: 5
      }
    ]
  },
  {
    name: 'Gran Turismo 7',
    description: 'The best of the real driving simulator series. With over 400 cars, 90+ track configurations, and new and improved features.',
    price: 59.99,
    cost: 35.00,
    image: 'https://images.unsplash.com/photo-1594746147656-7483a3f3d6b8?w=300&h=300&fit=crop',
    category_slug: 'games',
    sub_category_slug: 'racing',
    stock: 6,
    digital_items: [
      {
        email: 'gtplayer@psn-account.com',
        password: 'GT2024!Secure',
        code: 'GT7-PS4-001-ULTIMATE',
        outlookEmail: 'gtplayer.recovery@outlook.com',
        outlookPassword: 'Outlook@GT2024',
        birthdate: '1992-07-21',
        region: 'JP',
        onlineId: 'GT7Racer',
        backupCodes: 'GT7-BACKUP-002\nGT7-BACKUP-003',
        slots: {
          'Primary ps4': { sold: false, orderId: null, code: 'GT7-PS4-001-ULTIMATE' },
          'Primary ps5': { sold: false, orderId: null, code: 'GT7-PS5-002-ULTIMATE' },
          'Secondary': { sold: false, orderId: null, code: 'GT7-SEC-003-ULTIMATE' },
          'Offline ps4': { sold: false, orderId: null, code: 'GT7-OFF-PS4-004' },
          'Offline ps5': { sold: false, orderId: null, code: 'GT7-OFF-PS5-005' }
        },
        totalCodes: 5
      }
    ]
  },
  {
    name: 'Demon\'s Souls',
    description: 'From Bluepoint Games comes a remake of the classic that started it all. Entirely rebuilt from the ground up and masterfully enhanced.',
    price: 69.99,
    cost: 45.00,
    image: 'https://images.unsplash.com/photo-1581009146605-d35b2fbaf0c2?w=300&h=300&fit=crop',
    category_slug: 'games',
    sub_category_slug: 'rpg',
    stock: 4,
    digital_items: [
      {
        email: 'demon@psn-account.com',
        password: 'Demon2024!Secure',
        code: 'DEMON-PS4-001-REMAKE',
        outlookEmail: 'demon.recovery@outlook.com',
        outlookPassword: 'Outlook@Demon2024',
        birthdate: '1988-11-02',
        region: 'EU',
        onlineId: 'DemonSlayer',
        backupCodes: 'DEMON-BACKUP-002\nDEMON-BACKUP-003',
        slots: {
          'Primary ps4': { sold: false, orderId: null, code: 'DEMON-PS4-001-REMAKE' },
          'Primary ps5': { sold: false, orderId: null, code: 'DEMON-PS5-002-REMAKE' },
          'Secondary': { sold: false, orderId: null, code: 'DEMON-SEC-003-REMAKE' },
          'Offline ps4': { sold: false, orderId: null, code: 'DEMON-OFF-PS4-004' },
          'Offline ps5': { sold: false, orderId: null, code: 'DEMON-OFF-PS5-005' }
        },
        totalCodes: 5
      }
    ]
  }
];

async function seedCompleteInventory() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'games',
    port: process.env.DB_PORT || 3306,
  };

  console.log('🌱 Connecting to database...');
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to database!');

    console.log('🎮 Starting complete inventory seeding...');
    
    // Clear existing complete inventory products first
    const productNames = products.map(p => p.name);
    const placeholders = productNames.map(() => '?').join(',');
    const [deleteResult] = await connection.execute(
      `DELETE FROM products WHERE name IN (${placeholders})`,
      productNames
    );
    console.log(`🗑️  Cleared ${deleteResult.affectedRows} existing products`);

    for (const product of products) {
      const digitalItemsJson = JSON.stringify(product.digital_items);
      const attributesJson = JSON.stringify({
        features: ['Digital Download', 'Multiplayer', 'Achievements'],
        languages: ['English', 'Spanish', 'French', 'German', 'Italian'],
        platform: ['PS4', 'PS5']
      });

      const [result] = await connection.execute(`
        INSERT INTO products (
          name, description, price, cost, image, category_slug, sub_category_slug, 
          stock, digital_items, attributes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        product.name,
        product.description,
        product.price,
        product.cost,
        product.image,
        product.category_slug,
        product.sub_category_slug,
        product.stock,
        digitalItemsJson,
        attributesJson
      ]);

      console.log(`✅ Added: ${product.name} with ${product.digital_items.length} digital items`);
      
      // Log details of each digital item
      product.digital_items.forEach((item, index) => {
        console.log(`   📧 Digital Item ${index + 1}:`);
        console.log(`      Email: ${item.email}`);
        console.log(`      Password: ${item.password}`);
        console.log(`      Code: ${item.code}`);
        console.log(`      Region: ${item.region}`);
        console.log(`      Online ID: ${item.onlineId}`);
        console.log(`      Slots: ${Object.keys(item.slots || {}).length} codes`);
      });
    }

    console.log('🎉 Complete inventory seeding finished!');
    console.log(`📊 Summary: Added ${products.length} products with complete digital data`);
    console.log(`🔢 Total digital items: ${products.reduce((sum, p) => sum + p.digital_items.length, 0)}`);
    console.log(`🎯 Total stock slots: ${products.reduce((sum, p) => sum + p.stock, 0)}`);
    
    await connection.end();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedCompleteInventory();
