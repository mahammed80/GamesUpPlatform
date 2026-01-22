const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

// Database connection
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
    console.log('Connected to MySQL Database!');
    const [rows] = await connection.query('SELECT NOW() as now');
    console.log('Database Time:', rows[0].now);
    connection.release();
  } catch (err) {
    console.error('Error connecting to database:', err.message);
  }
})();

// Basic Routes to mimic the Supabase Function structure
// This allows for a smoother transition

const FUNCTION_NAME = process.env.VITE_SUPABASE_FUNCTION_NAME || 'make-server-f6f1fb51';
const BASE_PATH = `/functions/v1/${FUNCTION_NAME}`;

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Games Up Server is running' });
});

app.get(`${BASE_PATH}/health`, (req, res) => {
  res.json({ status: 'ok', message: 'Games Up Server is running' });
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

// Products Route
app.get(`${BASE_PATH}/products`, async (req, res) => {
  try {
    const category = req.query.category;
    let query = 'SELECT * FROM products';
    const params = [];

    if (category && category !== 'All') {
      query += ' WHERE category_slug = ?';
      params.push(category.toLowerCase());
    }

    const [rows] = await pool.query(query, params);
    
    // Transform data to match frontend expectations
    const products = rows.map(product => {
      let digitalItems = [];
      try {
        digitalItems = typeof product.digital_items === 'string' 
          ? JSON.parse(product.digital_items) 
          : (product.digital_items || []);
      } catch (e) {
        digitalItems = [];
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: `$${product.price}`,
        cost: `$${product.cost || 0}`,
        stock: product.stock,
        status: product.stock > 10 ? 'In Stock' : 'Low Stock',
        image: product.image,
        category: product.category_slug ? product.category_slug.charAt(0).toUpperCase() + product.category_slug.slice(1) : 'Games',
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
    const { name, category, price, cost, stock, image, description, digitalItems } = req.body;
    
    // Clean price and cost (remove $ if present)
    const priceValue = typeof price === 'string' ? parseFloat(price.replace('$', '')) : price;
    const costValue = typeof cost === 'string' ? parseFloat(cost.replace('$', '')) : (cost || 0);
    const categorySlug = category ? category.toLowerCase() : 'games';
    const digitalItemsJson = JSON.stringify(digitalItems || []);

    const [result] = await pool.query(
      'INSERT INTO products (name, category_slug, price, cost, stock, image, description, digital_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, categorySlug, priceValue, costValue, stock, image, description || '', digitalItemsJson]
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
    const { name, category, price, cost, stock, image, description, digitalItems } = req.body;
    
    const priceValue = typeof price === 'string' ? parseFloat(price.replace('$', '')) : price;
    const costValue = typeof cost === 'string' ? parseFloat(cost.replace('$', '')) : (cost || 0);
    const categorySlug = category ? category.toLowerCase() : 'games';
    const digitalItemsJson = JSON.stringify(digitalItems || []);

    await pool.query(
      'UPDATE products SET name=?, category_slug=?, price=?, cost=?, stock=?, image=?, description=?, digital_items=? WHERE id=?',
      [name, categorySlug, priceValue, costValue, stock, image, description || '', digitalItemsJson, id]
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

// Orders Route
app.get(`${BASE_PATH}/orders`, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM orders';
    const params = [];
    const conditions = [];

    if (status && status !== 'All') {
      conditions.push('status = ?');
      params.push(status.toLowerCase());
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
      id: order.order_number, // Frontend uses order_number as id
      customer: order.customer_name,
      email: order.customer_email,
      product: order.product_name,
      date: new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: order.status,
      amount: `$${order.amount}`,
      items: 1, // Mocked for now, or could be derived
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

// System Categories Route
app.get(`${BASE_PATH}/system/categories`, (req, res) => {
  const categories = [
    { id: '1', name: 'All', slug: 'all', icon: 'Grid', isActive: true },
    { id: '2', name: 'Games', slug: 'games', icon: 'Gamepad', isActive: true },
    { id: '3', name: 'Consoles', slug: 'consoles', icon: 'Monitor', isActive: true },
    { id: '4', name: 'Accessories', slug: 'accessories', icon: 'Headphones', isActive: true },
  ];
  res.json(categories);
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
    const products = rows.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: typeof product.price === 'string' ? parseFloat(product.price.replace('$', '')) : product.price,
      stock: product.stock,
      image: product.image,
      categorySlug: product.category_slug || 'games'
    }));

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
app.post(`${BASE_PATH}/admin/users`, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, role]
    );
    
    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
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

    const { customerEmail, customerName, items, total, deliveryMethod, shippingAddress } = req.body;
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const purchasedItems = [];

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
        const newStatus = newStock > 10 ? 'In Stock' : 'Low Stock';
        
        await connection.query(
          'UPDATE products SET stock = ?, digital_items = ?, status = ? WHERE id = ?',
          [newStock, JSON.stringify(digitalItems), newStatus, product.id]
        );

        // Insert into orders
        await connection.query(
          `INSERT INTO orders (
            order_number, customer_name, customer_email, product_name, 
            amount, cost, status, date,
            digital_email, digital_password, digital_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
          [
            orderNumber, 
            customerName, 
            customerEmail, 
            product.name, 
            item.price, 
            product.cost || 0,
            'Completed',
            assignedItem?.email || null,
            assignedItem?.password || null,
            assignedItem?.code || null
          ]
        );

        purchasedItems.push({
          name: product.name,
          image: product.image,
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Base URL: http://localhost:${port}${BASE_PATH}`);
});
