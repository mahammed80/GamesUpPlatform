const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const paytabs = require('./services/paytabs');
const oto = require('./services/oto');

// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '..', '.env');
const localEnvPath = path.resolve(__dirname, '..', '.env.local');

console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

// Try to load local development overrides if they exist
if (fs.existsSync(localEnvPath)) {
  console.log('🏠 Loading local development overrides from .env.local');
  dotenv.config({ path: localEnvPath, override: true });
}

if (result.error) {
  console.error('Dotenv error:', result.error);
} else {
  console.log('✅ .env loaded successfully');
}

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Serve static files from Vite's build directory
// In the new structure, build output is in ../public/
const publicPath = path.join(__dirname, '../public');
console.log('Serving static files from:', publicPath);

// Check if public exists, if not, don't serve frontend in development
let finalPublicPath = publicPath;

if (!fs.existsSync(publicPath)) {
  console.log('Public directory not found - frontend not available. Run "npm run build" first.');
  // In development without build, we don't serve static files
  // Vite dev server will handle the frontend
}

// Configure static file serving with proper MIME types - only if public exists
if (fs.existsSync(publicPath)) {
  console.log('Static file serving enabled for:', publicPath);
  
  // Set MIME types for JavaScript modules
  express.static.mime.define({
    'application/javascript': ['js', 'mjs']
  });
  
  app.use(express.static(finalPublicPath, {
    setHeaders: (res, filePath) => {
      console.log('Serving static file:', filePath);
      // Force correct MIME types for JavaScript modules
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      // Enable caching for static assets
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));
} else {
  console.log('Public directory not found, static file serving disabled');
}

// Additional route to ensure JavaScript files get correct MIME type
if (fs.existsSync(publicPath)) {
  app.get('*.js', (req, res, next) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    next();
  });
  
  app.get('*.mjs', (req, res, next) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    next();
  });
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Allow all by default, or restrict to specific domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve uploads with proper MIME types
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

// Database connection - support both local and production
const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST !== 'localhost';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database!');
    console.log(`📍 Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`👤 User: ${process.env.DB_USER || 'undefined'}`);
    console.log(`💾 Database: ${process.env.DB_NAME || 'undefined'}`);
    const [rows] = await connection.query('SELECT NOW() as now');
    console.log('⏰ Database Time:', rows[0].now);
    connection.release();
  } catch (err) {
    console.error('❌ Error connecting to database:', err.message);
    if (process.env.DB_HOST !== 'localhost') {
      console.log('💡 Note: Production database connection may only work on Hostinger servers');
    }
  }
})();

// Basic Routes to mimic the Supabase Function structure
// This allows for a smoother transition

const FUNCTION_NAME = process.env.VITE_SUPABASE_FUNCTION_NAME || 'make-server-f6f1fb51';
const BASE_PATH = `/functions/v1/${FUNCTION_NAME}`;

// Health check
app.get(`${BASE_PATH}/health`, async (req, res) => {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_NAME: process.env.DB_NAME
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_NAME: process.env.DB_NAME
      }
    });
  }
});

// Simple root health check
app.get('/', (req, res) => {
  res.json({
    message: 'GamesUp Platform API is running',
    status: 'active',
    timestamp: new Date().toISOString(),
    health: `${BASE_PATH}/health`
  });
});

// Simple ping endpoint (no dependencies)
app.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform
  });
});

// Upload Route
app.post(`${BASE_PATH}/upload`, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Example Auth Route (Placeholder)
app.post(`${BASE_PATH}/auth/login`, async (req, res) => {
  const { email, password } = req.body;

  console.log(`Login attempt for ${email}`);

  try {
    const [rows] = await pool.query(`
      SELECT u.*, r.permissions 
      FROM users u 
      LEFT JOIN roles r ON u.role = r.name 
      WHERE u.email = ?
    `, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Parse permissions
    const permissions = user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : {};

    // Generate JWT
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: permissions,
        user_metadata: { name: user.name }
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return session in Supabase-like format
    res.json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 86400,
      refresh_token: 'not_implemented',
      user: {
        id: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: user.email,
        user_metadata: {
          name: user.name,
          role: user.role,
          permissions: permissions
        },
        app_metadata: {
          provider: 'email',
          providers: ['email']
        }
      },
      session: {
        access_token: token,
        token_type: 'bearer',
        expires_in: 86400,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: permissions
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer Signup
app.post(`${BASE_PATH}/customer/signup`, async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Check if user exists
    const [existing] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO customers (email, password_hash, name, phone) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, phone]
    );

    const user = { id: result.insertId, email, name, phone };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      session: {
        access_token: token,
        user
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Customer Login
app.post(`${BASE_PATH}/customer/login`, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      session: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Customer Orders (Get)
app.get(`${BASE_PATH}/customer-orders`, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Join with products to get images
    const [rows] = await pool.query(`
      SELECT o.*, p.image 
      FROM orders o 
      LEFT JOIN products p ON o.product_name = p.name 
      WHERE o.customer_email = ? 
      ORDER BY o.date DESC
    `, [email]);

    // Group by order_number
    const ordersMap = new Map();

    rows.forEach(row => {
      const orderNumber = row.order_number || `ORD-${row.id}`; // Fallback if order_number is missing

      if (!ordersMap.has(orderNumber)) {
        ordersMap.set(orderNumber, {
          id: orderNumber,
          orderNumber: orderNumber,
          date: row.date,
          status: row.status || 'pending',
          total: 0,
          items: [],
          deliveryMethod: 'Standard Shipping', // Default as we don't store it yet
          shippingAddress: { // Default/Placeholder as we don't store it yet
            street: 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: 'N/A',
            country: 'USA'
          }
        });
      }

      const order = ordersMap.get(orderNumber);
      const price = typeof row.amount === 'string' ? parseFloat(row.amount.replace('$', '')) : row.amount;

      order.total += price;
      order.items.push({
        name: row.product_name,
        price: price,
        quantity: 1, // Assumed 1 per row
        image: row.image || 'https://via.placeholder.com/150',
        digital_email: row.digital_email,
        digital_password: row.digital_password,
        digital_code: row.digital_code
      });
    });

    res.json({ orders: Array.from(ordersMap.values()) });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});



// Delivery Options
app.get(`${BASE_PATH}/delivery-options`, async (req, res) => {
  // Use OTO or fallback
  try {
    // For now, return mixed options including OTO simulation
    const otoRates = await oto.checkDelivery('Riyadh'); // Default city for general options

    const options = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: 'Delivery in 3-5 business days',
        price: 0,
        estimatedDays: '3-5 days'
      },
      ...otoRates.companies.map((c, i) => ({
        id: `oto_${i}`,
        name: `${c.name} (via OTO)`,
        description: `Delivery in ${c.time}`,
        price: c.price,
        estimatedDays: c.time
      }))
    ];

    res.json({ deliveryOptions: options });
  } catch (e) {
    // Fallback
    res.json({
      deliveryOptions: [
        {
          id: 'standard',
          name: 'Standard Shipping',
          description: 'Delivery in 3-5 business days',
          price: 0,
          estimatedDays: '3-5 days'
        }
      ]
    });
  }
});

// PayTabs Payment Creation
app.post(`${BASE_PATH}/payment/create`, async (req, res) => {
  try {
    const { orderNumber, customerName, customerEmail, total, shippingAddress, items } = req.body;

    // Construct return URL (Frontend Callback)
    const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
    // Remove trailing slash if present
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const returnUrl = `${baseUrl}/checkout`;

    const payment = await paytabs.createPaymentPage({
      orderNumber,
      customerName,
      customerEmail,
      total,
      shippingAddress,
      items
    }, returnUrl);

    res.json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Verify Payment and Create Shipment
app.post(`${BASE_PATH}/payment/verify`, async (req, res) => {
  try {
    const { tranRef, orderNumber } = req.body;

    // 1. Verify Payment
    const verification = await paytabs.verifyPayment(tranRef);

    if (verification.success) {
      // 2. Update Order Status
      await pool.query(
        'UPDATE orders SET status = ? WHERE order_number = ?',
        ['paid', orderNumber]
      );

      // 3. Get Order Details for Shipment
      // In a real app, we'd fetch from DB. Here we might need to pass details or fetch them.
      // Fetching from DB:
      const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
      if (orderRows.length > 0) {
        // Construct order object for OTO
        const firstRow = orderRows[0];
        // We need shipping address which we might not have stored fully in `orders` table in the simple schema
        // But let's assume we can proceed or skip OTO if data missing

        // Ideally, we should have stored the full address. 
        // For now, let's assume we can't do full OTO automation without address in DB.
        // But we can try if we passed it in body, or just log it.
      }

      // Return success
      res.json({ success: true, message: 'Payment verified and order processed' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Products Route
app.get(`${BASE_PATH}/products`, async (req, res) => {
  try {
    const category = req.query.category;
    const id = req.query.id;
    let query = 'SELECT * FROM products';
    const params = [];

    if (id) {
      query += ' WHERE id = ?';
      params.push(id);
    } else if (category && category !== 'All') {
      query += ' WHERE category_slug = ?';
      params.push(category.toLowerCase());
    }

    const [rows] = await pool.query(query, params);

    // Transform data to match frontend expectations
    const products = rows.map(product => {
      let digitalItems = [];
      let attributes = {};

      try {
        digitalItems = typeof product.digital_items === 'string'
          ? JSON.parse(product.digital_items)
          : (product.digital_items || []);
      } catch (e) {
        digitalItems = [];
      }

      try {
        attributes = typeof product.attributes === 'string'
          ? JSON.parse(product.attributes)
          : (product.attributes || {});
      } catch (e) {
        attributes = {};
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: typeof product.price === 'string' ? parseFloat(product.price.replace('$', '')) : product.price,
        cost: typeof product.cost === 'string' ? parseFloat(product.cost.replace('$', '')) : (product.cost || 0),
        stock: product.stock,
        status: product.stock > 10 ? 'In Stock' : 'Low Stock',
        image: product.image,
        category: product.category_slug ? product.category_slug.charAt(0).toUpperCase() + product.category_slug.slice(1) : 'Games',
        categorySlug: product.category_slug,
        subCategory: product.sub_category_slug,
        attributes,
        digitalItems
      };
    });

    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create Product
app.post(`${BASE_PATH}/products`, async (req, res) => {
  try {
    const { name, category, subCategory, price, cost, stock, image, description, attributes, digitalItems } = req.body;

    // Clean price and cost (remove $ if present)
    const priceValue = typeof price === 'string' ? parseFloat(price.replace('$', '')) : price;
    const costValue = typeof cost === 'string' ? parseFloat(cost.replace('$', '')) : (cost || 0);
    const categorySlug = category ? category.toLowerCase() : 'games';
    const subCategorySlug = subCategory || null;
    const digitalItemsJson = JSON.stringify(digitalItems || []);
    const attributesJson = JSON.stringify(attributes || {});

    const [result] = await pool.query(
      'INSERT INTO products (name, category_slug, sub_category_slug, price, cost, stock, image, description, attributes, digital_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, categorySlug, subCategorySlug, priceValue, costValue, stock, image, description || '', attributesJson, digitalItemsJson]
    );

    res.json({ id: result.insertId, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update Product
app.put(`${BASE_PATH}/products/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, subCategory, price, cost, stock, image, description, attributes, digitalItems } = req.body;

    const priceValue = typeof price === 'string' ? parseFloat(price.replace('$', '')) : price;
    const costValue = typeof cost === 'string' ? parseFloat(cost.replace('$', '')) : (cost || 0);
    const categorySlug = category ? category.toLowerCase() : 'games';
    const subCategorySlug = subCategory || null;
    const digitalItemsJson = JSON.stringify(digitalItems || []);
    const attributesJson = JSON.stringify(attributes || {});

    await pool.query(
      'UPDATE products SET name=?, category_slug=?, sub_category_slug=?, price=?, cost=?, stock=?, image=?, description=?, attributes=?, digital_items=? WHERE id=?',
      [name, categorySlug, subCategorySlug, priceValue, costValue, stock, image, description || '', attributesJson, digitalItemsJson, id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete Product
app.delete(`${BASE_PATH}/products/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// HR Routes
app.get(`${BASE_PATH}/hr/employees`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Settings Routes
app.get(`${BASE_PATH}/settings`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings');
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});

    // Ensure default values if empty
    if (!settings.currency_code) settings.currency_code = 'USD';
    if (!settings.currency_symbol) settings.currency_symbol = '$';
    if (!settings.tax_rate) settings.tax_rate = '8.5';

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return defaults on error (e.g. table missing)
    res.json({
      currency_code: 'USD',
      currency_symbol: '$',
      tax_rate: '8.5'
    });
  }
});

app.post(`${BASE_PATH}/settings`, async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      const val = typeof value === 'string' ? value : String(value);
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, val, val]
      );
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Orders Route
app.get(`${BASE_PATH}/orders`, async (req, res) => {
  try {
    const { status, search, email } = req.query;
    let query = 'SELECT * FROM orders';
    const params = [];
    const conditions = [];

    if (status && status !== 'All') {
      conditions.push('status = ?');
      params.push(status.toLowerCase());
    }

    if (email) {
      conditions.push('customer_email = ?');
      params.push(email);
    }

    if (search) {
      conditions.push('(order_number LIKE ? OR customer_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';

    const [rows] = await pool.query(query, params);

    // Transform to match frontend expectations if needed, but schema matches closely
    const orders = rows.map(order => ({
      id: order.id, // Primary key
      orderNumber: order.order_number,
      customer: order.customer_name,
      email: order.customer_email,
      product: order.product_name,
      date: new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: order.status,
      amount: order.amount,
      items: 1, // This represents one line item
      payment_method: order.payment_method,
      payment_proof: order.payment_proof,
      digital_email: order.digital_email,
      digital_password: order.digital_password,
      digital_code: order.digital_code,
      inventory_id: order.inventory_id
    }));

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update Order
app.put(`${BASE_PATH}/orders/:id`, async (req, res) => {
  try {
    const { id } = req.params; // Primary key
    const { customer, email, product, digital_email, digital_password, digital_code, inventory_id, status } = req.body;

    // Construct update query dynamically
    let query = 'UPDATE orders SET ';
    const params = [];
    const updates = [];

    if (customer !== undefined) { updates.push('customer_name = ?'); params.push(customer); }
    if (email !== undefined) { updates.push('customer_email = ?'); params.push(email); }
    if (product !== undefined) { updates.push('product_name = ?'); params.push(product); }
    if (digital_email !== undefined) { updates.push('digital_email = ?'); params.push(digital_email); }
    if (digital_password !== undefined) { updates.push('digital_password = ?'); params.push(digital_password); }
    if (digital_code !== undefined) { updates.push('digital_code = ?'); params.push(digital_code); }
    if (inventory_id !== undefined) { updates.push('inventory_id = ?'); params.push(inventory_id); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) {
      return res.json({ message: 'No changes provided' });
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// System Categories Routes
app.get(`${BASE_PATH}/system/categories`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY display_order ASC');
    const categories = rows.map(cat => ({
      ...cat,
      isActive: Boolean(cat.is_active),
      displayOrder: cat.display_order,
      createdAt: cat.created_at
    }));
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post(`${BASE_PATH}/system/categories`, async (req, res) => {
  try {
    const { name, slug, icon, displayOrder, isActive } = req.body;
    await pool.query(
      'INSERT INTO categories (name, slug, icon, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, slug, icon, displayOrder || 0, isActive]
    );
    res.json({ message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put(`${BASE_PATH}/system/categories/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, displayOrder, isActive } = req.body;
    await pool.query(
      'UPDATE categories SET name=?, slug=?, icon=?, display_order=?, is_active=? WHERE id=?',
      [name, slug, icon, displayOrder, isActive, id]
    );
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete(`${BASE_PATH}/system/categories/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// System Sub-Categories Routes
app.get(`${BASE_PATH}/system/subcategories`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sub_categories ORDER BY display_order ASC');
    const subCategories = rows.map(sub => ({
      ...sub,
      categoryId: sub.category_id,
      isActive: Boolean(sub.is_active),
      displayOrder: sub.display_order,
      createdAt: sub.created_at
    }));
    res.json(subCategories);
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    res.status(500).json({ error: 'Failed to fetch sub-categories' });
  }
});

app.post(`${BASE_PATH}/system/subcategories`, async (req, res) => {
  try {
    const { categoryId, name, description, slug, displayOrder, isActive } = req.body;
    await pool.query(
      'INSERT INTO sub_categories (category_id, name, description, slug, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [categoryId, name, description, slug, displayOrder || 0, isActive]
    );
    res.json({ message: 'Sub-category created successfully' });
  } catch (error) {
    console.error('Error creating sub-category:', error);
    res.status(500).json({ error: 'Failed to create sub-category' });
  }
});

app.put(`${BASE_PATH}/system/subcategories/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, slug, displayOrder, isActive } = req.body;
    await pool.query(
      'UPDATE sub_categories SET category_id=?, name=?, description=?, slug=?, display_order=?, is_active=? WHERE id=?',
      [categoryId, name, description, slug, displayOrder, isActive, id]
    );
    res.json({ message: 'Sub-category updated successfully' });
  } catch (error) {
    console.error('Error updating sub-category:', error);
    res.status(500).json({ error: 'Failed to update sub-category' });
  }
});

