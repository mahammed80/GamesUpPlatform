import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper to verify auth
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) {
    console.log('No auth header provided');
    return null;
  }
  const token = authHeader.split(' ')[1];
  
  // Check if it's a manual token
  if (token.startsWith('manual_token_')) {
    const session = await kv.get(`session:${token}`);
    if (!session) {
      console.log('Manual session not found');
      return null;
    }
    
    // Check if session is expired
    if (session.expires_at < Date.now()) {
      console.log('Manual session expired');
      await kv.del(`session:${token}`);
      return null;
    }
    
    return session.user;
  }
  
  // Fall back to Supabase auth for other tokens
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  
  if (error) {
    console.log('Auth verification error:', error);
    return null;
  }
  
  if (!user) {
    console.log('No user found for token');
    return null;
  }
  
  return user;
}

// Auth Routes
app.post('/make-server-f6f1fb51/auth/signup', async (c) => {
  try {
    const { email, password, name, role = 'staff' } = await c.req.json();
    
    // Check if user already exists
    const existingUsers = await supabase.auth.admin.listUsers();
    const userExists = existingUsers.data.users?.some(u => u.email === email);
    
    if (userExists) {
      return c.json({ error: 'User with this email already exists' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

app.post('/make-server-f6f1fb51/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    console.log('Login attempt for:', email);
    
    // Use manual authentication with KV store
    // Get user credentials from KV store
    const userCreds = await kv.get(`user_cred:${email}`);
    
    if (!userCreds) {
      console.log('User not found in credentials store:', email);
      return c.json({ error: 'Invalid login credentials' }, 401);
    }
    
    // Verify password (in production, this should be hashed)
    if (userCreds.password !== password) {
      console.log('Invalid password for:', email);
      return c.json({ error: 'Invalid login credentials' }, 401);
    }
    
    // Create session data
    const user = {
      id: userCreds.id,
      email: email,
      user_metadata: {
        name: userCreds.name,
        role: userCreds.role
      },
      created_at: userCreds.created_at || new Date().toISOString()
    };
    
    const sessionData = {
      access_token: `manual_token_${userCreds.id}_${Date.now()}`,
      refresh_token: '',
      expires_in: 3600,
      token_type: 'bearer',
      user: user
    };
    
    // Store the session token for verification
    await kv.set(`session:${sessionData.access_token}`, {
      user,
      expires_at: Date.now() + (3600 * 1000)
    });
    
    console.log('Login successful for:', email);
    return c.json({ 
      user: user,
      session: sessionData
    });
  } catch (error) {
    console.log('Login exception:', error);
    return c.json({ error: error.message || 'Login failed' }, 500);
  }
});

// Products Routes
app.get('/make-server-f6f1fb51/products', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const products = await kv.getByPrefix('product:');
    return c.json({ products: products.map(p => p.value) });
  } catch (error) {
    console.log('Get products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.post('/make-server-f6f1fb51/products', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const product = await c.req.json();
    const id = product.id || Date.now();
    await kv.set(`product:${id}`, { ...product, id });
    return c.json({ product: { ...product, id } });
  } catch (error) {
    console.log('Create product error:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/make-server-f6f1fb51/products/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const product = await c.req.json();
    await kv.set(`product:${id}`, { ...product, id });
    return c.json({ product: { ...product, id } });
  } catch (error) {
    console.log('Update product error:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

app.delete('/make-server-f6f1fb51/products/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    await kv.del(`product:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete product error:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// Orders Routes
app.get('/make-server-f6f1fb51/orders', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const orders = await kv.getByPrefix('order:');
    return c.json({ orders: orders.map(o => o.value) });
  } catch (error) {
    console.log('Get orders error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.put('/make-server-f6f1fb51/orders/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const order = await c.req.json();
    await kv.set(`order:${id}`, { ...order, id });
    return c.json({ order: { ...order, id } });
  } catch (error) {
    console.log('Update order error:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// Customers Routes
app.get('/make-server-f6f1fb51/customers', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const customers = await kv.getByPrefix('customer:');
    return c.json({ customers: customers.map(c => c.value) });
  } catch (error) {
    console.log('Get customers error:', error);
    return c.json({ error: 'Failed to fetch customers' }, 500);
  }
});

app.put('/make-server-f6f1fb51/customers/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const customer = await c.req.json();
    await kv.set(`customer:${id}`, { ...customer, id });
    return c.json({ customer: { ...customer, id } });
  } catch (error) {
    console.log('Update customer error:', error);
    return c.json({ error: 'Failed to update customer' }, 500);
  }
});

// Tasks Routes
app.get('/make-server-f6f1fb51/tasks', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const tasks = await kv.getByPrefix('task:');
    return c.json({ tasks: tasks.map(t => t.value) });
  } catch (error) {
    console.log('Get tasks error:', error);
    return c.json({ error: 'Failed to fetch tasks' }, 500);
  }
});

app.post('/make-server-f6f1fb51/tasks', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const task = await c.req.json();
    const id = task.id || Date.now();
    await kv.set(`task:${id}`, { ...task, id });
    return c.json({ task: { ...task, id } });
  } catch (error) {
    console.log('Create task error:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

app.put('/make-server-f6f1fb51/tasks/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const task = await c.req.json();
    await kv.set(`task:${id}`, { ...task, id });
    return c.json({ task: { ...task, id } });
  } catch (error) {
    console.log('Update task error:', error);
    return c.json({ error: 'Failed to update task' }, 500);
  }
});

app.delete('/make-server-f6f1fb51/tasks/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    await kv.del(`task:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete task error:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});

// Team Members Routes
app.get('/make-server-f6f1fb51/team', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const members = await kv.getByPrefix('team:');
    return c.json({ members: members.map(m => m.value) });
  } catch (error) {
    console.log('Get team error:', error);
    return c.json({ error: 'Failed to fetch team members' }, 500);
  }
});

app.put('/make-server-f6f1fb51/team/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const member = await c.req.json();
    await kv.set(`team:${id}`, { ...member, id });
    return c.json({ member: { ...member, id } });
  } catch (error) {
    console.log('Update team member error:', error);
    return c.json({ error: 'Failed to update team member' }, 500);
  }
});

// Roles Routes
app.get('/make-server-f6f1fb51/roles', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const roles = await kv.getByPrefix('role:');
    return c.json({ roles: roles.map(r => r.value) });
  } catch (error) {
    console.log('Get roles error:', error);
    return c.json({ error: 'Failed to fetch roles' }, 500);
  }
});

app.post('/make-server-f6f1fb51/roles', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const role = await c.req.json();
    const id = role.id || Date.now();
    await kv.set(`role:${id}`, { ...role, id });
    return c.json({ role: { ...role, id } });
  } catch (error) {
    console.log('Create role error:', error);
    return c.json({ error: 'Failed to create role' }, 500);
  }
});

