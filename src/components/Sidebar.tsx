import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Users, CheckSquare, UserCog, Settings, LogOut, ChevronLeft, Shield, Mail, Image, Clock, CreditCard, Layers, Truck, Key } from 'lucide-react';
import { Screen } from '../AdminApp';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  userRole?: string;
  userPermissions?: Record<string, boolean>;
}

const menuItems = [
  { id: 'dashboard' as Screen, label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
  { id: 'products' as Screen, label: 'Products', icon: Package, roles: ['admin', 'manager'] },
  { id: 'orders' as Screen, label: 'Orders', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
  { id: 'sold-products' as Screen, label: 'Sold Products', icon: Key, roles: ['admin', 'manager'] },
  { id: 'pos' as Screen, label: 'Point of Sale', icon: CreditCard, roles: ['admin', 'manager', 'staff'] },
  { id: 'analytics' as Screen, label: 'Analytics & Revenue', icon: TrendingUp, roles: ['admin', 'manager'] },
  { id: 'customers' as Screen, label: 'Customers', icon: Users, roles: ['admin', 'manager', 'staff'] },
  { id: 'banners' as Screen, label: 'Banners', icon: Image, roles: ['admin', 'manager'] },
  { id: 'outlook' as Screen, label: 'Outlook Accounts', icon: Mail, roles: ['admin'] },
  { id: 'hr' as Screen, label: 'HR & Attendance', icon: Clock, roles: ['admin', 'manager'] },
  { id: 'tasks' as Screen, label: 'Tasks', icon: CheckSquare, roles: ['admin', 'manager', 'staff'] },
  { id: 'team' as Screen, label: 'Team Members', icon: UserCog, roles: ['admin', 'manager'] },
  { id: 'roles' as Screen, label: 'Roles & Access', icon: Shield, roles: ['admin'] },
  { id: 'system' as Screen, label: 'System', icon: Layers, roles: ['admin'] },
  { id: 'delivery' as Screen, label: 'Delivery Options', icon: Truck, roles: ['admin', 'manager'] },
  { id: 'settings' as Screen, label: 'Settings', icon: Settings, roles: ['admin', 'manager'] },
];

export function Sidebar({ currentScreen, onNavigate, collapsed, onToggleCollapse, onLogout, userRole = 'admin', userPermissions }: SidebarProps) {
  // Filter menu items based on user permissions or role
  const filteredMenuItems = menuItems.filter(item => {
    // If permissions are present, use them
    if (userPermissions && Object.keys(userPermissions).length > 0) {
      return !!userPermissions[item.id];
    }
    
    // Fallback to role-based filtering (legacy support)
    if (userRole === 'admin') return true;
    return item.roles.includes(userRole);
  });

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">GU</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Games - Up</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}