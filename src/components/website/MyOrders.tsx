import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, ShoppingCart, RefreshCw, Eye, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import { publicAnonKey } from '../../utils/supabase/info';
import { BASE_URL } from '../../utils/api';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: any[];
  total: number;
  deliveryMethod: string;
  shippingAddress?: any;
}

interface MyOrdersProps {
  onBack: () => void;
  onOrderAgain: (items: any[]) => void;
  onTrackOrder: (orderNumber: string) => void;
}

export function MyOrders({ onBack, onOrderAgain, onTrackOrder }: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserAndOrders();
  }, []);

  const loadUserAndOrders = async () => {
    const savedSession = localStorage.getItem('customerSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUser(session.user);
        await loadOrders(session.user.email);
      } catch (error) {
        console.error('Error loading user session:', error);
      }
    }
    setLoading(false);
  };

  const loadOrders = async (email: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/customer-orders?email=${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleOrderAgain = (order: Order) => {
    onOrderAgain(order.items);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">View and track your order history</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here!</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium shadow-lg shadow-red-500/30 hover:shadow-xl transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-100 mb-1">Order #{order.orderNumber}</p>
                      <p className="text-2xl font-bold">${order.total.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-100 mb-1">Order Date</p>
                      <p className="font-semibold">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        via {order.deliveryMethod}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {selectedOrder?.id === order.id ? 'Hide' : 'View'} Details
                      </button>
                      <button
                        onClick={() => handleOrderAgain(order)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium shadow-lg shadow-red-500/30 hover:shadow-xl transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Order Again
                      </button>
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>{order.items.length} item(s)</span>
                  </div>

                  {/* Expanded Order Details */}
                  {selectedOrder?.id === order.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-gray-200"
                    >
                      <h4 className="font-bold text-gray-900 mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{item.name}</h5>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              <p className="text-sm font-bold text-red-600 mt-1">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="mt-6">
                          <h4 className="font-bold text-gray-900 mb-2">Shipping Address</h4>
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.zipCode}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.country}
                          </p>
                        </div>
                      )}

                      {/* Track Order Button */}
                      <div className="mt-6">
                        <button
                          onClick={() => onTrackOrder(order.orderNumber)}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium shadow-lg shadow-red-500/30 hover:shadow-xl transition-all"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Track Order
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}