app.delete(`${BASE_PATH}/system/subcategories/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sub_categories WHERE id = ?', [id]);
    res.json({ message: 'Sub-category deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub-category:', error);
    res.status(500).json({ error: 'Failed to delete sub-category' });
  }
});

// System Attributes Routes
app.get(`${BASE_PATH}/system/attributes`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM product_attributes ORDER BY display_order ASC');
    const attributes = rows.map(attr => ({
      ...attr,
      isRequired: Boolean(attr.is_required),
      isActive: Boolean(attr.is_active),
      displayOrder: attr.display_order,
      createdAt: attr.created_at,
      options: typeof attr.options === 'string' ? JSON.parse(attr.options) : attr.options
    }));
    res.json(attributes);
  } catch (error) {
    console.error('Error fetching attributes:', error);
    res.status(500).json({ error: 'Failed to fetch attributes' });
  }
});

app.post(`${BASE_PATH}/system/attributes`, async (req, res) => {
  try {
    const { name, type, options, isRequired, displayOrder, isActive } = req.body;
    await pool.query(
      'INSERT INTO product_attributes (name, type, options, is_required, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, JSON.stringify(options), isRequired, displayOrder || 0, isActive]
    );
    res.json({ message: 'Attribute created successfully' });
  } catch (error) {
    console.error('Error creating attribute:', error);
    res.status(500).json({ error: 'Failed to create attribute' });
  }
});

app.put(`${BASE_PATH}/system/attributes/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, options, isRequired, displayOrder, isActive } = req.body;
    await pool.query(
      'UPDATE product_attributes SET name=?, type=?, options=?, is_required=?, display_order=?, is_active=? WHERE id=?',
      [name, type, JSON.stringify(options), isRequired, displayOrder, isActive, id]
    );
    res.json({ message: 'Attribute updated successfully' });
  } catch (error) {
    console.error('Error updating attribute:', error);
    res.status(500).json({ error: 'Failed to update attribute' });
  }
});

