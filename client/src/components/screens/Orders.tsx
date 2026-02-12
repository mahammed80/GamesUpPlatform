import { useState, useEffect } from 'react';
import { Search, Eye, Download, FileText, Printer, X } from 'lucide-react';
import { Card } from '../ui/card';
import { ordersAPI, api } from '../../utils/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { QuickEditCell } from '../ui/QuickEditCell';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

interface Order {
  id: string;
  orderNumber?: string;
  customer: string;
  email: string;
  product: string;
  date: string;
  status: string;
  amount: number;
  items: number;
  digital_email?: string;
  digital_password?: string;
  digital_code?: string;
  inventory_id?: string;
  payment_method?: string;
  payment_proof?: string;
}

export function Orders() {
  const { settings, formatPrice } = useStoreSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showInvoice, setShowInvoice] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      // Optimistic update
      setOrders(orders.map(o => o.id === id ? { ...o, ...updates } : o));
      
      await ordersAPI.update(id, updates);
    } catch (err) {
      console.error('Failed to update order:', err);
      // Revert on error
      loadOrders();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
     updateOrder(id, { status: newStatus });
  };

  const handleViewProof = async (id: string, url: string) => {
    setViewingProof(url);
    
    // Delete the proof from server (viewed once)
    try {
      await api.delete(`/orders/${id}/payment-proof`);
      // Update local state to remove the proof button
      setOrders(prev => prev.map(o => o.id === id ? { ...o, payment_proof: undefined } : o));
    } catch (err) {
      console.error('Failed to delete proof:', err);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-content');
    if (!element || !selectedOrder) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          // Force light mode for PDF generation
          clonedDoc.documentElement.classList.remove('dark');
          const clonedElement = clonedDoc.getElementById('invoice-content');
          if (clonedElement) {
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#111827';
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${selectedOrder.orderNumber || selectedOrder.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'pending_approval':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
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
                  <td colSpan={13} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                      <QuickEditCell
                        value={order.digital_email || ''}
                        onSave={(val) => updateOrder(order.id, { digital_email: String(val) })}
                      />
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                      <QuickEditCell
                        value={order.digital_password || ''}
                        onSave={(val) => updateOrder(order.id, { digital_password: String(val) })}
                      />
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                      <QuickEditCell
                        value={order.digital_code || ''}
                        onSave={(val) => updateOrder(order.id, { digital_code: String(val) })}
                      />
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                      <QuickEditCell
                        value={order.inventory_id || ''}
                        onSave={(val) => updateOrder(order.id, { inventory_id: String(val) })}
                      />
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="capitalize">{order.payment_method?.replace('_', ' ') || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                      {order.payment_proof ? (
                        <button
                          onClick={() => handleViewProof(order.id, order.payment_proof!)}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{order.date}</td>
                    <td className="py-4 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{formatPrice(order.amount)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewInvoice(order)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(order)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="View Details"
                        >
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

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-black"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8 print:hidden">
                  <h2 className="text-2xl font-bold text-gray-900">Invoice Generated</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handlePrintInvoice}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Print Invoice"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowInvoice(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6" id="invoice-content" style={{
                  // Override Tailwind variables with Hex values for html2canvas compatibility
                  ['--color-gray-50' as any]: '#f9fafb',
                  ['--color-gray-100' as any]: '#f3f4f6',
                  ['--color-gray-200' as any]: '#e5e7eb',
                  ['--color-gray-300' as any]: '#d1d5db',
                  ['--color-gray-400' as any]: '#9ca3af',
                  ['--color-gray-500' as any]: '#6b7280',
                  ['--color-gray-600' as any]: '#4b5563',
                  ['--color-gray-700' as any]: '#374151',
                  ['--color-gray-800' as any]: '#1f2937',
                  ['--color-gray-900' as any]: '#111827',
                  ['--color-red-600' as any]: '#dc2626',
                  backgroundColor: '#ffffff', // Ensure white background for PDF
                  color: '#111827', // Default text color
                } as React.CSSProperties}>
                  <div className="flex justify-between items-start border-b border-gray-200 pb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">GamesUp Store</h3>
                      <p className="text-gray-500">123 Gaming Street</p>
                      <p className="text-gray-500">Tech City, TC 90210</p>
                      <p className="text-gray-500">contact@gamesup.com</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">Invoice #{selectedOrder.orderNumber || selectedOrder.id}</p>
                      <p className="text-gray-500">{selectedOrder.date}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 border-b border-gray-200 pb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Bill To:</h4>
                      <p className="text-gray-600">{selectedOrder.customer}</p>
                      <p className="text-gray-600">{selectedOrder.email}</p>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-semibold text-gray-900">Item</th>
                        <th className="text-center py-2 text-sm font-semibold text-gray-900">Qty</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-900">Price</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-3 text-sm text-gray-600">
                            <div>{selectedOrder.product}</div>
                          </td>
                          <td className="py-3 text-center text-sm text-gray-600">{selectedOrder.items}</td>
                          <td className="py-3 text-right text-sm text-gray-600">{formatPrice(selectedOrder.amount)}</td>
                          <td className="py-3 text-right text-sm font-medium text-gray-900">
                            {formatPrice(selectedOrder.amount)}
                          </td>
                        </tr>
                    </tbody>
                  </table>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">{formatPrice(selectedOrder.amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-red-600">{formatPrice(selectedOrder.amount)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500 print:hidden">
                   <p>Thank you for your business!</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Order ID</h3>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedOrder.orderNumber || selectedOrder.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Date</h3>
                      <p className="text-gray-900 dark:text-white">{selectedOrder.date}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Amount</h3>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatPrice(selectedOrder.amount)}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-gray-900 dark:text-white">{selectedOrder.customer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-gray-900 dark:text-white">{selectedOrder.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Details</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.product}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedOrder.items} item(s)</p>
                    </div>
                  </div>

                  {/* Digital Delivery Info - The requested feature */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                        <FileText className="w-4 h-4" />
                      </span>
                      Digital Delivery
                    </h3>
                    <div className="grid grid-cols-1 gap-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Digital Email
                        </label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={selectedOrder.digital_email || ''} 
                            readOnly 
                            className="flex-1 bg-white dark:bg-gray-800 border-none rounded-lg py-2 px-3 text-gray-900 dark:text-white shadow-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Password
                          </label>
                          <input 
                            type="text" 
                            value={selectedOrder.digital_password || ''} 
                            readOnly 
                            className="w-full bg-white dark:bg-gray-800 border-none rounded-lg py-2 px-3 text-gray-900 dark:text-white shadow-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            License Code
                          </label>
                          <input 
                            type="text" 
                            value={selectedOrder.digital_code || ''} 
                            readOnly 
                            className="w-full bg-white dark:bg-gray-800 border-none rounded-lg py-2 px-3 text-gray-900 dark:text-white shadow-sm font-mono tracking-widest"
                          />
                        </div>
                      </div>

                      {selectedOrder.inventory_id && (
                        <div className="pt-2 border-t border-blue-200 dark:border-blue-800/50 mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Linked Inventory ID: <span className="font-mono text-gray-700 dark:text-gray-300">{selectedOrder.inventory_id}</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                      * These credentials are provided to the customer upon order completion.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowInvoice(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Invoice
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {viewingProof && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingProof(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Proof</h3>
                <button
                  onClick={() => setViewingProof(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <img 
                  src={viewingProof} 
                  alt="Payment Proof" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                 <button
                    onClick={() => window.open(viewingProof, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Open Original
                  </button>
                  <button
                    onClick={() => setViewingProof(null)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