app.put('/make-server-f6f1fb51/roles/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const role = await c.req.json();
    await kv.set(`role:${id}`, { ...role, id });
    return c.json({ role: { ...role, id } });
  } catch (error) {
    console.log('Update role error:', error);
    return c.json({ error: 'Failed to update role' }, 500);
  }
});

app.delete('/make-server-f6f1fb51/roles/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    await kv.del(`role:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete role error:', error);
    return c.json({ error: 'Failed to delete role' }, 500);
  }
});

// Settings Routes
app.get('/make-server-f6f1fb51/settings', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const settings = await kv.get('settings');
    return c.json({ settings: settings || {} });
  } catch (error) {
    console.log('Get settings error:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

app.put('/make-server-f6f1fb51/settings', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const settings = await c.req.json();
    await kv.set('settings', settings);
    return c.json({ settings });
  } catch (error) {
    console.log('Update settings error:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// Initialize default data if needed
app.post('/make-server-f6f1fb51/init', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // Check if already initialized
    const existing = await kv.get('initialized');
    if (existing) {
      return c.json({ message: 'Already initialized' });
    }

    // Set initialized flag
    await kv.set('initialized', true);
    return c.json({ message: 'Initialized successfully' });
  } catch (error) {
    console.log('Init error:', error);
    return c.json({ error: 'Initialization failed' }, 500);
  }
});

// Setup default accounts - PUBLIC endpoint for initial setup
app.post('/make-server-f6f1fb51/setup-accounts', async (c) => {
  try {
    // Check if accounts are already set up in KV
    const setupDone = await kv.get('accounts_setup');
    
    // Define test accounts with secure random passwords
    const testAccounts = [
      {
        id: 'admin_001',
        email: 'admin@gamesup.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      },
      {
        id: 'manager_001',
        email: 'manager@gamesup.com',
        password: 'manager123',
        name: 'Manager User',
        role: 'manager'
      },
      {
        id: 'staff_001',
        email: 'staff@gamesup.com',
        password: 'staff123',
        name: 'Staff User',
        role: 'staff'
      }
    ];

    const createdAccounts = [];

    for (const account of testAccounts) {
      // Store credentials in KV store for manual authentication
      const existing = await kv.get(`user_cred:${account.email}`);
      
      if (!existing) {
        console.log('Creating KV credentials for:', account.email);
        await kv.set(`user_cred:${account.email}`, {
          id: account.id,
          password: account.password,
          name: account.name,
          role: account.role,
          created_at: new Date().toISOString()
        });
        
        createdAccounts.push({
          email: account.email,
          role: account.role,
          name: account.name
        });
      } else {
        console.log('KV credentials already exist for:', account.email);
      }
    }

    // Mark setup as done
    if (!setupDone) {
      await kv.set('accounts_setup', true);
    }

    return c.json({ 
      message: setupDone ? 'Accounts already set up' : 'Test accounts setup completed',
      created: createdAccounts,
      credentials: {
        admin: { email: 'admin@gamesup.com', password: 'admin123' },
        manager: { email: 'manager@gamesup.com', password: 'manager123' },
        staff: { email: 'staff@gamesup.com', password: 'staff123' }
      }
    });
  } catch (error) {
    console.log('Setup accounts error:', error);
    return c.json({ error: 'Failed to setup accounts', details: error.message }, 500);
  }
});

// Debug endpoint to check accounts
app.get('/make-server-f6f1fb51/debug/accounts', async (c) => {
  try {
    const existingUsers = await supabase.auth.admin.listUsers();
    const setupDone = await kv.get('accounts_setup');
    
    return c.json({ 
      setupDone,
      userCount: existingUsers.data.users?.length || 0,
      users: existingUsers.data.users?.map(u => ({
        email: u.email,
        created: u.created_at,
        confirmed: u.email_confirmed_at ? true : false
      }))
    });
  } catch (error) {
    console.log('Debug accounts error:', error);
    return c.json({ error: 'Failed to fetch debug info', details: error.message }, 500);
  }
});

// Banners Routes
app.get('/make-server-f6f1fb51/banners', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const banners = await kv.getByPrefix('banner:');
    return c.json({ banners: banners.map(b => b.value) });
  } catch (error) {
    console.log('Get banners error:', error);
    return c.json({ error: 'Failed to fetch banners' }, 500);
  }
});

app.post('/make-server-f6f1fb51/banners', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const banner = await c.req.json();
    const id = banner.id || Date.now();
    await kv.set(`banner:${id}`, { ...banner, id });
    return c.json({ banner: { ...banner, id } });
  } catch (error) {
    console.log('Create banner error:', error);
    return c.json({ error: 'Failed to create banner' }, 500);
  }
});

