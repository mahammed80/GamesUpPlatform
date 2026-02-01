import { projectId, publicAnonKey, functionName } from './supabase/info';

// If VITE_API_URL is provided (e.g. for production), use it.
// Otherwise, check VITE_USE_LOCAL_SERVER to decide between localhost and Supabase.
const USE_LOCAL_SERVER = import.meta.env.VITE_USE_LOCAL_SERVER === 'true';
const CUSTOM_API_URL = import.meta.env.VITE_API_URL;

export const BASE_URL = CUSTOM_API_URL || (USE_LOCAL_SERVER 
  ? `http://localhost:3001/functions/v1/${functionName}`
  : `https://${projectId}.supabase.co/functions/v1/${functionName}`);

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = accessToken || publicAnonKey;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  console.log('API Request:', {
    endpoint,
    hasAccessToken: !!accessToken,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
  });

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error('API Error:', response.status, error);
    throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  signup: async (email: string, password: string, name: string) => {
    // Auth endpoints don't need authorization header
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Signup failed' }));
      console.error('Signup Error:', response.status, error);
      throw new Error(error.error || error.message || 'Signup failed');
    }

    return response.json();
  },

  login: async (email: string, password: string) => {
    console.log('Attempting login for:', email);
    
    // Auth endpoints don't need authorization header
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      console.error('Login Error:', response.status, error);
      throw new Error(error.error || error.message || 'Invalid login credentials');
    }

    const data = await response.json();
    console.log('Login successful');
    return data;
  },
};

// Products API
export const productsAPI = {
  getAll: () => fetchAPI('/products'),
  getPublic: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return fetchAPI(`/public/products?${params.toString()}`);
  },
  create: (product: any) => fetchAPI('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  update: (id: string | number, product: any) => fetchAPI(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  delete: (id: string | number) => fetchAPI(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// Orders API
export const ordersAPI = {
  getAll: (params?: { status?: string; search?: string; email?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.email) queryParams.append('email', params.email);
    return fetchAPI(`/orders?${queryParams.toString()}`);
  },
  update: (id: string | number, order: any) => fetchAPI(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(order),
  }),
};

// Customers API
export const customersAPI = {
  getAll: () => fetchAPI('/admin/customers'),
  update: (id: string | number, customer: any) => fetchAPI(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer),
  }),
};

// Tasks API
export const tasksAPI = {
  getAll: () => fetchAPI('/tasks'),
  create: (task: any) => fetchAPI('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  update: (id: string | number, task: any) => fetchAPI(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  }),
  delete: (id: string | number) => fetchAPI(`/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// Team API
export const teamAPI = {
  getAll: () => fetchAPI('/team'),
  update: (id: string | number, member: any) => fetchAPI(`/team/${id}`, {
    method: 'PUT',
    body: JSON.stringify(member),
  }),
};

// Settings API
export const settingsAPI = {
  get: () => fetchAPI('/settings'),
  update: (settings: any) => fetchAPI('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};

// Banners API
export const bannersAPI = {
  getAll: () => fetchAPI('/banners'),
  create: (banner: any) => fetchAPI('/banners', {
    method: 'POST',
    body: JSON.stringify(banner),
  }),
  update: (id: string | number, banner: any) => fetchAPI(`/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(banner),
  }),
  delete: (id: string | number) => fetchAPI(`/banners/${id}`, {
    method: 'DELETE',
  }),
};

// HR API
export const hrAPI = {
  getAttendance: (date: string) => fetchAPI(`/hr/attendance?date=${date}`),
  getEmployees: () => fetchAPI('/hr/employees'),
  markAttendance: (attendance: any) => fetchAPI('/hr/attendance', {
    method: 'POST',
    body: JSON.stringify(attendance),
  }),
  updateAttendance: (id: string | number, attendance: any) => fetchAPI(`/hr/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(attendance),
  }),
};

// POS API
export const posAPI = {
  createInvoice: (invoice: any) => fetchAPI('/pos/invoice', {
    method: 'POST',
    body: JSON.stringify(invoice),
  }),
  getInvoices: () => fetchAPI('/pos/invoices'),
};

// Init API
export const initAPI = {
  initialize: () => fetchAPI('/init', {
    method: 'POST',
  }),
};

// Roles API
export const rolesAPI = {
  getAll: () => fetchAPI('/roles'),
  create: (role: any) => fetchAPI('/roles', {
    method: 'POST',
    body: JSON.stringify(role),
  }),
  update: (id: string | number, role: any) => fetchAPI(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(role),
  }),
  delete: (id: string | number) => fetchAPI(`/roles/${id}`, {
    method: 'DELETE',
  }),
  createAdminUser: (user: any) => fetchAPI('/admin/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
};

// Admin API
export const adminAPI = {
  getSoldProducts: () => fetchAPI('/admin/sold-products'),
};
