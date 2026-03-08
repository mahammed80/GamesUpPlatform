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

// PS+ Subscription Plans
const psPlusPlans = [
  {
    name: "PlayStation Plus Essential",
    slug: "ps-plus-essential",
    description: "Access online multiplayer, monthly games, and exclusive discounts. Perfect for casual gamers.",
    price: 9.99,
    billing_cycle: "monthly",
    features: [
      "Online Multiplayer Access",
      "Monthly Games Collection",
      "Exclusive Discounts",
      "Cloud Storage",
      "Share Play"
    ],
    benefits: [
      "Play online with friends",
      "Get 2-3 free games monthly",
      "Save up to 100GB of game data",
      "Share your screen with friends"
    ],
    duration_months: 1,
    max_concurrent_users: 1,
    is_subscription: true,
    is_active: true,
    tier: "essential"
  },
  {
    name: "PlayStation Plus Essential (Annual)",
    slug: "ps-plus-essential-annual",
    description: "Save with annual billing! Get all Essential benefits for a full year at a discounted price.",
    price: 59.99,
    billing_cycle: "annual",
    features: [
      "Online Multiplayer Access",
      "Monthly Games Collection",
      "Exclusive Discounts",
      "Cloud Storage",
      "Share Play",
      "2 Free Months Included"
    ],
    benefits: [
      "Save $60 compared to monthly",
      "Play online with friends",
      "Get 2-3 free games monthly",
      "Save up to 100GB of game data"
    ],
    duration_months: 12,
    max_concurrent_users: 1,
    is_subscription: true,
    is_active: true,
    tier: "essential"
  },
  {
    name: "PlayStation Plus Extra",
    slug: "ps-plus-extra",
    description: "Everything in Essential, plus a massive game library of 400+ PS4 and PS5 titles to download and play.",
    price: 14.99,
    billing_cycle: "monthly",
    features: [
      "All Essential Benefits",
      "Game Catalog (400+ titles)",
      "PS4 & PS5 Games Library",
      "Offline Single-Player Access",
      "Cloud Storage",
      "Exclusive Discounts"
    ],
    benefits: [
      "Access 400+ downloadable games",
      "Play offline single-player games",
      "All Essential tier benefits",
      "New games added regularly"
    ],
    duration_months: 1,
    max_concurrent_users: 1,
    is_subscription: true,
    is_active: true,
    tier: "extra"
  },
  {
    name: "PlayStation Plus Extra (Annual)",
    slug: "ps-plus-extra-annual",
    description: "Best value! Annual subscription to Extra tier with significant savings and all gaming benefits.",
    price: 99.99,
    billing_cycle: "annual",
    features: [
      "All Essential Benefits",
      "Game Catalog (400+ titles)",
      "PS4 & PS5 Games Library",
      "Offline Single-Player Access",
      "Cloud Storage",
      "Exclusive Discounts",
      "2 Free Months Included"
    ],
    benefits: [
      "Save $80 compared to monthly",
      "Access 400+ downloadable games",
      "Play offline single-player games",
      "All Essential tier benefits"
    ],
    duration_months: 12,
    max_concurrent_users: 1,
    is_subscription: true,
    is_active: true,
    tier: "extra"
  },
  {
    name: "PlayStation Plus Premium",
    slug: "ps-plus-premium",
    description: "The ultimate PlayStation experience with game streaming, classic titles, and time-limited trials.",
    price: 19.99,
    billing_cycle: "monthly",
    features: [
      "All Extra Benefits",
      "Game Streaming",
      "Classic Games Library",
      "PS1, PS2, PS3, PSP Games",
      "Time-Limited Game Trials",
      "Cloud Streaming",
      "Share Play"
    ],
    benefits: [
      "Stream games to any device",
      "Play classic PlayStation games",
      "Try new games before buying",
      "All Extra tier benefits",
      "Access to Ubisoft+ Classics"
    ],
    duration_months: 1,
    max_concurrent_users: 1,
    is_subscription: true,
    is_active: true,
    tier: "premium"
  },
  {
    name: "PlayStation Plus Premium (Annual)",
    slug: "ps-plus-premium-annual",
    description: "Complete PlayStation experience with maximum savings. The ultimate gaming subscription.",
    price: 119.99,
    billing_cycle: "annual",
    features: [
      "All Extra Benefits",
      "Game Streaming",
      "Classic Games Library",
      "PS1, PS2, PS3, PSP Games",
      "Time-Limited Game Trials",
      "Cloud Streaming",
      "Share Play",
      "3 Free Months Included"
    ],
    benefits: [
      "Save $120 compared to monthly",
      "Stream games to any device",
      "Play classic PlayStation games",
      "Try new games before buying",
      "All Extra tier benefits"
    ],
    duration_months: 12,
    max_concurrent_users: 1,
    is_subscription: true,
    is_active: true,
    tier: "premium"
  }
];