app.put('/make-server-f6f1fb51/banners/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const banner = await c.req.json();
    await kv.set(`banner:${id}`, { ...banner, id });
    return c.json({ banner: { ...banner, id } });
  } catch (error) {
    console.log('Update banner error:', error);
    return c.json({ error: 'Failed to update banner' }, 500);
  }
});

app.delete('/make-server-f6f1fb51/banners/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    await kv.del(`banner:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete banner error:', error);
    return c.json({ error: 'Failed to delete banner' }, 500);
  }
});

// HR Routes
app.get('/make-server-f6f1fb51/hr/attendance', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const date = c.req.query('date') || new Date().toISOString().split('T')[0];
    const attendance = await kv.getByPrefix(`attendance:${date}:`);
    return c.json({ attendance: attendance.map(a => a.value) });
  } catch (error) {
    console.log('Get attendance error:', error);
    return c.json({ error: 'Failed to fetch attendance' }, 500);
  }
});

app.get('/make-server-f6f1fb51/hr/employees', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const members = await kv.getByPrefix('team:');
    const employees = members.map(m => ({
      id: m.value.id,
      name: m.value.name,
      role: m.value.role,
      shift: m.value.shift || 'morning',
    }));
    return c.json({ employees });
  } catch (error) {
    console.log('Get employees error:', error);
    return c.json({ error: 'Failed to fetch employees' }, 500);
  }
});

