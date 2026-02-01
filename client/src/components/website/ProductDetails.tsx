import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, Heart, ArrowLeft, Star, Truck, Shield, Share2 } from 'lucide-react';
import { publicAnonKey } from '../../utils/supabase/info';
import { BASE_URL } from '../../utils/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categorySlug?: string;
  stock: number;
  rating?: number;
  reviews?: number;
  specs?: Record<string, string>;
}

interface ProductDetailsProps {
  onOpenCart: () => void;
  productId: string | null;
}

export function ProductDetails({ onOpenCart, productId }: ProductDetailsProps) {
  const navigate = useNavigate();
  const { formatPrice } = useStoreSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    } else {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favorites.some((f: any) => f.id === product.id));
    }
  }, [product]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      console.log('Loading product:', productId);
      // Fetch product details from API
      const response = await fetch(`${BASE_URL}/products?id=${productId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Product data:', data);
        // The API might return an array or a single object depending on implementation
        // Adjusting based on typical behavior
        const foundProduct = data.products ? data.products.find((p: any) => p.id == productId) : null;
        
        if (foundProduct) {
          setProduct({
            ...foundProduct,
            rating: foundProduct.rating || 4.5, // Mock rating if missing
            reviews: 128, // Mock reviews count
            specs: { // Mock specs
              "Platform": "PlayStation 5",
              "Genre": "Action / Adventure",
              "Publisher": "Sony Interactive Entertainment",
              "Release Date": "Nov 09, 2022"
            }
          });
        } else {
          console.log('Product not found in list');
        }
      } else {
        console.error('Failed to fetch product:', response.status);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = cart.findIndex((ci: any) => ci.id === product.id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    onOpenCart();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
        <button 
          onClick={() => navigate('/shop')}
          className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors mb-8 group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Shop</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="p-8 lg:p-12 bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-lg aspect-square"
              >
                 <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
              
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
            </div>

            {/* Details Section */}
            <div className="p-8 lg:p-12 flex flex-col">
              <div className="mb-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <motion.span 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-block px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase tracking-wider mb-3"
                    >
                      {product.categorySlug || 'Gaming'}
                    </motion.span>
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight"
                    >
                      {product.name}
                    </motion.h1>
                  </div>
                  <button className="p-3 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-bold text-gray-900 ml-1">{product.rating}</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">{product.reviews} Reviews</span>
                  <span className="text-gray-400">|</span>
                  <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-600 text-lg leading-relaxed mb-8"
                >
                  {product.description}
                </motion.p>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {product.specs && Object.entries(product.specs).map(([key, value], index) => (
                    <motion.div 
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (index * 0.1) }}
                      className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                    >
                      <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">{key}</span>
                      <span className="block text-gray-900 font-medium">{value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-8 border-t border-gray-100 mt-8">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <span className="text-gray-500 text-sm font-medium mb-1 block">Total Price</span>
                    <span className="text-4xl font-bold text-gray-900">{formatPrice(product.price * quantity)}</span>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold text-lg"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addToCart}
                    disabled={product.stock <= 0}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 ${
                      product.stock > 0 
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    Add to Cart
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleFavorite}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isFavorite 
                        ? 'border-red-500 bg-red-50 text-red-500' 
                        : 'border-gray-200 hover:border-red-500 hover:bg-red-50 text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>2 Year Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}