app.delete(`${BASE_PATH}/system/attributes/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM product_attributes WHERE id = ?', [id]);
    res.json({ message: 'Attribute deleted successfully' });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    res.status(500).json({ error: 'Failed to delete attribute' });
  }
});

// Public Products Route (for POS)
app.get(`${BASE_PATH}/public/products`, async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (category && category !== 'all') { // Note: 'all' lowercase to match slug
      conditions.push('category_slug = ?');
      params.push(category.toLowerCase());
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await pool.query(query, params);

    // Transform data to match POS expectations (price as number)
    const products = rows.map(product => {
      let attributes = {};
      try {
        attributes = typeof product.attributes === 'string'
          ? JSON.parse(product.attributes)
          : (product.attributes || {});
      } catch (e) {
        attributes = {};
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: typeof product.price === 'string' ? parseFloat(product.price.replace('$', '')) : product.price,
        stock: product.stock,
        image: product.image,
        categorySlug: product.category_slug || 'games',
        attributes
      };
    });

    res.json({ products });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Banners Route
app.get(`${BASE_PATH}/banners`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY position ASC');
    const banners = rows.map(banner => ({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.image_url,
      link: banner.link,
      position: banner.position,
      isActive: Boolean(banner.is_active),
      startDate: banner.start_date,
      endDate: banner.end_date
    }));
    res.json({ banners });
  } catch (error) {
    // Return empty array if table doesn't exist or other error, to prevent frontend crash
    console.error('Error fetching banners:', error);
    res.json({ banners: [] });
  }
});

app.post(`${BASE_PATH}/banners`, async (req, res) => {
  try {
    const { title, imageUrl, link, position, isActive, startDate, endDate } = req.body;
    const [result] = await pool.query(
      'INSERT INTO banners (title, image_url, link, position, is_active, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, imageUrl, link, position, isActive, startDate || null, endDate || null]
    );
    res.json({ id: result.insertId, message: 'Banner created successfully' });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Failed to create banner' });
  }
});

app.put(`${BASE_PATH}/banners/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, link, position, isActive, startDate, endDate } = req.body;
    await pool.query(
      'UPDATE banners SET title=?, image_url=?, link=?, position=?, is_active=?, start_date=?, end_date=? WHERE id=?',
      [title, imageUrl, link, position, isActive, startDate || null, endDate || null, id]
    );
    res.json({ message: 'Banner updated successfully' });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