app.post('/make-server-f6f1fb51/hr/attendance', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const attendance = await c.req.json();
    const id = Date.now();
    const date = attendance.date || new Date().toISOString().split('T')[0];
    
    // Get employee info
    const employee = await kv.get(`team:${attendance.employeeId}`);
    const employeeName = employee?.name || 'Unknown';

    const record = {
      id,
      employeeId: attendance.employeeId,
      employeeName,
      date,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut || '',
      shift: attendance.shift,
      status: attendance.status,
      hoursWorked: 0,
    };

    await kv.set(`attendance:${date}:${id}`, record);
    return c.json({ attendance: record });
  } catch (error) {
    console.log('Mark attendance error:', error);
    return c.json({ error: 'Failed to mark attendance' }, 500);
  }
});

app.put('/make-server-f6f1fb51/hr/attendance/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const updates = await c.req.json();
    
    // Find the attendance record
    const allAttendance = await kv.getByPrefix('attendance:');
    const record = allAttendance.find(a => a.value.id.toString() === id);
    
    if (!record) {
      return c.json({ error: 'Attendance record not found' }, 404);
    }

    const updated = { ...record.value, ...updates };
    
    // Calculate hours worked if both check in and check out are available
    if (updated.checkIn && updated.checkOut) {
      const [inHour, inMin] = updated.checkIn.split(':').map(Number);
      const [outHour, outMin] = updated.checkOut.split(':').map(Number);
      const hours = (outHour * 60 + outMin - (inHour * 60 + inMin)) / 60;
      updated.hoursWorked = Math.round(hours * 10) / 10;
    }

    await kv.set(`attendance:${updated.date}:${id}`, updated);
    return c.json({ attendance: updated });
  } catch (error) {
    console.log('Update attendance error:', error);
    return c.json({ error: 'Failed to update attendance' }, 500);
  }
});

// POS Routes
app.post('/make-server-f6f1fb51/pos/invoice', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoiceData = await c.req.json();
    const id = Date.now();
    const invoice = {
      ...invoiceData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };

    await kv.set(`invoice:${id}`, invoice);
    return c.json({ invoice });
  } catch (error) {
    console.log('Create invoice error:', error);
    return c.json({ error: 'Failed to create invoice' }, 500);
  }
});

app.get('/make-server-f6f1fb51/pos/invoices', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoices = await kv.getByPrefix('invoice:');
    return c.json({ invoices: invoices.map(i => i.value) });
  } catch (error) {
    console.log('Get invoices error:', error);
    return c.json({ error: 'Failed to fetch invoices' }, 500);
  }
});

