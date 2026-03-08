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

// Categories Data
const categories = [
  {
    name: "Games",
    slug: "games",
    icon: "🎮",
    description: "Video games for PlayStation, Xbox, Nintendo, and PC platforms",
    is_active: true
  },
  {
    name: "Consoles",
    slug: "consoles",
    icon: "🎯",
    description: "Gaming consoles and hardware from major manufacturers",
    is_active: true
  },
  {
    name: "Accessories",
    slug: "accessories",
    icon: "🎧",
    description: "Gaming accessories including controllers, headsets, and more",
    is_active: true
  },
  {
    name: "Headsets",
    slug: "headsets",
    icon: "🎧",
    description: "Gaming headsets for immersive audio experience",
    is_active: true
  },
  {
    name: "Storage",
    slug: "storage",
    icon: "💾",
    description: "Storage solutions including SSDs, HDDs, and memory cards",
    is_active: true
  },
  {
    name: "Monitors",
    slug: "monitors",
    icon: "🖥️",
    description: "Gaming monitors and displays for optimal visual performance",
    is_active: true
  },
  {
    name: "PC Gaming",
    slug: "pc",
    icon: "💻",
    description: "PC gaming hardware, components, and peripherals",
    is_active: true
  },
  {
    name: "Mobile Gaming",
    slug: "mobile",
    icon: "📱",
    description: "Mobile gaming devices, accessories, and games",
    is_active: true
  },
  {
    name: "Subscriptions",
    slug: "subscriptions",
    icon: "💳",
    description: "Digital subscriptions and gaming services",
    is_active: true
  }
];

async function seedCategories() {
  let connection;
  try {
    console.log('\n🔄 Starting Categories Seeder...\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully!');

    // Begin transaction
    await connection.beginTransaction();
    console.log('📝 Transaction started');

    // Check if categories table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'categories'");
    if (tables.length === 0) {
      console.log('❌ Categories table does not exist. Please run migrations first.');
      return;
    }

    // Clear existing categories
    const [deleteResult] = await connection.execute('DELETE FROM categories');
    console.log(`🗑️  Cleared ${deleteResult.affectedRows} existing categories`);

    // Insert categories
    let insertedCount = 0;
    for (const category of categories) {
      const categoryId = `cat-${category.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const [result] = await connection.execute(`
        INSERT INTO categories (
          id, name, slug, icon, display_order, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        categoryId,
        category.name,
        category.slug,
        category.icon,
        0, // display_order
        category.is_active
      ]);

      if (result.affectedRows > 0) {
        insertedCount++;
        console.log(`✅ Inserted: ${category.name} (${category.icon})`);
      }
    }

    // Commit transaction
    await connection.commit();
    console.log('\n✅ Transaction committed successfully!');

    console.log(`\n📂 Categories Seeding Complete!`);
    console.log(`📊 Total categories inserted: ${insertedCount}/${categories.length}`);
    console.log(`🎮 Gaming categories: Games, Consoles, Accessories, Headsets`);
    console.log(`💻 Hardware categories: Storage, Monitors, PC, Mobile`);
    console.log(`💳 Services: Subscriptions`);

  } catch (error) {
    console.error('\n❌ Error seeding categories:', error.message);
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
seedCategories();
