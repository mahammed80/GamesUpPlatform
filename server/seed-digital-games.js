const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const games = [
  {
    name: 'God of War Ragnarök',
    description: 'The sequel to the critically acclaimed God of War (2018). Kratos and Atreus must journey to each of the Nine Realms in search of answers as Asgardian forces prepare for a prophesied battle that will end the world.',
    price: 69.99,
    cost: 45.00,
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png',
    category_slug: 'games',
    sub_category_slug: 'action',
    stock: 50,
    digital_items: [
      { code: 'GOWR-1111-2222-3333', type: 'key', status: 'available' },
      { code: 'GOWR-4444-5555-6666', type: 'key', status: 'available' },
      { code: 'GOWR-7777-8888-9999', type: 'key', status: 'available' }
    ]
  },
  {
    name: 'The Last of Us Part II Remastered',
    description: 'Experience the winner of over 300 Game of the Year awards now with an array of technical enhancements that make The Last of Us Part II Remastered the definitive way to play Ellie and Abby\'s critically acclaimed story.',
    price: 49.99,
    cost: 30.00,
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202310/2516/609d57187b744f4344075199859f51172348505501314949.png',
    category_slug: 'games',
    sub_category_slug: 'action',
    stock: 40,
    digital_items: [
      { code: 'TLOU-AAAA-BBBB-CCCC', type: 'key', status: 'available' },
      { code: 'TLOU-DDDD-EEEE-FFFF', type: 'key', status: 'available' }
    ]
  },
  {
    name: 'EA SPORTS FC 26',
    description: 'The next chapter in The World\'s Game. Experience the most authentic football experience ever with HyperMotionV technology.',
    price: 69.99,
    cost: 50.00,
    image: 'https://media.contentapi.ea.com/content/dam/ea/fc/fc-24/common/fc24-standard-edition-featured-image-16x9.jpg.adapt.crop191x100.1200w.jpg', // Placeholder using FC24 style
    category_slug: 'games',
    sub_category_slug: 'sports',
    stock: 100,
    digital_items: [
      { code: 'FC26-XXXX-YYYY-ZZZZ', type: 'key', status: 'available' },
      { code: 'FC26-1234-5678-9012', type: 'key', status: 'available' }
    ]
  },
  {
    name: 'Grand Theft Auto V',
    description: 'Experience the interwoven stories of Franklin, Michael and Trevor in the sprawling sun-soaked metropolis of Los Santos and Blaine County.',
    price: 29.99,
    cost: 15.00,
    image: 'https://media-rockstargames-com.akamaized.net/rockstargames-newsite/img/global/games/fob/640/V.jpg',
    category_slug: 'games',
    sub_category_slug: 'action',
    stock: 200,
    digital_items: [
      { code: 'GTAV-KEY1-KEY2-KEY3', type: 'key', status: 'available' }
    ]
  },
  {
    name: 'Elden Ring',
    description: 'THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.',
    price: 59.99,
    cost: 35.00,
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phXiCRC97MonwVU6CNHXPrvb.png',
    category_slug: 'games',
    sub_category_slug: 'rpg',
    stock: 60,
    digital_items: [
      { code: 'ELDN-RING-OHHH-RING', type: 'key', status: 'available' }
    ]
  },
  {
    name: 'Call of Duty: Modern Warfare III',
    description: 'In the direct sequel to the record-breaking Call of Duty: Modern Warfare II, Captain Price and Task Force 141 face off against the ultimate threat.',
    price: 69.99,
    cost: 45.00,
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202308/0217/e77a5056717a665961637500596328766112211568284568.png',
    category_slug: 'games',
    sub_category_slug: 'shooter',
    stock: 80,
    digital_items: [
      { code: 'COD3-MW33-MW33-MW33', type: 'key', status: 'available' }
    ]
  }
];

async function seedDigitalGames() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'games',
    port: process.env.DB_PORT || 3306,
  };

  console.log('Connecting to database...');
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected!');

    console.log('Seeding digital games...');
    
    for (const game of games) {
      // Check if game exists to avoid duplicates
      const [rows] = await connection.query('SELECT id FROM products WHERE name = ?', [game.name]);
      
      const digitalItemsJson = JSON.stringify(game.digital_items);
      const attributesJson = JSON.stringify({});

      if (rows.length === 0) {
        await connection.query(
          'INSERT INTO products (name, description, price, cost, image, category_slug, sub_category_slug, stock, digital_items, attributes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [game.name, game.description, game.price, game.cost, game.image, game.category_slug, game.sub_category_slug, game.stock, digitalItemsJson, attributesJson]
        );
        console.log(`Added: ${game.name}`);
      } else {
        // Update existing game to ensure it has digital items and cost
        await connection.query(
            'UPDATE products SET description=?, price=?, cost=?, image=?, category_slug=?, sub_category_slug=?, stock=?, digital_items=?, attributes=? WHERE id=?',
            [game.description, game.price, game.cost, game.image, game.category_slug, game.sub_category_slug, game.stock, digitalItemsJson, attributesJson, rows[0].id]
        );
        console.log(`Updated (already exists): ${game.name}`);
      }
    }

    console.log('Seeding complete!');
    await connection.end();
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seedDigitalGames();
