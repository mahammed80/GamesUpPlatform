import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Search, Menu, X, Home, Store, LogIn, UserPlus, LogOut, Package, Heart, Settings } from 'lucide-react';
import { Cart } from './Cart';
import { SearchModal } from './SearchModal';
import { WebsiteLogo } from './WebsiteLogo';
import logo from '../../assets/gamesupnew.png';

interface WebsiteLayoutProps {
  children: ReactNode;
  currentPage: 'home' | 'shop' | 'product';
  onNavigate: (page: 'home' | 'shop' | 'product' | 'checkout' | 'profile' | 'orders' | 'favorites', productId?: string) => void;
  isCartOpen: boolean;
  onOpenCart: () => void;
  onCloseCart: () => void;
}

export function WebsiteLayout({ children, currentPage, onNavigate, isCartOpen, onOpenCart, onCloseCart }: WebsiteLayoutProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Check for customer session
    const savedSession = localStorage.getItem('customerSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUser(session.user);
      } catch (error) {
        console.error('Error parsing customer session:', error);
      }
    }

    // Load cart count
    updateCartCount();

    // Handle scroll
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  };

  const handleLogout = () => {
    localStorage.removeItem('customerSession');
    setUser(null);
    setUserMenuOpen(false);
  };

  const handleOpenCart = () => {
    onOpenCart();
    updateCartCount();
  };

  const handleCheckout = () => {
    onNavigate('checkout');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200'
            : 'bg-white/60 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              <img src={logo} alt="Games Up" className="h-6 w-auto object-contain" />
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => onNavigate('home')}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  currentPage === 'home'
                    ? 'text-red-600'
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => onNavigate('shop')}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  currentPage === 'shop'
                    ? 'text-red-600'
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                <Store className="w-4 h-4" />
                Shop
              </button>
            </nav>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                onClick={handleOpenCart}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </motion.button>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">{user.name}</span>
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                      >
                        <button 
                          onClick={() => {
                            onNavigate('profile');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </button>
                        <button 
                          onClick={() => {
                            onNavigate('orders');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                        >
                          <Package className="w-4 h-4" />
                          My Orders
                        </button>
                        <button 
                          onClick={() => {
                            onNavigate('favorites');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                        >
                          <Heart className="w-4 h-4" />
                          Favorites
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-2 text-red-600 border-t border-gray-200"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('login')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('signup')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-medium shadow-lg shadow-red-500/30"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200"
            >
              <div className="px-4 py-4 space-y-2">
                <button
                  onClick={() => {
                    onNavigate('home');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                >
                  <Home className="w-5 h-5" />
                  Home
                </button>
                <button
                  onClick={() => {
                    onNavigate('shop');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                >
                  <Store className="w-5 h-5" />
                  Shop
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-600">
                      Signed in as <span className="font-semibold">{user.name}</span>
                    </div>
                    <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                      <Package className="w-5 h-5" />
                      My Orders
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 font-medium"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onNavigate('login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                    >
                      <LogIn className="w-5 h-5" />
                      Login
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('signup');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-medium shadow-lg"
                    >
                      <UserPlus className="w-5 h-5" />
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <WebsiteLogo variant="white" className="h-10 w-auto object-contain" />
              </div>
              <p className="text-gray-400 text-sm">
                Your ultimate destination for gaming products and digital goods.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Shop</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">All Products</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Featured</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Best Sellers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Games - Up. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Cart Modal */}
      <Cart 
        isOpen={isCartOpen}
        onClose={() => {
          onCloseCart();
          updateCartCount();
        }}
        onCheckout={handleCheckout}
        onNavigate={onNavigate}
      />

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}