app.delete(`${BASE_PATH}/banners/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM banners WHERE id = ?', [id]);
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

app.get(`${BASE_PATH}/hr/attendance`, async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT a.*, e.name as employee_name, e.role as employee_role, e.image as employee_image 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.id
    `;
    const params = [];

    if (date) {
      query += ' WHERE a.date = ?';
      params.push(date);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Setup Accounts (Placeholder to silence frontend error)
app.post(`${BASE_PATH}/setup-accounts`, (req, res) => {
  res.json({
    message: 'Accounts setup logic handled by seeders',
    credentials: {
      admin: {
        email: 'admin@gamesup.com',
        password: 'password123'
      },
      manager: {
        email: 'manager@gamesup.com',
        password: 'password123'
      },
      staff: {
        email: 'staff@gamesup.com',
        password: 'password123'
      }
    }
  });
});

// Roles Routes
app.get(`${BASE_PATH}/roles`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM roles');
    // Parse permissions JSON
    const roles = rows.map(role => ({
      ...role,
      permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions
    }));
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.post(`${BASE_PATH}/roles`, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    await pool.query(
      'INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)',
      [name, description, JSON.stringify(permissions)]
    );
    res.json({ message: 'Role created successfully' });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Admin User Creation (for assigning roles)
app.get(`${BASE_PATH}/admin/users`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, name, role, job_title, phone, avatar, identity_document, created_at FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post(`${BASE_PATH}/admin/users`, async (req, res) => {
  try {
    const { email, password, name, role, job_title, phone, avatar, identity_document } = req.body;

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await pool.query(
      'INSERT INTO users (email, password_hash, name, role, job_title, phone, avatar, identity_document) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, passwordHash, name, role, job_title, phone, avatar, identity_document]
    );

    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put(`${BASE_PATH}/admin/users/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, role, job_title, phone, avatar, identity_document } = req.body;

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = 'UPDATE users SET email = ?, name = ?, role = ?, job_title = ?, phone = ?, avatar = ?, identity_document = ?';
    let params = [email, name, role, job_title, phone, avatar, identity_document];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      query += ', password_hash = ?';
      params.push(passwordHash);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete(`${BASE_PATH}/admin/users/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Settings Routes
app.get(`${BASE_PATH}/settings`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings');
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});

    // Ensure defaults
    if (!settings.currency_code) settings.currency_code = 'USD';
    if (!settings.currency_symbol) settings.currency_symbol = '$';
    if (!settings.tax_rate) settings.tax_rate = '8.5';

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post(`${BASE_PATH}/settings`, async (req, res) => {
  try {
    const settings = req.body; // { currency_code: 'EGP', currency_symbol: 'E£', tax_rate: '10' }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const [key, value] of Object.entries(settings)) {
        await connection.query(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, String(value), String(value)]
        );
      }

      await connection.commit();
      res.json({ message: 'Settings updated successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Create Customer Order
app.post(`${BASE_PATH}/customer-orders`, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customerEmail, customerName, items, total, deliveryMethod, shippingAddress, paymentMethod, paymentProof } = req.body;
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const purchasedItems = [];

    // Determine initial status based on payment method
    let status = 'pending';
    if (paymentMethod === 'instapay') {
      status = 'pending_approval';
    } else if (paymentMethod === 'cod') {
      status = 'pending';
    }

    for (const item of items) {
      // Handle quantity
      for (let i = 0; i < item.quantity; i++) {
        // Fetch fresh product data to ensure concurrency safety (simplistic locking via update later)
        const [products] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [item.id]);

        if (products.length === 0) {
          throw new Error(`Product ${item.name} not found`);
        }

        const product = products[0];
        let digitalItems = [];
        try {
          digitalItems = typeof product.digital_items === 'string'
            ? JSON.parse(product.digital_items)
            : (product.digital_items || []);
        } catch (e) {
          digitalItems = [];
        }

        // Check stock
        if (digitalItems.length === 0) {
          // If no digital items, we might just record the order without code (or fail?)
          // For now, let's assume we proceed but mark as "Pending Delivery" or similar if no code
          // But user specifically asked for code. Let's try to get one.
          // If stock is 0, fail.
          if (product.stock <= 0) {
            throw new Error(`Product ${item.name} is out of stock`);
          }
        }

        // Pop a digital item
        const assignedItem = digitalItems.length > 0 ? digitalItems.shift() : null;

        // Update product
        const newStock = Math.max(0, product.stock - 1);

        await connection.query(
          'UPDATE products SET stock = ?, digital_items = ? WHERE id = ?',
          [newStock, JSON.stringify(digitalItems), product.id]
        );

        // Insert into orders
        await connection.query(
          `INSERT INTO orders (
            order_number, customer_name, customer_email, product_name, 
            amount, cost, status, date,
            digital_email, digital_password, digital_code,
            payment_method, payment_proof
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
          [
            orderNumber,
            customerName,
            customerEmail,
            product.name,
            item.price,
            product.cost || 0,
            status,
            assignedItem?.email || null,
            assignedItem?.password || null,
            assignedItem?.code || null,
            paymentMethod || 'credit_card',
            paymentProof || null
          ]
        );

        purchasedItems.push({
          name: product.name,
          image: product.image,
          price: item.price,
          digitalItem: assignedItem
        });
      }
    }

    await connection.commit();

    res.json({
      message: 'Order placed successfully',
      orderNumber,
      purchasedItems
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  } finally {
    connection.release();
  }
});

// Get Customers (Admin)
app.get(`${BASE_PATH}/admin/customers`, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.email, 
        c.phone, 
        c.created_at,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.email = o.customer_email
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    const customers = rows.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || 'N/A',
      location: 'N/A', // We don't store location in customers table yet
      orders: c.orders_count,
      spent: typeof c.total_spent === 'string' ? parseFloat(c.total_spent) : c.total_spent,
      status: c.total_spent > 1000 ? 'VIP' : 'Regular', // Simple logic for status
      joinDate: new Date(c.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`
    }));

    res.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    // If customers table doesn't exist yet, return empty
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ customers: [] });
    }
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get Sold Products (Admin)
app.get(`${BASE_PATH}/admin/sold-products`, async (req, res) => {
  try {
    // Fetch orders that have digital items assigned
    const [rows] = await pool.query(`
      SELECT * FROM orders 
      WHERE digital_email IS NOT NULL 
         OR digital_password IS NOT NULL 
         OR digital_code IS NOT NULL
      ORDER BY date DESC
    `);

    const soldProducts = rows.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      productName: order.product_name,
      price: order.amount,
      date: order.date,
      digitalItem: {
        email: order.digital_email,
        password: order.digital_password,
        code: order.digital_code
      }
    }));

    res.json(soldProducts);
  } catch (error) {
    console.error('Error fetching sold products:', error);
    res.status(500).json({ error: 'Failed to fetch sold products' });
  }
});

// Fallback for client-side routing - serve index.html for all non-API routes (only if public exists)
app.get('*', (req, res) => {
  if (fs.existsSync(publicPath)) {
    const indexPath = path.join(finalPublicPath, 'index.html');
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend not built. Run "npm run build" first.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 Base URL: http://localhost:${port}${BASE_PATH}`);
  console.log(`❤️  Health check: http://localhost:${port}/`);
  console.log(`🏓 Ping test: http://localhost:${port}/ping`);
  console.log(`🔍 Detailed health: http://localhost:${port}${BASE_PATH}/health`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️  Port ${port} is already in use`);
  } else if (err.code === 'EACCES') {
    console.error(`⚠️  Permission denied to bind to port ${port}`);
  } else {
    console.error(`⚠️  Error code: ${err.code}`);
  }
  process.exit(1);
});
