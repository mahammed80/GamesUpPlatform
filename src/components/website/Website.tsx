import { useState } from 'react';
import { WebsiteLayout } from './WebsiteLayout';
import { LandingPage } from './LandingPage';
import { ShopPage } from './ShopPage';
import { CustomerAuth } from './CustomerAuth';
import { Checkout } from './Checkout';
import { Profile } from './Profile';
import { MyOrders } from './MyOrders';
import { Favorites } from './Favorites';
import { TrackOrder } from './TrackOrder';

type Page = 'home' | 'shop' | 'product' | 'login' | 'signup' | 'checkout' | 'profile' | 'orders' | 'favorites' | 'track';

export function Website() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleNavigate = (page: Page, productId?: string) => {
    setCurrentPage(page);
    if (productId) {
      setSelectedProductId(productId);
    }
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
        onSuccess={() => handleNavigate('home')}
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
        return <LandingPage onNavigate={handleNavigate} />;
      case 'shop':
        return <ShopPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <WebsiteLayout currentPage={currentPage as 'home' | 'shop' | 'product'} onNavigate={handleNavigate}>
      {renderPage()}
    </WebsiteLayout>
  );
}