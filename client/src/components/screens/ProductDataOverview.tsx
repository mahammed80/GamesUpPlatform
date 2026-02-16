import { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, Key, Search, Mail, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { productsAPI } from '../../utils/api';

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
  const [products, setProducts] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'sold' | 'customers'>('overview');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadOverview(selectedProductId);
    }
  }, [selectedProductId]);

  const loadProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      if (res.products) {
        setProducts(res.products);
        if (res.products.length > 0) {
          setSelectedProductId(res.products[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Failed to load products', err);
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

  if (!selectedProductId && products.length === 0) {
    return <div className="p-6">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Data Overview</h1>
          <p className="text-gray-500 dark:text-gray-400">Track inventory, sales, and customers per product</p>
        </div>
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Product
          </label>
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

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            
            {/* SOLD ITEMS TABLE */}
            {activeTab === 'sold' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Date</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Customer</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Order</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Sent Data (Email / Pass / Code)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.soldItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-medium">
                          No items sold yet.
                        </td>
                      </tr>
                    ) : (
                      data.soldItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 dark:text-white">{item.customerName}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4 text-blue-700 dark:text-blue-300 font-mono font-bold">
                            {item.orderNumber}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                                {item.code && <div className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-2 py-1 rounded inline-block mr-2 font-mono"><span className="font-bold">Code:</span> {item.code}</div>}
                                {item.email && <div className="text-xs text-gray-800 dark:text-gray-200 font-medium"><span className="font-bold">Email:</span> {item.email}</div>}
                                {item.password && <div className="text-xs text-gray-800 dark:text-gray-200 font-medium"><span className="font-bold">Pass:</span> {item.password}</div>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* CUSTOMERS TABLE */}
            {activeTab === 'customers' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Customer Name</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Email</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Last Purchase Date</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Order Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.customers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      data.customers.map((c, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                            {c.name}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {c.email}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {new Date(c.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono">
                            {c.orderNumber}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* INVENTORY TABLE */}
            {activeTab === 'inventory' && (
              <div className="overflow-x-auto">
                 <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                        These items are currently available in stock and will be automatically assigned to new orders.
                    </p>
                 </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">#</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Code</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Account Email</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Account Password</th>
                      <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.remainingItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">
                          No items in inventory.
                        </td>
                      </tr>
                    ) : (
                      data.remainingItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">{idx + 1}</td>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">
                            {item.code || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                            {item.email || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-mono font-medium">
                            {item.password || '-'}
                          </td>
                          <td className="px-6 py-4">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Available
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* OVERVIEW SUMMARY */}
            {activeTab === 'overview' && (
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-2">
                            <span className="text-gray-500">Product Name</span>
                            <span className="font-medium text-gray-900 dark:text-white">{data.product.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-2">
                            <span className="text-gray-500">Total Sales Volume</span>
                            <span className="font-medium text-gray-900 dark:text-white">{data.stats.totalSold} Units</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-2">
                            <span className="text-gray-500">Current Stock Level</span>
                            <span className="font-medium text-gray-900 dark:text-white">{data.stats.totalRemaining} Units</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-2">
                            <span className="text-gray-500">Last Sale Date</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {data.soldItems.length > 0 ? new Date(data.soldItems[0].date).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Select a product to view details.
        </div>
      )}
    </div>
  );
}
