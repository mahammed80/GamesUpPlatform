import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Login } from './components/Login';
import { Dashboard } from './components/screens/Dashboard';
import { Products } from './components/screens/Products';
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
import { setAccessToken } from './utils/api';
import { projectId } from './utils/supabase/info';

export type Screen = 'dashboard' | 'products' | 'orders' | 'sold-products' | 'analytics' | 'customers' | 'tasks' | 'team' | 'settings' | 'roles' | 'outlook' | 'banners' | 'hr' | 'pos' | 'system' | 'delivery';

export default function AdminApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
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

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'orders':
        return <Orders />;
      case 'pos':
        return <POSNew />;
      case 'analytics':
        return <Analytics />;
      case 'customers':
        return <Customers />;
      case 'banners':
        return <Banners />;
      case 'outlook':
        return <Outlook />;
      case 'hr':
        return <HR />;
      case 'tasks':
        return <Tasks />;
      case 'team':
        return <TeamMembers />;
      case 'roles':
        return <Roles />;
      case 'system':
        return <System />;
      case 'settings':
        return <Settings />;
      case 'delivery':
        return <Delivery />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors">
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
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
            {renderScreen()}
          </main>
        </div>
      </div>
    </div>
  );
}
