import { useState } from 'react';
import { Search, Star, Mail, Phone, MapPin, X } from 'lucide-react';
import { Card } from '../ui/Card';

const customers = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex.j@email.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    orders: 24,
    spent: '$2,845.50',
    status: 'VIP',
    joinDate: 'Mar 2024',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  {
    id: 2,
    name: 'Sarah Williams',
    email: 'sarah.w@email.com',
    phone: '+1 (555) 234-5678',
    location: 'Los Angeles, USA',
    orders: 18,
    spent: '$1,987.30',
    status: 'Regular',
    joinDate: 'May 2024',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    id: 3,
    name: 'Mike Chen',
    email: 'mike.c@email.com',
    phone: '+1 (555) 345-6789',
    location: 'San Francisco, USA',
    orders: 31,
    spent: '$4,234.80',
    status: 'VIP',
    joinDate: 'Jan 2024',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    id: 4,
    name: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '+1 (555) 456-7890',
    location: 'Chicago, USA',
    orders: 12,
    spent: '$1,456.20',
    status: 'Regular',
    joinDate: 'Jun 2024',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  },
  {
    id: 5,
    name: 'James Wilson',
    email: 'james.w@email.com',
    phone: '+1 (555) 567-8901',
    location: 'Boston, USA',
    orders: 8,
    spent: '$892.40',
    status: 'Regular',
    joinDate: 'Aug 2024',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  },
];

const orderHistory = [
  { id: '#PS-10234', product: 'PS5 Console', date: 'Jan 4, 2026', amount: '$499.99', status: 'Completed' },
  { id: '#PS-10189', product: 'DualSense Controller', date: 'Dec 28, 2025', amount: '$69.99', status: 'Completed' },
  { id: '#PS-10145', product: 'God of War Ragnarök', date: 'Dec 15, 2025', amount: '$69.99', status: 'Completed' },
];

export function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage customer profiles and relationships</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{customers.length}</p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">VIP Customers</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {customers.filter((c) => c.status === 'VIP').length}
          </p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Orders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {Math.round(customers.reduce((acc, c) => acc + c.orders, 0) / customers.length)}
          </p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Lifetime Value</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">$2,283</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            className="cursor-pointer hover:shadow-lg hover:border-red-500 dark:hover:border-red-500 transition-all p-8"
            onClick={() => setSelectedCustomer(customer)}
          >
            <div className="flex items-start gap-4">
              <img src={customer.avatar} alt={customer.name} className="w-16 h-16 rounded-full object-cover" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h4>
                  {customer.status === 'VIP' && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      VIP
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{customer.email}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Orders</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{customer.orders}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Spent</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{customer.spent}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Customer Details Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}></div>
          <div className="relative w-full max-w-lg h-full bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customer Details</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-start gap-4">
                <img
                  src={selectedCustomer.avatar}
                  alt={selectedCustomer.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</h3>
                    {selectedCustomer.status === 'VIP' && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customer since {selectedCustomer.joinDate}</p>
                </div>
              </div>

              {/* Contact Info */}
              <Card className="p-8">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedCustomer.location}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{selectedCustomer.orders}</p>
                </Card>
                <Card className="p-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{selectedCustomer.spent}</p>
                </Card>
              </div>

              {/* Order History */}
              <Card>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h4>
                <div className="space-y-3">
                  {orderHistory.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{order.id}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.product}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{order.amount}</p>
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Notes */}
              <Card>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Notes</h4>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Add notes about this customer..."
                ></textarea>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}