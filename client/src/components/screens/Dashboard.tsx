import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Percent, Globe } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { KPICard } from '../ui/KPICard';
import { Card } from '../ui/card';
import { useStoreSettings } from '../../context/StoreSettingsContext';

const salesData = [
  { month: 'Jan', sales: 4200, earning: 3200 },
  { month: 'Feb', sales: 3800, earning: 2900 },
  { month: 'Mar', sales: 5100, earning: 3800 },
  { month: 'Apr', sales: 4600, earning: 3500 },
  { month: 'May', sales: 5400, earning: 4100 },
  { month: 'Jun', sales: 6200, earning: 4800 },
  { month: 'Jul', sales: 5900, earning: 4500 },
  { month: 'Aug', sales: 6800, earning: 5200 },
  { month: 'Sep', sales: 7200, earning: 5600 },
  { month: 'Oct', sales: 6900, earning: 5300 },
  { month: 'Nov', sales: 7800, earning: 6100 },
  { month: 'Dec', sales: 8500, earning: 6700 },
];

const topProducts = [
  { id: 1, name: 'PlayStation 5 Console', sales: 1245, revenue: 623755, image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=200&h=200&fit=crop' },
  { id: 2, name: 'DualSense Controller', sales: 2840, revenue: 199800, image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=200&h=200&fit=crop' },
  { id: 3, name: 'PS5 VR Headset', sales: 856, revenue: 427144, image: 'https://images.unsplash.com/photo-1617802690658-1173a812650d?w=200&h=200&fit=crop' },
  { id: 4, name: 'Spider-Man 2', sales: 1520, revenue: 106400, image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&h=200&fit=crop' },
];

const recentOrders = [
  { id: '#PS-10234', customer: 'Alex Johnson', product: 'PS5 Console + 2 Games', status: 'completed', amount: 599.99, date: 'Jan 4, 2026' },
  { id: '#PS-10235', customer: 'Sarah Williams', product: 'DualSense Midnight Black', status: 'pending', amount: 74.99, date: 'Jan 4, 2026' },
  { id: '#PS-10236', customer: 'Mike Chen', product: 'PS5 Digital Edition', status: 'processing', amount: 449.99, date: 'Jan 3, 2026' },
  { id: '#PS-10237', customer: 'Emma Davis', product: 'PlayStation Plus 12-Month', status: 'completed', amount: 59.99, date: 'Jan 3, 2026' },
  { id: '#PS-10238', customer: 'James Wilson', product: 'PS VR2 Horizon Bundle', status: 'completed', amount: 599.99, date: 'Jan 2, 2026' },
];

const trafficData = [
  { name: 'Direct', value: 35, color: '#DC2626' },
  { name: 'Social', value: 25, color: '#EF4444' },
  { name: 'Organic', value: 30, color: '#F87171' },
  { name: 'Referral', value: 10, color: '#FCA5A5' },
];

export function Dashboard() {
  const { formatPrice } = useStoreSettings();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Here is the summary of overall data</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={formatPrice(847239)}
          change={12.5}
          trend="up"
          icon={DollarSign}
          chartData={salesData}
          chartColor="#3B82F6"
        />
        <KPICard
          title="Orders"
          value="12,458"
          change={8.2}
          trend="up"
          icon={ShoppingCart}
          chartData={salesData.map(d => ({ value: d.sales }))}
          chartColor="#10B981"
          chartType="bar"
        />
        <KPICard
          title="Active Customers"
          value="8,234"
          change={3.8}
          trend="up"
          icon={Users}
          chartData={salesData}
          chartColor="#8B5CF6"
        />
        <KPICard
          title="Conversion Rate"
          value="4.8%"
          change={2.1}
          trend="up"
          icon={Percent}
          chartData={salesData}
          chartColor="#EC4899"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Product Sales</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Sales: 2590</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Earning: {formatPrice(27208)}</span>
                </div>
              </div>
            </div>
            <select className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>All Category</option>
              <option>Consoles</option>
              <option>Accessories</option>
              <option>Games</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line type="monotone" dataKey="sales" stroke="#DC2626" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="earning" stroke="#FBBF24" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Traffic Source */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Sales by Traffic Source</h3>
            <select className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={trafficData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {trafficData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {trafficData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Selling Products</h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{order.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{order.customer}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(order.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}