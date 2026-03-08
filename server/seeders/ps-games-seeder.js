const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envFiles = ['.env.production', '.env', '../.env'];
let loadedEnv = null;

for (const file of envFiles) {
  const envPath = path.resolve(__dirname, file);
  if (fs.existsSync(envPath)) {
    console.log(`✅ Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    loadedEnv = file;
    break;
  }
}

// Database Configuration
let dbHost = process.env.DB_HOST || 'localhost';
if (dbHost === '127.0.0.1') {
  dbHost = 'localhost';
}

const config = {
  host: dbHost,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0
};

// PS Games Data
const psGames = [
  {
    name: "Marvel's Spider-Man 2",
    slug: "spider-man-2",
    description: "Swing through New York City as Miles Morales and Peter Parker in this epic superhero adventure.",
    price: 69.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/5/5d/Marvel%27s_Spider-Man_2_cover_art.jpg",
    stock: 50,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.8,
    release_date: "2023-10-20",
    developer: "Insomniac Games",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "Ray Tracing", "60 FPS", "DualSense Features"],
    tags: ["action", "adventure", "superhero", "open-world"]
  },
  {
    name: "God of War Ragnarök",
    slug: "god-of-war-ragnarok",
    description: "Join Kratos and Atreus on a mythic journey through the Nine Realms in the conclusion of the Norse saga.",
    price: 69.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/8/87/God_of_War_Ragnar%C3%B6k_cover_art.jpg",
    stock: 45,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.9,
    release_date: "2022-11-09",
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "Ray Tracing", "60 FPS", "DualSense Features"],
    tags: ["action", "adventure", "mythology", "story-driven"]
  },
  {
    name: "Horizon Forbidden West",
    slug: "horizon-forbidden-west",
    description: "Explore the dangerous frontier of the Forbidden West as Aloy in this stunning open-world adventure.",
    price: 59.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/6/69/Horizon_Forbidden_West_cover_art.jpg",
    stock: 40,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.7,
    release_date: "2022-02-18",
    developer: "Guerrilla Games",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "Ray Tracing", "60 FPS", "DualSense Features"],
    tags: ["action", "adventure", "open-world", "rpg"]
  },
  {
    name: "The Last of Us Part I",
    slug: "the-last-of-us-part-1",
    description: "Experience the emotional journey of Joel and Ellie in this complete remake of the acclaimed classic.",
    price: 69.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/4/4c/The_Last_of_Us_Part_I_cover_art.jpg",
    stock: 35,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.9,
    release_date: "2022-09-02",
    developer: "Naughty Dog",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "Ray Tracing", "60 FPS", "DualSense Features"],
    tags: ["action", "adventure", "survival", "story-driven"]
  },
  {
    name: "Gran Turismo 7",
    slug: "gran-turismo-7",
    description: "The ultimate racing simulator with stunning visuals and realistic driving physics.",
    price: 69.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/4/4c/Gran_Turismo_7_cover_art.jpg",
    stock: 60,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.6,
    release_date: "2022-03-04",
    developer: "Polyphony Digital",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "Ray Tracing", "60 FPS", "DualSense Features"],
    tags: ["racing", "simulation", "sports", "multiplayer"]
  },
  {
    name: "Ratchet & Clank: Rift Apart",
    slug: "ratchet-clank-rift-apart",
    description: "Blast between dimensions with Ratchet and Clank in this interdimensional adventure.",
    price: 59.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/3/31/Ratchet_%26_Clank_Rift_Apart_cover_art.jpg",
    stock: 42,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.7,
    release_date: "2021-06-11",
    developer: "Insomniac Games",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "Ray Tracing", "60 FPS", "DualSense Features", "Instant Loading"],
    tags: ["action", "adventure", "platformer", "family-friendly"]
  },
  {
    name: "Demon's Souls Remake",
    slug: "demons-souls-remake",
    description: "Return to the kingdom of Boletaria in this stunning remake of the classic action RPG.",
    price: 69.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/8/85/Demon%27s_Souls_cover_art.jpg",
    stock: 30,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.8,
    release_date: "2020-11-12",
    developer: "Bluepoint Games",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "Ray Tracing", "60 FPS", "DualSense Features"],
    tags: ["action", "rpg", "dark-fantasy", "challenging"]
  },
  {
    name: "Returnal",
    slug: "returnal",
    description: "Fight to survive on a hostile alien planet in this roguelike third-person shooter.",
    price: 59.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/3/32/Returnal_cover_art.jpg",
    stock: 38,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.5,
    release_date: "2021-04-30",
    developer: "Housemarque",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "Ray Tracing", "60 FPS", "DualSense Features"],
    tags: ["action", "shooter", "roguelike", "sci-fi"]
  },
  {
    name: "Astro's Playroom",
    slug: "astros-playroom",
    description: "Free pre-installed game showcasing the PS5's DualSense controller capabilities.",
    price: 0.00,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/4/4a/Astro%27s_Playroom_cover_art.jpg",
    stock: 999,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.3,
    release_date: "2020-11-12",
    developer: "Team Asobi",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "60 FPS", "DualSense Features"],
    tags: ["platformer", "family-friendly", "free", "tech-demo"]
  },
  {
    name: "Sackboy: A Big Adventure",
    slug: "sackboy-big-adventure",
    description: "Join Sackboy on a 3D platforming adventure with friends in this charming co-op game.",
    price: 59.99,
    category_slug: "games",
    image: "https://upload.wikimedia.org/wikipedia/en/6/67/Sackboy_A_Big_Adventure_cover_art.jpg",
    stock: 44,
    has_variants: false,
    is_digital: true,
    platform: "PS5",
    rating: 4.4,
    release_date: "2020-11-12",
    developer: "Sumo Digital",
    publisher: "Sony Interactive Entertainment",
    features: ["4K Graphics", "60 FPS", "DualSense Features", "Co-op"],
    tags: ["platformer", "family-friendly", "co-op", "adventure"]
  }
];

async function seedPSGames() {
  let connection;
  try {
    console.log('\n🔄 Starting PS Games Seeder...\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully!');

    // Begin transaction
    await connection.beginTransaction();
    console.log('📝 Transaction started');

    // Check if products table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'products'");
    if (tables.length === 0) {
      console.log('❌ Products table does not exist. Please run migrations first.');
      return;
    }

    // Get category ID for 'games'
    const [categoryRows] = await connection.execute(
      'SELECT id FROM categories WHERE slug = ?',
      ['games']
    );
    
    if (categoryRows.length === 0) {
      console.log('❌ Games category not found. Please seed categories first.');
      return;
    }
    
    const gamesCategoryId = categoryRows[0].id;
    console.log(`✅ Found games category ID: ${gamesCategoryId}`);

    // Clear existing PS games
    const [deleteResult] = await connection.execute(
      'DELETE FROM products WHERE category_slug = ? AND (name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ?)',
      ['games', '%Spider-Man%', '%God of War%', '%Horizon%', '%Last of Us%', '%Gran Turismo%', '%Ratchet%', '%Demon\'s Souls%', '%Returnal%', '%Astro\'s%', '%Sackboy%']
    );
    console.log(`🗑️  Cleared ${deleteResult.affectedRows} existing PS games`);

    // Insert PS games
    let insertedCount = 0;
    for (const game of psGames) {
      const productId = `ps5-${game.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const [result] = await connection.execute(`
        INSERT INTO products (
          id, name, category_slug, sub_category_slug, price, cost, stock, image, 
          description, attributes, digital_items, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        productId,
        game.name,
        game.category_slug,
        game.platform.toLowerCase(), // use platform as sub_category
        game.price,
        game.price * 0.7, // cost as 70% of price
        game.stock,
        game.image,
        game.description,
        JSON.stringify({
          rating: game.rating,
          release_date: game.release_date,
          developer: game.developer,
          publisher: game.publisher,
          platform: game.platform,
          features: game.features,
          tags: game.tags,
          is_digital: game.is_digital,
          has_variants: game.has_variants
        }),
        JSON.stringify({
          download_url: null,
          license_key: null,
          platform: game.platform,
          file_size: null
        })
      ]);

      if (result.affectedRows > 0) {
        insertedCount++;
        console.log(`✅ Inserted: ${game.name}`);
      }
    }

    // Commit transaction
    await connection.commit();
    console.log('\n✅ Transaction committed successfully!');

    console.log(`\n🎮 PS Games Seeding Complete!`);
    console.log(`📊 Total games inserted: ${insertedCount}/${psGames.length}`);
    console.log(`💰 Price range: $${Math.min(...psGames.map(g => g.price))} - $${Math.max(...psGames.filter(g => g.price > 0).map(g => g.price))}`);
    console.log(`🎯 Platform: PS5`);
    console.log(`⭐ Average rating: ${(psGames.reduce((sum, g) => sum + g.rating, 0) / psGames.length).toFixed(1)}/5`);

  } catch (error) {
    console.error('\n❌ Error seeding PS games:', error.message);
    if (connection) {
      await connection.rollback();
      console.log('🔄 Transaction rolled back');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeder
seedPSGames();