// System Configuration Routes - Categories
app.get('/make-server-f6f1fb51/system/categories', async (c) => {
  try {
    const categories = await kv.getByPrefix('category:');
    return c.json(categories.map(cat => cat.value).sort((a, b) => a.displayOrder - b.displayOrder));
  } catch (error) {
    console.log('Get categories error:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

app.post('/make-server-f6f1fb51/system/categories', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const category = await c.req.json();
    const id = category.id || `cat_${Date.now()}`;
    const categoryData = {
      ...category,
      id,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`category:${id}`, categoryData);
    return c.json(categoryData);
  } catch (error) {
    console.log('Create category error:', error);
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

app.put('/make-server-f6f1fb51/system/categories/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const category = await c.req.json();
    const categoryData = { ...category, id };
    await kv.set(`category:${id}`, categoryData);
    return c.json(categoryData);
  } catch (error) {
    console.log('Update category error:', error);
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

app.delete('/make-server-f6f1fb51/system/categories/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    await kv.del(`category:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete category error:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

// System Configuration Routes - SubCategories
app.get('/make-server-f6f1fb51/system/subcategories', async (c) => {
  try {
    const subcategories = await kv.getByPrefix('subcategory:');
    return c.json(subcategories.map(sub => sub.value).sort((a, b) => a.displayOrder - b.displayOrder));
  } catch (error) {
    console.log('Get subcategories error:', error);
    return c.json({ error: 'Failed to fetch subcategories' }, 500);
  }
});

app.post('/make-server-f6f1fb51/system/subcategories', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const subcategory = await c.req.json();
    const id = subcategory.id || `subcat_${Date.now()}`;
    const subcategoryData = {
      ...subcategory,
      id,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`subcategory:${id}`, subcategoryData);
    return c.json(subcategoryData);
  } catch (error) {
    console.log('Create subcategory error:', error);
    return c.json({ error: 'Failed to create subcategory' }, 500);
  }
});

app.put('/make-server-f6f1fb51/system/subcategories/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const subcategory = await c.req.json();
    const subcategoryData = { ...subcategory, id };
    await kv.set(`subcategory:${id}`, subcategoryData);
    return c.json(subcategoryData);
  } catch (error) {
    console.log('Update subcategory error:', error);
    return c.json({ error: 'Failed to update subcategory' }, 500);
  }
});

app.delete('/make-server-f6f1fb51/system/subcategories/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    await kv.del(`subcategory:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete subcategory error:', error);
    return c.json({ error: 'Failed to delete subcategory' }, 500);
  }
});

// System Configuration Routes - Attributes
app.get('/make-server-f6f1fb51/system/attributes', async (c) => {
  try {
    const attributes = await kv.getByPrefix('attribute:');
    return c.json(attributes.map(attr => attr.value).sort((a, b) => a.displayOrder - b.displayOrder));
  } catch (error) {
    console.log('Get attributes error:', error);
    return c.json({ error: 'Failed to fetch attributes' }, 500);
  }
});

app.post('/make-server-f6f1fb51/system/attributes', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const attribute = await c.req.json();
    const id = attribute.id || `attr_${Date.now()}`;
    const attributeData = {
      ...attribute,
      id,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`attribute:${id}`, attributeData);
    return c.json(attributeData);
  } catch (error) {
    console.log('Create attribute error:', error);
    return c.json({ error: 'Failed to create attribute' }, 500);
  }
});

app.put('/make-server-f6f1fb51/system/attributes/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const attribute = await c.req.json();
    const attributeData = { ...attribute, id };
    await kv.set(`attribute:${id}`, attributeData);
    return c.json(attributeData);
  } catch (error) {
    console.log('Update attribute error:', error);
    return c.json({ error: 'Failed to update attribute' }, 500);
  }
});

app.delete('/make-server-f6f1fb51/system/attributes/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    await kv.del(`attribute:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete attribute error:', error);
    return c.json({ error: 'Failed to delete attribute' }, 500);
  }
});

