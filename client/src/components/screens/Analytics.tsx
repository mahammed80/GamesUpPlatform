import { useState } from 'react';
import { TrendingUp, Download, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useStoreSettings } from '../../context/StoreSettingsContext';

const revenueData = [
  { month: 'Jan', revenue: 45200, orders: 234, profit: 18500 },
  { month: 'Feb', revenue: 38900, orders: 198, profit: 15800 },
  { month: 'Mar', revenue: 52300, orders: 276, profit: 21200 },
  { month: 'Apr', revenue: 48700, orders: 251, profit: 19400 },
  { month: 'May', revenue: 59100, orders: 312, profit: 24100 },
  { month: 'Jun', revenue: 67800, orders: 358, profit: 28300 },
  { month: 'Jul', revenue: 63400, orders: 334, profit: 26200 },
  { month: 'Aug', revenue: 72500, orders: 389, profit: 30800 },
  { month: 'Sep', revenue: 78900, orders: 421, profit: 33500 },
  { month: 'Oct', revenue: 71200, orders: 374, profit: 29800 },
  { month: 'Nov', revenue: 84600, orders: 456, profit: 36200 },
  { month: 'Dec', revenue: 92300, orders: 498, profit: 39500 },
];

const categoryData = [
  { name: 'Consoles', value: 42, color: '#DC2626' },
  { name: 'Games', value: 28, color: '#EF4444' },
  { name: 'Accessories', value: 20, color: '#F87171' },
  { name: 'Services', value: 10, color: '#FCA5A5' },
];

const topRegions = [
  { region: 'North America', revenue: 342500, growth: 15.2, flag: '🇺🇸' },
  { region: 'Europe', revenue: 289300, growth: 12.8, flag: '🇪🇺' },
  { region: 'Asia Pacific', revenue: 215600, growth: 24.5, flag: '🇯🇵' },
  { region: 'Latin America', revenue: 98400, growth: 18.3, flag: '🇧🇷' },
  { region: 'Middle East', revenue: 54200, growth: 9.7, flag: '🇦🇪' },
];

export function Analytics() {
  const { formatPrice } = useStoreSettings();
  const [dateRange, setDateRange] = useState('12months');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Revenue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Detailed insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
          <Button icon={Download}>Export Report</Button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{formatPrice(847239)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">+18.2%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">vs last year</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-700 shadow-lg shadow-green-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net Profit</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{formatPrice(312845)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">+22.4%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">vs last year</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Order Value</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{formatPrice(68.02)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">+5.8%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">vs last year</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monthly revenue and profit trends</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={revenueData}>
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
            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Breakdown & Top Regions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Revenue by Category</h3>
          <div className="flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Regions */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Top Regions by Revenue</h3>
          <div className="space-y-4">
            {topRegions.map((region, index) => (
              <div
                key={region.region}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-2xl">
                  {region.flag}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{region.region}</h4>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(region.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                        style={{ width: `${region.growth * 3}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-green-500">+{region.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Orders Chart */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Orders</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total orders processed each month</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={revenueData}>
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
            <Bar dataKey="orders" fill="#DC2626" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}