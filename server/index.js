const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Logging Utility
const logFile = path.join(__dirname, 'server_error.log');
const logError = (context, error) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [${context}] ${error.message}\nStack: ${error.stack}\n\n`;
    console.error(`[${context}]`, error);
    try {
        fs.appendFileSync(logFile, message);
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
};

// Load environment variables
// Priority: 1. server/.env (local/production specific), 2. root .env (shared/dev)
const serverEnvPath = path.resolve(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '../.env');

let envResult;

if (fs.existsSync(serverEnvPath)) {
  console.log('✅ Loading .env from server directory:', serverEnvPath);
  envResult = dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  console.log('⚠️  Server .env not found, falling back to root .env:', rootEnvPath);
  envResult = dotenv.config({ path: rootEnvPath });
} else {
  console.log('❌ No .env file found!');
  envResult = { error: new Error('No .env file found') };
}

if (envResult.error) {
  console.error('Dotenv error:', envResult.error);
} else {
  console.log('✅ Environment variables loaded successfully');
}

const paytabs = require('./services/paytabs');
const oto = require('./services/oto');
const emailService = require('./services/email');

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Verify SMTP Connection
emailService.verifyConnection();

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
app.use(express.urlencoded({ extended: true }));

// Serve uploads with proper MIME types
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    }
  }
}));

// Handle missing files in uploads directory explicitly to avoid falling back to index.html or other routes
app.use('/uploads', (req, res) => {
  res.status(404).send('File not found');
});

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use absolute path to ensure uploads go to server/uploads regardless of CWD
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();
    // Use clean filename: timestamp-random.ext
    // This avoids double extensions and special characters in filenames
    cb(null, uniqueSuffix + ext);
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
})

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
  queueLimit: 0,
  multipleStatements: true
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
    console.error('Error Code:', err.code);
    if (process.env.DB_HOST !== 'localhost') {
      console.log('💡 Note: Production database connection may only work on Hostinger servers');
    }
  }
})();

// Database Connection Test Route
app.get('/test-db-connection', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as val');
    connection.release();
    res.json({
      status: 'success',
      message: 'Connected to database successfully',
      config: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
      },
      test_query_result: rows[0].val
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: error.code,
      config: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
      },
      hint: 'Check if DB_PASSWORD in .env is correct and quoted if it contains special characters like #.'
    });
  }
});

// Basic Routes to mimic the Supabase Function structure
// This allows for a smoother transition

const FUNCTION_NAME = process.env.VITE_SUPABASE_FUNCTION_NAME || 'make-server-f6f1fb51';
const BASE_PATH = `/functions/v1/${FUNCTION_NAME}`;

// Email Test Route
app.post(`${BASE_PATH}/email/test`, async (req, res) => {
    const { to, subject, text, html } = req.body;
    
    if (!to) {
        return res.status(400).json({ error: 'Recipient email (to) is required' });
    }

    const result = await emailService.sendEmail(
        to, 
        subject || 'Test Email', 
        text || 'This is a test email from GamesUp Platform.', 
        html
    );

    if (result.success) {
        res.json({ message: 'Email sent successfully', messageId: result.messageId });
    } else {
        res.status(500).json({ error: 'Failed to send email', details: result.error });
    }
});

// Email Templates Endpoints
app.get(`${BASE_PATH}/email-templates`, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM email_templates ORDER BY type');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching email templates:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get(`${BASE_PATH}/email-templates/:type`, async (req, res) => {
    const { type } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM email_templates WHERE type = ?', [type]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching email template:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.put(`${BASE_PATH}/email-templates/:type`, async (req, res) => {
    const { type } = req.params;
    const { subject, body } = req.body;
    
    if (!subject || !body) {
        return res.status(400).json({ error: 'Subject and body are required' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE email_templates SET subject = ?, body = ? WHERE type = ?',
            [subject, body, type]
        );
        
        if (result.affectedRows === 0) {
            // Optionally insert if not exists, but for now we expect it to exist via seed
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json({ message: 'Template updated successfully' });
    } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

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
      errorCode: error.code,
      errorNo: error.errno,
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

// Simple Database Check Route (Easier to access)
app.get('/db-check', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT NOW() as now, VERSION() as version');
    connection.release();
    res.json({ 
      status: 'connected', 
      time: rows[0].now, 
      version: rows[0].version,
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        db: process.env.DB_NAME
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message, 
      code: error.code,
      hint: error.code === 'ER_ACCESS_DENIED_ERROR' ? 'Check DB credentials' : 'Check DB Host/Network'
    });
  }
});

// Emergency Schema Fix Route
app.get('/fix-db-schema', async (req, res) => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ error: 'Schema file not found' });
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and remove empty statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const results = [];
    const errors = [];
    
    // Get a dedicated connection for the schema update to ensure session variables work if used
    const connection = await pool.getConnection();

    try {
        // Execute statements sequentially
        for (const statement of statements) {
          try {
            await connection.query(statement);
            results.push({ statement: statement.substring(0, 50) + '...', status: 'success' });
          } catch (err) {
            // Ignore "Table already exists" (1050) or "Column already exists" (1060) or "Duplicate key" (1061/1062)
            if ([1050, 1060, 1061, 1062].includes(err.errno)) {
               results.push({ statement: statement.substring(0, 50) + '...', status: 'skipped', reason: err.message });
            } else {
               errors.push({ statement: statement.substring(0, 50) + '...', error: err.message });
            }
          }
        }
    } finally {
        connection.release();
    }
    
    res.json({ 
      status: errors.length > 0 ? 'partial_success' : 'success', 
      message: 'Database schema execution completed.',
      results: results,
      errors: errors
    });
  } catch (error) {
    console.error('Schema update failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      code: error.code 
    });
  }
});

// Fix Storage Link (Hostinger Helper)
app.get('/fix-storage-link', (req, res) => {
  try {
    // Hostinger structure: /domains/domain.com/gamesup-server (cwd) -> /domains/domain.com/public_html
    const publicHtmlPath = path.join(__dirname, '../public_html');
    const publicHtmlUploads = path.join(publicHtmlPath, 'uploads');
    const serverUploads = path.join(__dirname, 'uploads');
    
    // Check if public_html exists
    if (!fs.existsSync(publicHtmlPath)) {
      return res.status(404).json({ error: 'public_html not found at ../public_html' });
    }
    
    // Check if uploads link already exists
    if (fs.existsSync(publicHtmlUploads)) {
      const stats = fs.lstatSync(publicHtmlUploads);
      if (stats.isSymbolicLink()) {
        return res.json({ message: 'Symlink already exists', path: publicHtmlUploads });
      } else {
        return res.status(400).json({ error: 'public_html/uploads exists and is not a symlink. Please delete it first via File Manager.' });
      }
    }
    
    // Create symlink
    // We use absolute paths to be safe
    fs.symlinkSync(serverUploads, publicHtmlUploads, 'dir');
    
    res.json({ success: true, message: 'Symlink created successfully. You can now access uploads via root domain.' });
  } catch (error) {
    console.error('Symlink error:', error);
    res.status(500).json({ error: 'Failed to create symlink', details: error.message });
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
    
    // Check if we are in Hostinger environment (uploads are in root uploads/)
    // On Hostinger, backend is in /backend/ and uploads are symlinked or in /uploads/
    // The static middleware serves from __dirname/uploads
    // But the public URL might need to be https://games-up.co/uploads/filename
    
    // If PUBLIC_URL is https://games-up.co (root domain), and we serve uploads via express.static at /uploads
    // Then the URL should be https://games-up.co/uploads/filename
    // However, on Hostinger with subfolder deployment, the backend might be at https://games-up.co/functions/v1/make-server...
    // We need to ensure the returned URL is accessible publicly
    
    // FIX: If we are on production/Hostinger, we might want to return a URL that maps to the public uploads folder
    // If uploads are in public_html/uploads, they are accessible at domain.com/uploads/filename
    
    let fileUrl;
    if (process.env.NODE_ENV === 'production' || process.env.PUBLIC_URL) {
         // Production / Hostinger
         // Assume uploads are served from root domain /uploads
         // If PUBLIC_URL is the API base (e.g. domain.com/api), we might want just domain.com/uploads
         // But let's stick to the relative path or absolute path based on configuration.
         
         // Safest bet for Hostinger with shared hosting structure:
         // If we are uploading to public_html/uploads (via symlink or direct), URL is https://games-up.co/uploads/filename
         
         const domain = 'https://games-up.co'; // Hardcoded fallback or env
         fileUrl = `${domain}/uploads/${req.file.filename}`;
    } else {
         // Local development
         // Use PUBLIC_URL from env if set (e.g., https://games-up.co/api), otherwise construct from request
         // This is crucial for when the backend is mounted at a subpath (like /api)
         const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
         // Ensure no double slashes if baseUrl has trailing slash
         const finalBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
         
         fileUrl = `${finalBaseUrl}/uploads/${req.file.filename}`;
    }

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

// Setup Accounts (Missing Endpoint)
app.post(`${BASE_PATH}/setup-accounts`, async (req, res) => {
  try {
    // This endpoint seems to be for initial setup or verification
    // We can return success since we already seeded the database
    res.json({ success: true, message: 'Accounts setup verified' });
  } catch (error) {
    console.error('Setup accounts error:', error);
    res.status(500).json({ error: 'Failed to setup accounts' });
  }
});

// Store Settings
app.get(`${BASE_PATH}/settings`, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    // Ensure defaults if empty
    if (Object.keys(settings).length === 0) {
       settings.currency_code = 'USD';
       settings.currency_symbol = '$';
       settings.tax_rate = '8.5';
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  }
});

app.post(`${BASE_PATH}/settings`, async (req, res) => {
  const settings = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    for (const [key, value] of Object.entries(settings)) {
      let stringValue = value;
      if (typeof value === 'object' && value !== null) {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
      
      await connection.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, stringValue, stringValue]
      );
    }
    
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  } finally {
    connection.release();
  }
});

// Notifications
app.get(`${BASE_PATH}/notifications`, async (req, res) => {
  try {
    // Get latest 50 notifications
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post(`${BASE_PATH}/notifications/:id/read`, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.post(`${BASE_PATH}/notifications/read-all`, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE');
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
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
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// Customer Orders (Create - POS/Checkout)
app.post(`${BASE_PATH}/customer-orders`, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customerEmail, customerName, items, total, deliveryMethod, shippingAddress, paymentMethod, paymentProof } = req.body;
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const purchasedItems = [];
    const digitalKeys = [];

    // Determine flow and initial status
    const isPOS = !paymentMethod;
    const isManualPayment = ['cod', 'instapay', 'vodafone_cash', 'telda'].includes(paymentMethod);
    const isCard = paymentMethod === 'card';
    const initialStatus = isPOS ? 'completed' : (isManualPayment ? 'pending' : 'pending_payment');

    // Process each item in the cart
    for (const item of items) {
      // Lock the product row for update to prevent race conditions
      const [productRows] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [item.id]);
      
      if (productRows.length === 0) {
        throw new Error(`Product ${item.name} not found`);
      }
      
      const product = productRows[0];
      let digitalItems = [];
      try {
        digitalItems = typeof product.digital_items === 'string' 
          ? JSON.parse(product.digital_items) 
          : (product.digital_items || []);
      } catch (e) {
        digitalItems = [];
      }
      
      // Capture initial count to determine if it's a digital product
      const initialDigitalCount = digitalItems.length;

      const quantity = item.quantity || 1;
      
      // For each unit purchased
      // Always assign/reserve keys immediately for ANY order
      const assignNow = true;

      for (let i = 0; i < quantity; i++) {
        let assignedKey = null;
        
        if (assignNow && digitalItems.length > 0) {
          assignedKey = digitalItems.shift();
        }
        if (assignNow && assignedKey) {
          digitalKeys.push({
            productName: product.name,
            ...assignedKey
          });
        }

        // Insert order record
        await connection.query(
          `INSERT INTO orders (
            order_number, customer_name, customer_email, product_name, 
            date, status, amount, 
            digital_email, digital_password, digital_code, inventory_id,
            payment_method, payment_proof, shipping_address
          ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderNumber, 
            customerName, 
            customerEmail, 
            product.name,
            initialStatus, 
            product.price, 
            assignNow && assignedKey ? assignedKey.email : null,
            assignNow && assignedKey ? assignedKey.password : null,
            assignNow && assignedKey ? assignedKey.code : null,
            isPOS ? 'POS' : null,
            paymentMethod || null,
            paymentProof || null,
            JSON.stringify(shippingAddress || {})
          ]
        );

        purchasedItems.push({
          ...item,
          digital_key: assignNow ? assignedKey : null
        });
      }
      
      // Update product inventory and stock for ANY order
      if (assignNow) {
        // If it was digital (had keys initially) or still has keys, sync stock to keys.
        // Otherwise treat as physical.
        const isDigital = initialDigitalCount > 0 || digitalItems.length > 0;
        const newStock = isDigital ? digitalItems.length : Math.max(0, product.stock - quantity);

        await connection.query(
          'UPDATE products SET digital_items = ?, stock = ? WHERE id = ?',
          [JSON.stringify(digitalItems), newStock, product.id]
        );
      }
    }

    await connection.commit();

    // Send Email to Customer
    // ONLY send if status is completed (i.e., not pending verification)
    if (initialStatus === 'completed') {
        try {
            if (digitalKeys.length > 0) {
                const emailSubject = `Your Order #${orderNumber} from GamesUp`;
                
                let keysHtml = '';
                digitalKeys.forEach(key => {
                    keysHtml += `
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                        <h4 style="margin-top: 0;">${key.productName}</h4>
                        <p><strong>Email:</strong> ${key.email || 'N/A'}</p>
                        <p><strong>Password:</strong> ${key.password || 'N/A'}</p>
                        <p><strong>Code:</strong> <span style="font-family: monospace; background: #eee; padding: 2px 5px;">${key.code || 'N/A'}</span></p>
                        <p><span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 0.8em;">${isPOS ? 'POS Order' : 'Online Order'}</span></p>
                    </div>`;
                });

                const emailHtml = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                  <h2>Order Confirmation</h2>
                  <p>Hello ${customerName},</p>
                  <p>Thank you for your purchase at our store!</p>
                  <p><strong>Order Number:</strong> ${orderNumber}</p>
                  <p><strong>Total:</strong> $${Number(total).toFixed(2)}</p>
                  
                  <h3 style="margin-top: 20px;">Your Digital Items:</h3>
                  ${keysHtml}
                  
                  <p>If you have any questions, please ask our staff.</p>
                </div>
                `;
                
                const emailText = `Hello ${customerName},\n\nThank you for your purchase! Order: ${orderNumber}\n\nYour digital items are attached in this email.`;

                await emailService.sendEmail(customerEmail, emailSubject, emailText, emailHtml);
            }
        } catch (emailError) {
            console.error('Failed to send completed order email:', emailError);
            // Don't fail the request if email fails, as the order is already committed
        }
    } else {
        // Optional: Send "Order Received" email for pending orders
        try {
             const emailSubject = `Order Received #${orderNumber} - GamesUp`;
             const emailHtml = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                  <h2>Order Received</h2>
                  <p>Hello ${customerName},</p>
                  <p>Thank you for your order! We have received your request.</p>
                  <p><strong>Order Number:</strong> ${orderNumber}</p>
                  <p><strong>Total:</strong> $${Number(total).toFixed(2)}</p>
                  <p><strong>Payment Method:</strong> ${paymentMethod || 'POS'}</p>
                  <p><strong>Status:</strong> ${isCard ? 'Pending Payment' : 'Pending Verification'}</p>
                  
                  <p>We will verify your payment and send you the digital items shortly.</p>
                </div>
             `;
             const emailText = `Hello ${customerName},\n\nThank you for your order #${orderNumber}. We have received your request and will verify your payment shortly.`;
             await emailService.sendEmail(customerEmail, emailSubject, emailText, emailHtml);
        } catch (e) {
            console.error('Failed to send pending order email', e);
        }
    }

    res.json({ 
        success: true, 
        orderNumber, 
        purchasedItems 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating POS order:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  } finally {
    connection.release();
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

// Verify Payment and finalize order (assign keys and send completion email)
app.post(`${BASE_PATH}/payment/verify`, async (req, res) => {
  try {
    const { tranRef, orderNumber } = req.body;

    // 1. Verify Payment
    const verification = await paytabs.verifyPayment(tranRef);

    if (verification.success) {
      // 2. Fetch order rows
      const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
      if (orderRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const customerName = orderRows[0].customer_name;
      const customerEmail = orderRows[0].customer_email;
      const totalAmount = orderRows.reduce((sum, r) => sum + (typeof r.amount === 'string' ? parseFloat(r.amount.replace('$','')) : r.amount), 0);

      // 3. Assign keys for rows lacking digital data and mark as completed
      const keysAssigned = [];
      for (const row of orderRows) {
        if (!row.digital_email && !row.digital_password && !row.digital_code) {
          const [productRows] = await pool.query('SELECT * FROM products WHERE name = ? FOR UPDATE', [row.product_name]);
          if (productRows.length === 0) continue;
          const product = productRows[0];
          let digitalItems = [];
          try {
            digitalItems = typeof product.digital_items === 'string' ? JSON.parse(product.digital_items) : (product.digital_items || []);
          } catch (e) {
            digitalItems = [];
          }
          if (digitalItems.length === 0) continue;
          const assignedKey = digitalItems.shift();
          // Sync stock with remaining digital items count
          const newStock = digitalItems.length;
          await pool.query('UPDATE products SET digital_items = ?, stock = ? WHERE id = ?', [JSON.stringify(digitalItems), newStock, product.id]);
          await pool.query('UPDATE orders SET digital_email = ?, digital_password = ?, digital_code = ?, status = ? WHERE id = ?', [assignedKey.email || null, assignedKey.password || null, assignedKey.code || null, 'completed', row.id]);
          keysAssigned.push({ productName: row.product_name, ...assignedKey });
        } else {
          // Keys already assigned (reserved during pending)
          await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['completed', row.id]);
          keysAssigned.push({ 
             productName: row.product_name, 
             email: row.digital_email, 
             password: row.digital_password, 
             code: row.digital_code 
          });
        }
      }

      // 4. Send completion email
      if (keysAssigned.length > 0) {
        const emailSubject = `Your Order #${orderNumber} is Completed`;
        let keysHtml = '';
        keysAssigned.forEach(key => {
          keysHtml += `
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
              <h4 style="margin-top: 0;">${key.productName}</h4>
              <p><strong>Email:</strong> ${key.email || 'N/A'}</p>
              <p><strong>Password:</strong> ${key.password || 'N/A'}</p>
              <p><strong>Code:</strong> <span style="font-family: monospace; background: #eee; padding: 2px 5px;">${key.code || 'N/A'}</span></p>
            </div>`;
        });
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Order Completed!</h2>
            <p>Hello ${customerName},</p>
            <p>Your payment has been verified and your order is completed.</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
            <h3 style="margin-top: 20px;">Your Digital Items:</h3>
            ${keysHtml}
            <p>Thank you for shopping with GamesUp!</p>
          </div>
        `;
        const emailText = `Hello ${customerName},\n\nYour order ${orderNumber} is completed. Your digital items are included.`;
        await emailService.sendEmail(customerEmail, emailSubject, emailText, emailHtml);
      }

      res.json({ success: true, message: 'Payment verified, order completed, and email sent' });
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
    
    // Ensure stock is linked to digital items count if digital items exist
    const digitalList = digitalItems || [];
    const finalStock = digitalList.length > 0 ? digitalList.length : stock;
    
    const digitalItemsJson = JSON.stringify(digitalList);
    const attributesJson = JSON.stringify(attributes || {});

    const [result] = await pool.query(
      'INSERT INTO products (name, category_slug, sub_category_slug, price, cost, stock, image, description, attributes, digital_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, categorySlug, subCategorySlug, priceValue, costValue, finalStock, image, description || '', attributesJson, digitalItemsJson]
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
    
    // Ensure stock is linked to digital items count if digital items exist
    const digitalList = digitalItems || [];
    const finalStock = digitalList.length > 0 ? digitalList.length : stock;
    
    const digitalItemsJson = JSON.stringify(digitalList);
    const attributesJson = JSON.stringify(attributes || {});

    await pool.query(
      'UPDATE products SET name=?, category_slug=?, sub_category_slug=?, price=?, cost=?, stock=?, image=?, description=?, attributes=?, digital_items=? WHERE id=?',
      [name, categorySlug, subCategorySlug, priceValue, costValue, finalStock, image, description || '', attributesJson, digitalItemsJson, id]
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
    const { status, search, email, product } = req.query;
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
    
    if (product && product !== 'All') {
      conditions.push('product_name = ?');
      params.push(product);
    }

    if (search) {
      // Enhanced search: order_number, customer_name, customer_email, product_name, digital_code
      conditions.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR product_name LIKE ? OR digital_code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
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

// Delete Payment Proof
app.delete(`${BASE_PATH}/orders/:id/payment-proof`, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Get the filename
    const [rows] = await pool.query('SELECT payment_proof FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const paymentProofUrl = rows[0].payment_proof;
    if (!paymentProofUrl) {
      return res.status(400).json({ error: 'No payment proof to delete' });
    }

    // Extract filename from URL
    const filename = paymentProofUrl.split('/').pop();
    const filePath = path.join(uploadDir, filename);

    // 2. Delete file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 3. Update DB
    await pool.query('UPDATE orders SET payment_proof = NULL WHERE id = ?', [id]);

    res.json({ message: 'Payment proof deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment proof:', error);
    res.status(500).json({ error: 'Failed to delete payment proof' });
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

    // When marking completed, allocate key if missing and send email
    if (status === 'completed') {
        try {
            const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
            if (rows.length > 0) {
                const order = rows[0];
                // Allocate key if missing
                if (!order.digital_email && !order.digital_password && !order.digital_code) {
                    const [productRows] = await pool.query('SELECT * FROM products WHERE name = ? FOR UPDATE', [order.product_name]);
                    if (productRows.length > 0) {
                        const productRow = productRows[0];
                        let digitalItems = [];
                        try {
                            digitalItems = typeof productRow.digital_items === 'string' ? JSON.parse(productRow.digital_items) : (productRow.digital_items || []);
                        } catch (e) {
                            digitalItems = [];
                        }
                        if (digitalItems.length > 0) {
                            const assignedKey = digitalItems.shift();
                            // Sync stock with remaining digital items count
                            const newStock = digitalItems.length;
                            await pool.query('UPDATE products SET digital_items = ?, stock = ? WHERE id = ?', [JSON.stringify(digitalItems), newStock, productRow.id]);
                            await pool.query('UPDATE orders SET digital_email = ?, digital_password = ?, digital_code = ? WHERE id = ?', [assignedKey.email || null, assignedKey.password || null, assignedKey.code || null, id]);
                            order.digital_email = assignedKey.email || null;
                            order.digital_password = assignedKey.password || null;
                            order.digital_code = assignedKey.code || null;
                        }
                    }
                }
                // Check if we have digital items to send
                if (order.digital_email || order.digital_password || order.digital_code) {
                    const emailSubject = `Your Order #${order.order_number || order.id} is Completed`;
                    const emailText = `
Hello ${order.customer_name},

Your order for ${order.product_name} has been completed!

Here are your digital product details:
Email: ${order.digital_email || 'N/A'}
Password: ${order.digital_password || 'N/A'}
Code: ${order.digital_code || 'N/A'}

Thank you for shopping with us!
`;
                    const emailHtml = `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2>Order Completed!</h2>
  <p>Hello ${order.customer_name},</p>
  <p>Your order for <strong>${order.product_name}</strong> has been completed.</p>
  <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Your Digital Product Details:</h3>
    <p><strong>Email:</strong> ${order.digital_email || 'N/A'}</p>
    <p><strong>Password:</strong> ${order.digital_password || 'N/A'}</p>
    <p><strong>Code:</strong> <span style="font-family: monospace; letter-spacing: 1px; background: #eee; padding: 2px 5px; rounded: 3px;">${order.digital_code || 'N/A'}</span></p>
  </div>
  <p>Thank you for shopping with GamesUp!</p>
</div>
`;
                    // Send email
                    emailService.sendEmail(order.customer_email, emailSubject, emailText, emailHtml).catch(console.error);
                }
            }
        } catch (emailError) {
            console.error('Error sending completion email:', emailError);
        }
    }

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Debug Diagnostic Route
app.get(`${BASE_PATH}/debug/diagnose`, async (req, res) => {
  const diagnostics = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER ? '***' : 'undefined',
      DB_NAME: process.env.DB_NAME,
      PORT: process.env.PORT,
      PWD: process.cwd(),
      DIRNAME: __dirname
    },
    files: {
      serverEnv: fs.existsSync(path.resolve(__dirname, '.env')),
      rootEnv: fs.existsSync(path.resolve(__dirname, '../.env')),
      schemaSql: fs.existsSync(path.join(__dirname, 'schema.sql'))
    },
    database: {
      status: 'unknown',
      tables: []
    }
  };

  try {
    const connection = await pool.getConnection();
    diagnostics.database.status = 'connected';
    
    // List tables
    const [rows] = await connection.query('SHOW TABLES');
    diagnostics.database.tables = rows.map(r => Object.values(r)[0]);
    
    // Describe categories if exists
    if (diagnostics.database.tables.includes('categories')) {
       const [cols] = await connection.query('DESCRIBE categories');
       diagnostics.database.categories_schema = cols;
    }

    connection.release();
  } catch (err) {
    diagnostics.database.status = 'error';
    diagnostics.database.error = err.message;
    diagnostics.database.code = err.code;
  }

  res.json(diagnostics);
});

// Deep Data Diagnostic Route (Temporary)
app.get(`${BASE_PATH}/debug/deep-diagnose`, async (req, res) => {
  const report = {
    status: 'starting',
    tables: {},
    dataIssues: []
  };

  try {
    const connection = await pool.getConnection();
    
    // 1. Check Tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    report.tables.list = tableNames;
    
    const requiredTables = ['products', 'categories', 'sub_categories', 'settings', 'users', 'roles', 'employees', 'attendance'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    report.tables.missing = missingTables;

    // 2. Check Settings
    if (tableNames.includes('settings')) {
        const [settings] = await connection.query('SELECT * FROM settings');
        report.tables.settings_count = settings.length;
        if (settings.length === 0) {
            report.dataIssues.push('Settings table is empty. App might crash expecting defaults.');
            // Auto-fix: Insert defaults
            await connection.query(`
                INSERT INTO settings (setting_key, setting_value) VALUES 
                ('currency_code', 'USD'),
                ('currency_symbol', '$'),
                ('tax_rate', '0'),
                ('site_title', 'GamesUp')
            `);
            report.dataIssues.push('FIXED: Inserted default settings.');
        }
    }

    // Check Users Table Structure
    if (tableNames.includes('users')) {
        const [columns] = await connection.query('SHOW COLUMNS FROM users');
        const columnNames = columns.map(c => c.Field);
        const requiredColumns = ['job_title', 'phone', 'avatar', 'identity_document'];
        const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));
        
        if (missingColumns.length > 0) {
             report.dataIssues.push(`Users table missing columns: ${missingColumns.join(', ')}`);
             report.tables.users_needs_migration = true;
        }
    }

    // Check Categories Table Structure
    if (tableNames.includes('categories')) {
        const [columns] = await connection.query('SHOW COLUMNS FROM categories');
        const iconColumn = columns.find(c => c.Field === 'icon');
        if (iconColumn) {
            report.tables.categories_icon_type = iconColumn.Type;
            if (!iconColumn.Type.toLowerCase().includes('text')) {
                report.dataIssues.push(`Categories icon column is ${iconColumn.Type}, expected TEXT. Run /fix-db-schema.`);
            }
        }
    }

    // 3. Check Products & JSON
    if (tableNames.includes('products')) {
        const [products] = await connection.query('SELECT id, name, category_slug, digital_items FROM products LIMIT 50');
        report.tables.products_count = products.length;
        
        products.forEach(p => {
            if (p.digital_items) {
                try {
                    if (typeof p.digital_items === 'string') JSON.parse(p.digital_items);
                } catch (e) {
                    report.dataIssues.push(`Product ${p.id} (${p.name}) has invalid digital_items JSON.`);
                }
            }
            if (!p.category_slug) {
                report.dataIssues.push(`Product ${p.id} (${p.name}) has missing category_slug.`);
            }
        });
    }

    connection.release();
    res.json(report);

  } catch (err) {
    console.error('Deep diagnostic failed:', err);
    res.status(500).json({ 
        error: 'Diagnostic failed', 
        details: err.message, 
        stack: err.stack 
    });
  }
});

app.get(`${BASE_PATH}/debug/server-logs`, async (req, res) => {
    try {
        const logFiles = [
            'server_error.log', // Newly added log file
            'stderr.log', 
            'stdout.log', 
            'error_log', 
            'logs/error.log', 
            'logs/app.log',
            '../stderr.log',
            '../error_log'
        ];
        
        const logs = {};
        for (const file of logFiles) {
            const filePath = path.join(__dirname, file); // Try relative to server/
            const rootPath = path.join(__dirname, '..', file); // Try relative to root
            
            if (fs.existsSync(filePath)) {
                logs[file] = fs.readFileSync(filePath, 'utf8').slice(-5000); // Last 5000 chars
            } else if (fs.existsSync(rootPath)) {
                logs[file] = fs.readFileSync(rootPath, 'utf8').slice(-5000);
            } else {
                logs[file] = 'Not found';
            }
        }
        
        res.json({
            message: 'Server Log Dump',
            timestamp: new Date().toISOString(),
            logs: logs
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read logs', details: error.message });
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
    
    // Log request body for debugging
    console.log('Creating category:', req.body);
    
    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Name and slug are required',
        received: req.body
      });
    }

    // Ensure icon fits in VARCHAR(255) or truncate/handle it
    let safeIcon = icon;
    if (safeIcon && safeIcon.length > 255) {
        console.warn('Icon URL too long, truncating or nulling');
    }

    await pool.query(
      'INSERT INTO categories (name, slug, icon, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, slug, safeIcon, displayOrder || 0, isActive ? 1 : 0]
    );
    res.json({ message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Category already exists',
        details: 'A category with this slug or name already exists' 
      });
    }

    if (error.code === 'ER_DATA_TOO_LONG' || error.code === 'WARN_DATA_TRUNCATED') {
        return res.status(400).json({
            error: 'Data too long',
            details: 'The icon image is too large for the database. Please run the schema fix at /fix-db-schema.'
        });
    }

    logError('Create Category', error);

    res.status(500).json({ 
      error: 'Failed to create category',
      details: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
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
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Category already exists',
        details: 'A category with this slug or name already exists' 
      });
    }

    if (error.code === 'ER_DATA_TOO_LONG' || error.code === 'WARN_DATA_TRUNCATED') {
        return res.status(400).json({
            error: 'Data too long',
            details: 'The icon image is too large for the database. Please run the schema fix at /fix-db-schema.'
        });
    }

    logError('Update Category', error);

    res.status(500).json({ 
      error: 'Failed to update category',
      details: error.message
    });
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
    
    // Log request body for debugging
    console.log('Creating sub-category:', req.body);
    
    // Validate required fields
    if (!categoryId || !name || !slug) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Category ID, name, and slug are required',
        received: req.body
      });
    }

    await pool.query(
      'INSERT INTO sub_categories (category_id, name, description, slug, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [categoryId, name, description, slug, displayOrder || 0, isActive ? 1 : 0]
    );
    res.json({ message: 'Sub-category created successfully' });
  } catch (error) {
    console.error('Error creating sub-category:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Sub-category already exists',
        details: 'A sub-category with this slug already exists' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create sub-category',
      details: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
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
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Sub-category already exists',
        details: 'A sub-category with this slug already exists' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to update sub-category',
      details: error.message 
    });
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
      [name, type, JSON.stringify(options), isRequired ? 1 : 0, displayOrder || 0, isActive ? 1 : 0]
    );
    res.json({ message: 'Attribute created successfully' });
  } catch (error) {
    console.error('Error creating attribute:', error);
    res.status(500).json({ 
      error: 'Failed to create attribute',
      details: error.message 
    });
  }
});