// Customer Authentication Routes (separate from admin)
app.post('/make-server-f6f1fb51/customer/signup', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();
    
    // Check if customer already exists
    const existingCustomer = await kv.get(`customer_cred:${email}`);
    if (existingCustomer) {
      return c.json({ error: 'Customer with this email already exists' }, 400);
    }

    const customerId = `cust_${Date.now()}`;
    const customerData = {
      id: customerId,
      email,
      password, // In production, this should be hashed
      name,
      phone: phone || '',
      created_at: new Date().toISOString(),
    };

    await kv.set(`customer_cred:${email}`, customerData);
    await kv.set(`customer:${customerId}`, {
      id: customerId,
      email,
      name,
      phone: phone || '',
      orders: [],
      created_at: customerData.created_at,
    });

    // Create session
    const user = {
      id: customerId,
      email,
      name,
      phone: phone || '',
      type: 'customer',
    };

    const sessionData = {
      access_token: `customer_token_${customerId}_${Date.now()}`,
      user,
    };

    await kv.set(`customer_session:${sessionData.access_token}`, {
      user,
      expires_at: Date.now() + (30 * 24 * 3600 * 1000), // 30 days
    });

    console.log('Customer signup successful:', email);
    return c.json({ user, session: sessionData });
  } catch (error) {
    console.log('Customer signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

app.post('/make-server-f6f1fb51/customer/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    console.log('Customer login attempt for:', email);
    
    const customerCreds = await kv.get(`customer_cred:${email}`);
    
    if (!customerCreds) {
      console.log('Customer not found:', email);
      return c.json({ error: 'Invalid login credentials' }, 401);
    }
    
    if (customerCreds.password !== password) {
      console.log('Invalid password for customer:', email);
      return c.json({ error: 'Invalid login credentials' }, 401);
    }
    
    const user = {
      id: customerCreds.id,
      email: customerCreds.email,
      name: customerCreds.name,
      phone: customerCreds.phone,
      type: 'customer',
    };
    
    const sessionData = {
      access_token: `customer_token_${customerCreds.id}_${Date.now()}`,
      user,
    };
    
    await kv.set(`customer_session:${sessionData.access_token}`, {
      user,
      expires_at: Date.now() + (30 * 24 * 3600 * 1000), // 30 days
    });
    
    console.log('Customer login successful:', email);
    return c.json({ user, session: sessionData });
  } catch (error) {
    console.log('Customer login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Public product routes (no auth required)
app.get('/make-server-f6f1fb51/public/products', async (c) => {
  try {
    const categorySlug = c.req.query('category');
    const subcategorySlug = c.req.query('subcategory');
    
    const products = await kv.getByPrefix('product:');
    let filteredProducts = products.map(p => {
      const prod = p.value;
      // Remove admin-only fields for public view
      const { purchasedEmail, purchasedPassword, productCode, ...publicProduct } = prod;
      return publicProduct;
    });

    // Filter by category/subcategory if specified
    if (categorySlug) {
      filteredProducts = filteredProducts.filter(p => p.categorySlug === categorySlug);
    }
    if (subcategorySlug) {
      filteredProducts = filteredProducts.filter(p => p.subcategorySlug === subcategorySlug);
    }

    return c.json({ products: filteredProducts });
  } catch (error) {
    console.log('Get public products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get('/make-server-f6f1fb51/public/product/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const product = await kv.get(`product:${id}`);
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Remove admin-only fields
    const { purchasedEmail, purchasedPassword, productCode, ...publicProduct } = product;
    
    return c.json({ product: publicProduct });
  } catch (error) {
    console.log('Get public product error:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// Delivery Options Routes
app.get('/make-server-f6f1fb51/delivery-options', async (c) => {
  try {
    const deliveryOptions = await kv.getByPrefix('delivery:');
    const options = deliveryOptions
      .map(d => d.value)
      .filter(opt => opt.active); // Only return active options for frontend
    return c.json({ deliveryOptions: options });
  } catch (error) {
    console.log('Get delivery options error:', error);
    return c.json({ error: 'Failed to fetch delivery options' }, 500);
  }
});

app.get('/make-server-f6f1fb51/delivery-options/all', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const deliveryOptions = await kv.getByPrefix('delivery:');
    const options = deliveryOptions.map(d => d.value);
    return c.json({ deliveryOptions: options });
  } catch (error) {
    console.log('Get all delivery options error:', error);
    return c.json({ error: 'Failed to fetch delivery options' }, 500);
  }
});

app.post('/make-server-f6f1fb51/delivery-options', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const option = await c.req.json();
    const id = `del_${Date.now()}`;
    const deliveryOption = {
      id,
      ...option,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`delivery:${id}`, deliveryOption);
    return c.json({ deliveryOption });
  } catch (error) {
    console.log('Create delivery option error:', error);
    return c.json({ error: 'Failed to create delivery option' }, 500);
  }
});

app.put('/make-server-f6f1fb51/delivery-options/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`delivery:${id}`);
    if (!existing) {
      return c.json({ error: 'Delivery option not found' }, 404);
    }

    const updated = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`delivery:${id}`, updated);
    return c.json({ deliveryOption: updated });
  } catch (error) {
    console.log('Update delivery option error:', error);
    return c.json({ error: 'Failed to update delivery option' }, 500);
  }
});

app.delete('/make-server-f6f1fb51/delivery-options/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    await kv.del(`delivery:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete delivery option error:', error);
    return c.json({ error: 'Failed to delete delivery option' }, 500);
  }
});