async function seedPSPlus() {
  let connection;
  try {
    console.log('\n🔄 Starting PS+ Subscription Seeder...\n');
    
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

    // Get or create subscriptions category
    let [categoryRows] = await connection.execute(
      'SELECT id FROM categories WHERE slug = ?',
      ['subscriptions']
    );
    
    let subscriptionsCategoryId;
    if (categoryRows.length === 0) {
      // Create subscriptions category
      const [result] = await connection.execute(`
        INSERT INTO categories (
          id, name, slug, icon, display_order, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        `cat-subscriptions-${Date.now()}`,
        'Subscriptions',
        'subscriptions',
        '💳',
        8, // display_order
        1
      ]);
      subscriptionsCategoryId = result.insertId;
      console.log(`✅ Created subscriptions category ID: ${subscriptionsCategoryId}`);
    } else {
      subscriptionsCategoryId = categoryRows[0].id;
      console.log(`✅ Found subscriptions category ID: ${subscriptionsCategoryId}`);
    }

    // Clear existing PS+ subscriptions
    const [deleteResult] = await connection.execute(
      'DELETE FROM products WHERE category_slug = ? AND name LIKE ?',
      ['subscriptions', '%PlayStation Plus%']
    );
    console.log(`🗑️  Cleared ${deleteResult.affectedRows} existing PS+ subscriptions`);

    // Insert PS+ subscription plans
    let insertedCount = 0;
    for (const plan of psPlusPlans) {
      const productId = `subscription-${plan.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const [result] = await connection.execute(`
        INSERT INTO products (
          id, name, category_slug, sub_category_slug, price, cost, stock, image, 
          description, attributes, digital_items, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        productId,
        plan.name,
        'subscriptions',
        'ps-plus',
        plan.price,
        plan.price * 0.8, // cost as 80% of price for subscriptions
        999, // Unlimited stock for digital subscriptions
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/PlayStation_Plus_logo.svg/2560px-PlayStation_Plus_logo.svg.png',
        plan.description,
        JSON.stringify({
          billing_cycle: plan.billing_cycle,
          duration_months: plan.duration_months,
          max_concurrent_users: plan.max_concurrent_users,
          is_subscription: plan.is_subscription,
          is_active: plan.is_active,
          tier: plan.tier,
          features: plan.features,
          benefits: plan.benefits,
          rating: 4.5,
          platform: 'PS5, PS4',
          developer: 'Sony Interactive Entertainment',
          publisher: 'Sony Interactive Entertainment',
          tags: ['subscription', 'gaming', 'online', 'digital', plan.tier],
          is_digital: true,
          has_variants: false
        }),
        JSON.stringify({
          subscription_type: plan.tier,
          billing_cycle: plan.billing_cycle,
          duration_months: plan.duration_months,
          auto_renewal: true,
          platform_access: ['PS5', 'PS4'],
          features: plan.features,
          download_url: null,
          license_key: null,
          file_size: null
        })
      ]);

      if (result.affectedRows > 0) {
        insertedCount++;
        console.log(`✅ Inserted: ${plan.name} (${plan.billing_cycle})`);
      }
    }

    // Commit transaction
    await connection.commit();
    console.log('\n✅ Transaction committed successfully!');

    console.log(`\n💳 PS+ Subscription Seeding Complete!`);
    console.log(`📊 Total plans inserted: ${insertedCount}/${psPlusPlans.length}`);
    console.log(`💰 Price range: $${Math.min(...psPlusPlans.map(p => p.price))} - $${Math.max(...psPlusPlans.map(p => p.price))}`);
    console.log(`🎯 Tiers: Essential, Extra, Premium`);
    console.log(`⚡ Annual savings: Up to $120/year`);

    // Display plan comparison
    console.log(`\n📋 Plan Comparison:`);
    psPlusPlans.forEach(plan => {
      const monthly = plan.billing_cycle === 'monthly' ? plan.price : (plan.price / 12).toFixed(2);
      console.log(`   ${plan.name.padEnd(35)} | $${monthly}/mo | ${plan.billing_cycle.padEnd(7)} | ${plan.tier.toUpperCase()}`);
    });

  } catch (error) {
    console.error('\n❌ Error seeding PS+ subscriptions:', error.message);
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
seedPSPlus();