app.put(`${BASE_PATH}/system/attributes/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, options, isRequired, displayOrder, isActive } = req.body;
    await pool.query(
      'UPDATE product_attributes SET name=?, type=?, options=?, is_required=?, display_order=?, is_active=? WHERE id=?',
      [name, type, JSON.stringify(options), isRequired ? 1 : 0, displayOrder || 0, isActive ? 1 : 0, id]
    );
    res.json({ message: 'Attribute updated successfully' });
  } catch (error) {
    console.error('Error updating attribute:', error);
    res.status(500).json({ 
      error: 'Failed to update attribute',
      details: error.message 
    });
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

// Admin Product Overview Route
app.get(`${BASE_PATH}/admin/product-overview`, async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // 1. Get Product Details
    const [productRows] = await pool.query('SELECT id, name, image, digital_items FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = productRows[0];

    // 2. Parse digital items (remaining inventory)
    let remainingItems = [];
    try {
      remainingItems = typeof product.digital_items === 'string' 
        ? JSON.parse(product.digital_items) 
        : (product.digital_items || []);
    } catch (e) {
      remainingItems = [];
    }

    // 3. Get Sold Items (from orders)
    // We search by product name since orders store product_name
    const [orderRows] = await pool.query(`
      SELECT id, order_number, customer_name, customer_email, date, 
             digital_email, digital_password, digital_code 
      FROM orders 
      WHERE product_name = ? 
      ORDER BY date DESC
    `, [product.name]);

    const soldItems = orderRows.map(row => ({
      orderId: row.id,
      orderNumber: row.order_number || `ORD-${row.id}`,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      date: row.date,
      email: row.digital_email,
      password: row.digital_password,
      code: row.digital_code
    }));

    // 4. Extract unique customers
    const customerMap = new Map();
    soldItems.forEach(item => {
      if (!customerMap.has(item.customerEmail)) {
        customerMap.set(item.customerEmail, {
          name: item.customerName,
          email: item.customerEmail,
          date: item.date,
          orderNumber: item.orderNumber
        });
      }
    });
    const customers = Array.from(customerMap.values());

    res.json({
      product: {
        id: product.id,
        name: product.name,
        image: product.image
      },
      stats: {
        totalSold: soldItems.length,
        totalRemaining: remainingItems.length
      },
      remainingItems: remainingItems,
      soldItems: soldItems,
      customers: customers
    });

  } catch (error) {
    console.error('Error fetching product overview:', error);
    res.status(500).json({ error: 'Failed to fetch product overview' });
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

// Settings routes are defined earlier in the file (around line 478)
// Removed duplicate implementation to prevent conflicts

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
    if (['instapay', 'vodafone_cash', 'telda'].includes(paymentMethod)) {
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

    // Send email to customer
    try {
        const emailSubject = `Order Confirmation #${orderNumber}`;
        const emailText = `Thank you for your order, ${customerName}! Your order #${orderNumber} has been placed successfully.`;
        
        let itemsHtml = purchasedItems.map(item => `
            <div style="border: 1px solid #eee; padding: 15px; margin-bottom: 10px; border-radius: 5px;">
                <h3 style="margin: 0 0 10px 0;">${item.name}</h3>
                <p style="margin: 0;">Price: ${item.price}</p>
                ${item.digitalItem ? `
                    <div style="margin-top: 10px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
                        ${item.digitalItem.code ? `<p><strong>Code:</strong> ${item.digitalItem.code}</p>` : ''}
                        ${item.digitalItem.email ? `<p><strong>Email:</strong> ${item.digitalItem.email}</p>` : ''}
                        ${item.digitalItem.password ? `<p><strong>Password:</strong> ${item.digitalItem.password}</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Order Confirmation</h1>
                <p>Hello ${customerName},</p>
                <p>Thank you for your purchase. Here are your order details:</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> ${orderNumber}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Total:</strong> ${total}</p>
                </div>

                <h2>Your Items</h2>
                ${itemsHtml}

                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </div>
        `;

        emailService.sendEmail(customerEmail, emailSubject, emailText, emailHtml).catch(err => {
            console.error('Failed to send order confirmation email:', err);
        });

    } catch (emailError) {
        console.error('Error preparing email:', emailError);
    }

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

// Get Product Data Overview (Admin)
app.get(`${BASE_PATH}/admin/product-overview`, async (req, res) => {
  try {
    const { productId } = req.query;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // 1. Get Product Details & Remaining Inventory
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    let remainingItems = [];
    try {
      remainingItems = typeof product.digital_items === 'string'
        ? JSON.parse(product.digital_items)
        : (product.digital_items || []);
    } catch (e) {
      remainingItems = [];
    }

    // 2. Get Sold Items (from orders)
    // Note: Orders link by product_name currently
    const [orders] = await pool.query(
      `SELECT 
        id, order_number, customer_name, customer_email, date, 
        digital_email, digital_password, digital_code 
       FROM orders 
       WHERE product_name = ? AND (digital_code IS NOT NULL OR digital_email IS NOT NULL OR digital_password IS NOT NULL)
       ORDER BY date DESC`,
      [product.name]
    );

    const soldItems = orders.map(order => ({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      date: order.date,
      email: order.digital_email,
      password: order.digital_password,
      code: order.digital_code
    }));

    // 3. Aggregate Customer Data
    const customers = orders.map(order => ({
      name: order.customer_name,
      email: order.customer_email,
      date: order.date,
      orderNumber: order.order_number
    }));

    res.json({
      product: {
        id: product.id,
        name: product.name,
        image: product.image
      },
      stats: {
        totalSold: soldItems.length,
        totalRemaining: remainingItems.length
      },
      remainingItems, // List of {email, password, code} in stock
      soldItems,      // List of sold items with order details
      customers       // List of customers who bought this
    });

  } catch (error) {
    console.error('Error fetching product overview:', error);
    res.status(500).json({ error: 'Failed to fetch product overview' });
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

async function runMigrations() {
  console.log('Checking database migrations...');
  try {
    const connection = await pool.getConnection();
    
    // 1. Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT
      )
    `);

    // 2. Notifications Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        icon TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3.1 Fix Categories Schema (Add 'icon' if missing)
    try {
        const [catColumns] = await connection.query('SHOW COLUMNS FROM categories');
        const hasIcon = catColumns.some(c => c.Field === 'icon');
        const hasImageUrl = catColumns.some(c => c.Field === 'image_url');
        
        if (!hasIcon) {
            console.log('Adding missing "icon" column to categories table...');
            await connection.query('ALTER TABLE categories ADD COLUMN icon TEXT');
            
            // If image_url exists, copy data to icon
            if (hasImageUrl) {
                await connection.query('UPDATE categories SET icon = image_url WHERE icon IS NULL');
            }
        } else {
            // Ensure it is TEXT
            const iconCol = catColumns.find(c => c.Field === 'icon');
            if (iconCol && !iconCol.Type.toLowerCase().includes('text')) {
                 console.log('Modifying "icon" column to TEXT...');
                 await connection.query('ALTER TABLE categories MODIFY COLUMN icon TEXT');
            }
        }
    } catch (e) {
        console.error('Error fixing categories schema:', e);
    }

    // 4. Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        category_slug VARCHAR(100),
        price DECIMAL(10, 2),
        stock INT DEFAULT 0,
        image VARCHAR(255),
        description TEXT,
        digital_items JSON,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Customers Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Users Table (Admins)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        job_title VARCHAR(100),
        phone VARCHAR(50),
        avatar VARCHAR(255),
        identity_document VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6.1 Fix Users Schema (Add missing columns)
    try {
        const [userColumns] = await connection.query('SHOW COLUMNS FROM users');
        const userFields = userColumns.map(c => c.Field);
        
        if (!userFields.includes('job_title')) await connection.query('ALTER TABLE users ADD COLUMN job_title VARCHAR(100)');
        if (!userFields.includes('phone')) await connection.query('ALTER TABLE users ADD COLUMN phone VARCHAR(50)');
        if (!userFields.includes('avatar')) await connection.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255)');
        if (!userFields.includes('identity_document')) await connection.query('ALTER TABLE users ADD COLUMN identity_document VARCHAR(255)');
    } catch (e) {
        console.error('Error fixing users schema:', e);
    }

    // 7. Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        product_name VARCHAR(255),
        date DATE,
        status VARCHAR(50),
        amount DECIMAL(10, 2),
        digital_email VARCHAR(255),
        digital_password VARCHAR(255),
        digital_code VARCHAR(255),
        inventory_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Employees Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        department VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        join_date DATE,
        salary DECIMAL(10, 2),
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8.1 Fix Employees Schema
    try {
        const [empColumns] = await connection.query('SHOW COLUMNS FROM employees');
        const empFields = empColumns.map(c => c.Field);
        
        if (!empFields.includes('image')) await connection.query('ALTER TABLE employees ADD COLUMN image VARCHAR(255)');
        if (!empFields.includes('department')) await connection.query('ALTER TABLE employees ADD COLUMN department VARCHAR(100)');
    } catch (e) {
        console.error('Error fixing employees schema:', e);
    }

    // 9. Attendance Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT,
        date DATE,
        check_in TIME,
        check_out TIME,
        status VARCHAR(50),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);
    
    // 10. Banners Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        link VARCHAR(255),
        position INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Sub Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sub_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        slug VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // 12. Product Attributes Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_attributes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        options JSON,
        is_required BOOLEAN DEFAULT FALSE,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log('Migrations check completed (All tables verified).');
  } catch (error) {
    console.error('Migration check failed:', error);
  }
}

runMigrations().then(() => {
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
});