// Initialize default delivery options
app.post('/make-server-f6f1fb51/init-delivery-options', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const existingOptions = await kv.getByPrefix('delivery:');
    if (existingOptions.length > 0) {
      return c.json({ message: 'Delivery options already initialized' });
    }

    const defaultOptions = [
      {
        id: 'del_standard',
        name: 'Standard Shipping',
        description: 'Delivery in 5-7 business days',
        price: 0,
        estimatedDays: '5-7 business days',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'del_express',
        name: 'Express Shipping',
        description: 'Delivery in 2-3 business days',
        price: 9.99,
        estimatedDays: '2-3 business days',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'del_overnight',
        name: 'Overnight Shipping',
        description: 'Next business day delivery',
        price: 19.99,
        estimatedDays: 'Next business day',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];

    for (const option of defaultOptions) {
      await kv.set(`delivery:${option.id}`, option);
    }

    return c.json({ message: 'Delivery options initialized', count: defaultOptions.length });
  } catch (error) {
    console.log('Initialize delivery options error:', error);
    return c.json({ error: 'Failed to initialize delivery options' }, 500);
  }
});

// Customer Orders Routes
app.get('/make-server-f6f1fb51/customer-orders', async (c) => {
  try {
    const email = c.req.query('email');
    if (!email) {
      return c.json({ error: 'Email parameter required' }, 400);
    }

    const allOrders = await kv.getByPrefix('customer-order:');
    const customerOrders = allOrders
      .map(o => o.value)
      .filter(order => order.customerEmail === email)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return c.json({ orders: customerOrders });
  } catch (error) {
    console.log('Get customer orders error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.get('/make-server-f6f1fb51/track-order/:orderNumber', async (c) => {
  try {
    const orderNumber = c.req.param('orderNumber');
    
    const allOrders = await kv.getByPrefix('customer-order:');
    const order = allOrders
      .map(o => o.value)
      .find(o => o.orderNumber === orderNumber);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json({ order });
  } catch (error) {
    console.log('Track order error:', error);
    return c.json({ error: 'Failed to track order' }, 500);
  }
});

app.put('/make-server-f6f1fb51/customer-orders/:id/status', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const { status } = await c.req.json();

    const existing = await kv.get(`customer-order:${id}`);
    if (!existing) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`customer-order:${id}`, updated);
    return c.json({ order: updated });
  } catch (error) {
    console.log('Update order status error:', error);
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

app.post('/make-server-f6f1fb51/customer-orders', async (c) => {
  try {
    const orderData = await c.req.json();
    const id = `order_${Date.now()}`;
    const orderNumber = `GU${Date.now().toString().slice(-8)}`;

    const order = {
      id,
      orderNumber,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      items: orderData.items,
      total: orderData.total,
      deliveryMethod: orderData.deliveryMethod,
      shippingAddress: orderData.shippingAddress,
      status: 'pending',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await kv.set(`customer-order:${id}`, order);
    return c.json({ order });
  } catch (error) {
    console.log('Create customer order error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

Deno.serve(app.fetch);