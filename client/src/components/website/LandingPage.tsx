import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Star, TrendingUp, Gamepad2, Headphones, Monitor, Package, ChevronLeft, ChevronRight, Disc, HardDrive, Keyboard, Mouse, Laptop, Smartphone } from 'lucide-react';
import { publicAnonKey } from '../../utils/supabase/info';
import { BASE_URL } from '../../utils/api';

interface LandingPageProps {
  onNavigate: (page: 'shop', productId?: string, categorySlug?: string) => void;
  onOpenCart: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categorySlug?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
}

const categoryIcons: Record<string, any> = {
  'consoles': Gamepad2,
  'games': Disc,
  'accessories': Keyboard,
  'headsets': Headphones,
  'storage': HardDrive,
  'monitors': Monitor,
  'pc': Laptop,
  'mobile': Smartphone,
};

export function LandingPage({ onNavigate, onOpenCart }: LandingPageProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [specialOffer, setSpecialOffer] = useState({
    title: 'SPECIAL OFFER',
    subtitle: 'Up to 50% Off on Selected Items'
  });
  const [heroConfig, setHeroConfig] = useState({
    badge: '🎮 Your Ultimate Gaming Destination',
    title: 'GAMES UP',
    subtitle: 'Discover exclusive gaming products, accessories, and digital content. Level up your gaming experience today.',
    ctaPrimary: 'Shop Now',
    ctaSecondary: 'Learn More'
  });

  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
    
    // Load saved content
    const loadContent = () => {
      const savedOffer = localStorage.getItem('specialOfferConfig');
      if (savedOffer) {
        setSpecialOffer(JSON.parse(savedOffer));
      }
      const savedHero = localStorage.getItem('heroConfig');
      if (savedHero) {
        setHeroConfig(JSON.parse(savedHero));
      }
    };
    
    loadContent();

    // Listen for changes across tabs
    window.addEventListener('storage', loadContent);
    
    // Listen for custom event (same tab updates)
    window.addEventListener('specialOfferUpdated', loadContent);
    window.addEventListener('heroConfigUpdated', loadContent);

    return () => {
      window.removeEventListener('storage', loadContent);
      window.removeEventListener('specialOfferUpdated', loadContent);
      window.removeEventListener('heroConfigUpdated', loadContent);
    };
  }, []);

  const addToCart = (product: Product | any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push({
      id: product.id || `temp-${Date.now()}`,
      name: product.name || 'Product',
      price: product.price || 0,
      image: product.image || '',
      quantity: 1,
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    onOpenCart();
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/system/categories`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data.filter((cat: any) => cat.isActive).slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/products`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts((data.products || []).slice(0, 8));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-500 to-orange-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-6 border border-white/30">
                {heroConfig.badge}
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-white leading-tight">
                {heroConfig.title}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed font-light">
                {heroConfig.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('shop')}
                  className="px-8 py-4 bg-white text-red-600 font-bold rounded-lg shadow-2xl flex items-center gap-2 hover:bg-gray-50 transition-all"
                >
                  {heroConfig.ctaPrimary}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-all"
                >
                  {heroConfig.ctaSecondary}
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-white/20 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Gamepad2 className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <div className="text-4xl font-bold">1000+</div>
                    <div className="text-lg opacity-80">Products Available</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">BROWSE BY CATEGORY</h2>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={() => setCurrentSlide(prev => Math.min((categories.length || 6) - 4, prev + 1))}
                  disabled={currentSlide >= (categories.length || 6) - 4}
                  className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <button
                onClick={() => onNavigate('shop')}
                className="text-red-600 font-semibold hover:text-red-700 flex items-center gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            <motion.div 
              className="flex gap-6"
              animate={{ x: `calc(-${currentSlide} * (25% + 0.375rem))` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {(categories.length > 0 ? categories : [
                { icon: '🎮', name: 'Consoles', slug: 'consoles' },
                { icon: '🎯', name: 'Games', slug: 'games' },
                { icon: '🎧', name: 'Headsets', slug: 'headsets' },
                { icon: '📱', name: 'Accessories', slug: 'accessories' },
                { icon: '💾', name: 'Storage', slug: 'storage' },
                { icon: '🖥️', name: 'Monitors', slug: 'monitors' },
              ]).map((category: any, index) => {
                 const slug = category.slug || category.name.toLowerCase();
                 // Find matching icon: Exact match -> Partial match -> Default
                 const Icon = categoryIcons[slug] || 
                              categoryIcons[Object.keys(categoryIcons).find(k => slug.includes(k)) || ''] || 
                              Package;
                 
                 return (
                <motion.button
                  key={category.id || index}
                  onClick={() => onNavigate('shop', undefined, slug)}
                  className="relative flex-shrink-0 w-[calc(25%-1.125rem)] flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-12 h-12 text-red-600" strokeWidth={1.5} />
                  </div>
                  
                  <span className="relative z-10 text-sm font-bold text-gray-800 uppercase tracking-wider group-hover:text-red-600 transition-colors">
                    {category.name}
                  </span>
                </motion.button>
              )})}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-8 bg-gradient-to-r from-orange-500 to-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <p className="text-sm font-semibold uppercase tracking-wide">{specialOffer.title}</p>
                <p className="text-2xl font-bold">{specialOffer.subtitle}</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('shop')}
              className="hidden md:block px-6 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-50 transition-all"
            >
              Shop Deals
            </button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">FEATURED PRODUCTS</h2>
            <button
              onClick={() => onNavigate('shop')}
              className="text-red-600 font-semibold hover:text-red-700 flex items-center gap-2"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-red-500 hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => onNavigate('shop')}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-red-600">
                        ${product.price.toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // Placeholder products
              Array(8).fill(0).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-red-500 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => onNavigate('shop')}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                      Gaming Product {index + 1}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-red-600">$59.99</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            id: `placeholder-${index}`,
                            name: `Gaming Product ${index + 1}`,
                            price: 59.99,
                            image: '',
                          });
                        }}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Secondary Banner */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-red-600 to-red-500 rounded-2xl p-8 text-white"
            >
              <Gamepad2 className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-2">New Arrivals</h3>
              <p className="text-red-100 mb-4">Check out the latest gaming gear</p>
              <button className="text-white font-semibold underline hover:no-underline">
                Shop Now →
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl p-8 text-white"
            >
              <Star className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Best Sellers</h3>
              <p className="text-orange-100 mb-4">Top-rated products this month</p>
              <button className="text-white font-semibold underline hover:no-underline">
                View All →
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl p-8 text-white"
            >
              <Headphones className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Accessories</h3>
              <p className="text-purple-100 mb-4">Enhance your gaming setup</p>
              <button className="text-white font-semibold underline hover:no-underline">
                Explore →
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Best Deals */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">DEALS OF THE WEEK</h2>
              <p className="text-gray-600 mt-1">Limited time offers - Don't miss out!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-red-500 hover:shadow-xl transition-all cursor-pointer relative"
                onClick={() => onNavigate('shop')}
              >
                <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                  -30%
                </div>
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    Special Deal Product {item}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400 line-through">$99.99</span>
                    <span className="text-xl font-bold text-red-600">$69.99</span>
                  </div>
                  <button className="w-full py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-br from-red-600 to-red-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Stay Updated
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Subscribe to get special offers, exclusive deals, and gaming news
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-white/30"
              />
              <button className="px-8 py-4 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: '🚚', title: 'Free Shipping', subtitle: 'On orders over $50' },
              { icon: '🔒', title: 'Secure Payment', subtitle: '100% protected' },
              { icon: '💬', title: '24/7 Support', subtitle: 'Dedicated support' },
              { icon: '↩️', title: 'Easy Returns', subtitle: '30-day guarantee' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
