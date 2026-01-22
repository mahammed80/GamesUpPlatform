const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const games = [
  // PS5 Games
  {
    name: 'Marvel\'s Spider-Man 2',
    description: 'Spider-Men, Peter Parker and Miles Morales, return for an exciting new adventure in the critically acclaimed Marvel\'s Spider-Man franchise.',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop',
    category_slug: 'games',
    stock: 150,
    status: 'In Stock'
  },
  {
    name: 'God of War Ragnarök (PS5)',
    description: 'Embark on an epic and heartfelt journey as Kratos and Atreus struggle with holding on and letting go.',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 85,
    status: 'In Stock'
  },
  {
    name: 'Final Fantasy VII Rebirth',
    description: 'Cloud and his friends embark on a journey across the planet. Uncover the truth and save the world from Sephiroth.',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 200,
    status: 'In Stock'
  },
  {
    name: 'Demon\'s Souls',
    description: 'Entirely rebuilt from the ground up and masterfully enhanced, this remake introduces the horrors of a fog-laden, dark fantasy land to a whole new generation of gamers.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 45,
    status: 'In Stock'
  },
  {
    name: 'Ratchet & Clank: Rift Apart',
    description: 'Blast your way through an interdimensional adventure.',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 60,
    status: 'In Stock'
  },

  // PS4 Games
  {
    name: 'The Last of Us Part II (PS4)',
    description: 'Five years after their dangerous journey across the post-pandemic United States, Ellie and Joel have settled down in Jackson, Wyoming.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 120,
    status: 'In Stock'
  },
  {
    name: 'Ghost of Tsushima (PS4)',
    description: 'In the late 13th century, the Mongol empire has laid waste to entire nations along their campaign to conquer the East.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 90,
    status: 'In Stock'
  },
  {
    name: 'Horizon Zero Dawn: Complete Edition',
    description: 'Experience the entire legendary quest of Aloy to unravel the mysteries of a world ruled by deadly Machines.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 300,
    status: 'In Stock'
  },
  {
    name: 'Bloodborne',
    description: 'Hunt your nightmares as you search for answers in the ancient city of Yharnam.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 75,
    status: 'In Stock'
  },
  {
    name: 'Uncharted 4: A Thief\'s End',
    description: 'Several years after his last adventure, retired fortune hunter, Nathan Drake, is forced back into the world of thieves.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop', // Placeholder
    category_slug: 'games',
    stock: 150,
    status: 'In Stock'
  }
];

async function seedGames() {
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

    console.log('Seeding games...');
    
    for (const game of games) {
      // Check if game exists to avoid duplicates
      const [rows] = await connection.query('SELECT id FROM products WHERE name = ?', [game.name]);
      
      if (rows.length === 0) {
        await connection.query(
          'INSERT INTO products (name, description, price, image, category_slug, stock) VALUES (?, ?, ?, ?, ?, ?)',
          [game.name, game.description, game.price, game.image, game.category_slug, game.stock]
        );
        console.log(`Added: ${game.name}`);
      } else {
        console.log(`Skipped (already exists): ${game.name}`);
      }
    }

    console.log('Seeding complete!');
    await connection.end();
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seedGames();
