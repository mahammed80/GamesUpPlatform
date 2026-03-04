import { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, Key, Search, Mail, Calendar, List, Tag, User } from 'lucide-react';
import { Card } from '../ui/card';
import { productsAPI, customersAPI, categoriesAPI } from '../../utils/api';

interface ProductOverview {
  product: {
    id: number;
    name: string;
    image: string;
  };
  stats: {
    totalSold: number;
    totalRemaining: number;
  };
  remainingItems: Array<{
    email?: string;
    password?: string;
    code?: string;
    type?: string;
    status?: string;
  }>;
  soldItems: Array<{
    orderId: number;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    date: string;
    email?: string;
    password?: string;
    code?: string;
  }>;
  customers: Array<{
    name: string;
    email: string;
    date: string;
    orderNumber: string;
  }>;
}

export function ProductDataOverview() {
  const [view, setView] = useState<'product_details' | 'all_products' | 'all_customers' | 'categories'>('product_details');
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'sold' | 'customers'>('overview');

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadOverview(selectedProductId);
    }
  }, [selectedProductId]);

  const loadProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      if (res.products || Array.isArray(res)) {
        const productList = res.products || res;
        setProducts(productList);
        if (productList.length > 0 && !selectedProductId) {
          setSelectedProductId(productList[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await customersAPI.getAll();
      if (res.customers) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      if (Array.isArray(res)) {
        setCategories(res);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadOverview = async (id: string) => {
    setLoading(true);
    try {
      const res = await productsAPI.getOverview(id);
      setData(res);
    } catch (err) {
      console.error('Failed to load overview', err);
    } finally {
      setLoading(false);
    }
  };

  const renderProductDetails = () => {
    if (!selectedProductId && products.length === 0) {
      return <div className="p-6">Loading products...</div>;
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Product Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400">Select a product to view specific metrics</p>
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading data...</p>
          </div>
        ) : data ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Inventory</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.stats.totalRemaining + data.stats.totalSold}
                    </h3>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Sold Items</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.stats.totalSold}
                    </h3>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Key className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Remaining Stock</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.stats.totalRemaining}
                    </h3>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('sold')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'sold'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Sold / Used Keys
                </button>
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'customers'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Customers
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'inventory'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Remaining Inventory
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {activeTab === 'overview' && (
                <div className="p-6">
                  <div className="flex gap-6">
                    <img 
                      src={data.product.image} 
                      alt={data.product.name} 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{data.product.name}</h3>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>Total Sales: {data.stats.totalSold}</p>
                        <p>Current Stock: {data.stats.totalRemaining}</p>
                        <p>Total Customers: {data.customers.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sold' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Order #</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Delivered Key/Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.soldItems.map((item) => (
                        <tr key={item.orderId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                            {item.orderNumber}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900 dark:text-white">{item.customerName}</div>
                            <div className="text-xs text-gray-500">{item.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                            {item.code || item.password || item.email || 'N/A'}
                          </td>
                        </tr>
                      ))}
                      {data.soldItems.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No sales recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'customers' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Purchase Date</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Order #</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.customers.map((customer, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4">
                            <div className="text-gray-900 dark:text-white font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-500">{customer.email}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {new Date(customer.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {customer.orderNumber}
                          </td>
                        </tr>
                      ))}
                      {data.customers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No customers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Data</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.remainingItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 text-gray-900 dark:text-white capitalize">
                            {item.type || (item.code ? 'Code' : 'Account')}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                            {item.code ? `Code: ${item.code}` : `Email: ${item.email}`}
                            {item.password && <span className="ml-2 text-gray-400">| Pass: ***</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                              Available
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.remainingItems.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            Out of stock
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Select a product to view data
          </div>
        )}
      </div>
    );
  };

  const renderAllProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Listed Products</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total Products: {products.length}
        </div>
      </div>
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Product Name</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Price</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Stock Status</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => {
                 let stock = 0;
                 try {
                   const digitalItems = typeof product.digital_items === 'string' 
                     ? JSON.parse(product.digital_items) 
                     : (product.digital_items || []);
                   stock = digitalItems.length;
                 } catch (e) { stock = 0; }

                 return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 capitalize">
                      {product.category_slug?.replace(/-/g, ' ') || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stock > 0 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {stock > 0 ? `${stock} in stock` : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          setSelectedProductId(product.id.toString());
                          setView('product_details');
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        View Analytics
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderAllCustomers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Customers</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total Customers: {customers.length}
        </div>
      </div>
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Join Date</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Orders</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Total Spent</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {customer.joinDate}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    {customer.orders}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    ${typeof customer.spent === 'number' ? customer.spent.toFixed(2) : customer.spent}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customer.status === 'VIP'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product Categories</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total Categories: {categories.length}
        </div>
      </div>
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Icon</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Slug</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                      {category.icon || '📦'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {category.description || 'No description'}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Overview</h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive view of your platform data</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setView('product_details')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'product_details'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Product Details</span>
            </div>
          </button>
          <button
            onClick={() => setView('all_products')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'all_products'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <List className="w-4 h-4" />
              <span>All Products</span>
            </div>
          </button>
          <button
            onClick={() => setView('all_customers')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'all_customers'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Customers</span>
            </div>
          </button>
          <button
            onClick={() => setView('categories')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'categories'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>Categories</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {view === 'product_details' && renderProductDetails()}
      {view === 'all_products' && renderAllProducts()}
      {view === 'all_customers' && renderAllCustomers()}
      {view === 'categories' && renderCategories()}
    </div>
  );
}
