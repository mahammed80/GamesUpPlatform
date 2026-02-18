import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Login } from './components/Login';
import { Dashboard } from './components/screens/Dashboard';
import { Products } from './components/screens/Products';
import { ProductDataOverview } from './components/screens/ProductDataOverview';
import { Orders } from './components/screens/Orders';
import { Analytics } from './components/screens/Analytics';
import { Customers } from './components/screens/Customers';
import { Tasks } from './components/screens/Tasks';
import { TeamMembers } from './components/screens/TeamMembers';
import { Settings } from './components/screens/Settings';
import { Roles } from './components/screens/Roles';
import { Outlook } from './components/screens/Outlook';
import { Banners } from './components/screens/Banners';
import { HR } from './components/screens/HR';
import { POSNew } from './components/screens/POSNew';
import { System } from './components/screens/System';
import { Delivery } from './components/screens/Delivery';
import { SoldProducts } from './components/screens/SoldProducts';
import { EmailTemplates } from './components/screens/EmailTemplates';
import { setAccessToken } from './utils/api';
import { projectId } from './utils/supabase/info';

export type Screen = 'dashboard' | 'products' | 'data-overview' | 'orders' | 'sold-products' | 'analytics' | 'customers' | 'tasks' | 'team' | 'settings' | 'roles' | 'outlook' | 'banners' | 'hr' | 'pos' | 'system' | 'delivery' | 'email-templates';

export default function AdminApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedSession = localStorage.getItem('session');
    const savedUser = localStorage.getItem('user');
    
    if (savedSession && savedUser) {
      try {
        const parsedSession = JSON.parse(savedSession);
        const parsedUser = JSON.parse(savedUser);
        
        // Validate that the session has an access token
        if (parsedSession && parsedSession.access_token) {
          setSession(parsedSession);
          setUser(parsedUser);
          setAccessToken(parsedSession.access_token);
          setIsAuthenticated(true);
          console.log('Session restored from localStorage');
        } else {
          // Invalid session, clear storage
          console.log('Invalid session found, clearing...');
          localStorage.removeItem('session');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('session');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (user: any, session: any) => {
    setUser(user);
    setSession(session);
    // Set the access token immediately
    setAccessToken(session.access_token);
    setIsAuthenticated(true);
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('session', JSON.stringify(session));
  };

  const handleLogout = () => {
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('session');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''} admin-panel`}>
      <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
          userRole={user?.user_metadata?.role || 'admin'}
          userPermissions={user?.user_metadata?.permissions}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            user={user}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="data-overview" element={<ProductDataOverview />} />
              <Route path="orders" element={<Orders />} />
              <Route path="sold-products" element={<SoldProducts />} />
              <Route path="pos" element={<POSNew />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="customers" element={<Customers />} />
              <Route path="banners" element={<Banners />} />
              <Route path="outlook" element={<Outlook />} />
              <Route path="hr" element={<HR />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="team" element={<TeamMembers />} />
              <Route path="roles" element={<Roles />} />
              <Route path="system" element={<System />} />
              <Route path="settings" element={<Settings />} />
              <Route path="delivery" element={<Delivery />} />
              <Route path="email-templates" element={<EmailTemplates />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
