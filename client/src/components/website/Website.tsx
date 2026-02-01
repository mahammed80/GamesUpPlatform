import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { WebsiteLayout } from './WebsiteLayout';
import { LandingPage } from './LandingPage';
import { ShopPage } from './ShopPage';
import { ProductDetails } from './ProductDetails';
import { CustomerAuth } from './CustomerAuth';
import { Checkout } from './Checkout';
import { Profile } from './Profile';
import { MyOrders } from './MyOrders';
import { Favorites } from './Favorites';
import { TrackOrder } from './TrackOrder';

type Page = 'home' | 'shop' | 'product' | 'login' | 'signup' | 'checkout' | 'profile' | 'orders' | 'favorites' | 'track';

export function Website() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const getCurrentPage = (): Page => {
    const path = location.pathname;
    if (path === '/' || path === '') return 'home';
    if (path === '/shop') return 'shop';
    if (path === '/checkout') return 'checkout';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/profile') return 'profile';
    if (path === '/orders') return 'orders';
    if (path === '/favorites') return 'favorites';
    if (path === '/track') return 'track';
    if (path.startsWith('/product/')) return 'product';
    return 'home';
  };

  const currentPage = getCurrentPage();
  const selectedProductId = location.pathname.startsWith('/product/') 
    ? location.pathname.split('/product/')[1] 
    : null;

  const handleNavigate = (page: Page, productId?: string, categorySlug?: string) => {
    if (page === 'home') navigate('/');
    else if (page === 'shop') {
      if (categorySlug) navigate(`/shop?category=${categorySlug}`);
      else navigate('/shop');
    }
    else if (page === 'product' && productId) navigate(`/product/${productId}`);
    else if (page === 'checkout') navigate('/checkout');
    else if (page === 'login') navigate('/login');
    else if (page === 'signup') navigate('/signup');
    else if (page === 'profile') navigate('/profile');
    else if (page === 'orders') navigate('/orders');
    else if (page === 'favorites') navigate('/favorites');
    else if (page === 'track') navigate('/track');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderAgain = (items: any[]) => {
    // Add all items to cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = [...cart];
    
    items.forEach(item => {
      const existingItemIndex = updatedCart.findIndex(ci => ci.id === item.id);
      if (existingItemIndex >= 0) {
        updatedCart[existingItemIndex].quantity += item.quantity;
      } else {
        updatedCart.push({ ...item });
      }
    });
    
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    alert('Items added to cart!');
    handleNavigate('shop');
  };

  const handleAddToCart = (item: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = cart.findIndex((ci: any) => ci.id === item.id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
  };

  // Check if we need auth pages
  if (currentPage === 'login' || currentPage === 'signup') {
    return (
      <CustomerAuth
        mode={currentPage}
        onSuccess={() => handleNavigate('home')}
        onSwitchMode={(mode) => handleNavigate(mode)}
      />
    );
  }

  // Checkout page
  if (currentPage === 'checkout') {
    return (
      <Checkout
        onBack={() => handleNavigate('shop')}
        onSuccess={() => handleNavigate('shop')}
      />
    );
  }

  // Profile page
  if (currentPage === 'profile') {
    return <Profile onBack={() => handleNavigate('home')} />;
  }

  // Orders page
  if (currentPage === 'orders') {
    return (
      <MyOrders 
        onBack={() => handleNavigate('home')} 
        onOrderAgain={handleOrderAgain}
        onTrackOrder={(orderNumber) => {
          // You could store the order number and auto-fill track form
          handleNavigate('track');
        }}
      />
    );
  }

  // Favorites page
  if (currentPage === 'favorites') {
    return (
      <Favorites 
        onBack={() => handleNavigate('home')} 
        onAddToCart={handleAddToCart}
      />
    );
  }

  // Track Order page
  if (currentPage === 'track') {
    return <TrackOrder onBack={() => handleNavigate('home')} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <LandingPage onNavigate={handleNavigate} onOpenCart={() => setIsCartOpen(true)} />;
      case 'shop':
        return <ShopPage onNavigate={handleNavigate} onOpenCart={() => setIsCartOpen(true)} />;
      case 'product':
        return <ProductDetails onOpenCart={() => setIsCartOpen(true)} productId={selectedProductId} />;
      default:
        return <LandingPage onNavigate={handleNavigate} onOpenCart={() => setIsCartOpen(true)} />;
    }
  };

  return (
    <WebsiteLayout 
      currentPage={currentPage as 'home' | 'shop' | 'product'} 
      onNavigate={handleNavigate}
      isCartOpen={isCartOpen}
      onOpenCart={() => setIsCartOpen(true)}
      onCloseCart={() => setIsCartOpen(false)}
    >
      {renderPage()}
    </WebsiteLayout>
  );
}