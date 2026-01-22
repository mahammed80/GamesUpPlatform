import { useState, useEffect } from 'react';
import { Search, Eye, Download } from 'lucide-react';
import { Card } from '../ui/Card';
import { ordersAPI } from '../../utils/api';

interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  date: string;
  status: string;
  amount: string;
  items: number;
  digital_email?: string;
  digital_password?: string;
  digital_code?: string;
  inventory_id?: string;
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadOrders();
  }, [searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getAll({ 
        status: statusFilter,
        search: searchQuery 
      });
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      // Fallback or empty state handled by default empty array
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track all orders</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{orders.length}</p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {orders.filter((o) => o.status === 'pending').length}
          </p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Processing</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {orders.filter((o) => o.status === 'processing').length}
          </p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {orders.filter((o) => o.status === 'completed').length}
          </p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {orders.filter((o) => o.status === 'cancelled').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders or customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="p-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Digital Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Digital Password</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Digital Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Inventory ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{order.id}</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{order.customer}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                      <div>
                        <p>{order.product}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{order.items} item(s)</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{order.digital_email || '-'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{order.digital_password || '-'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{order.digital_code || '-'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{order.inventory_id || '-'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{order.date}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{order.amount}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end">
                        <button className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
