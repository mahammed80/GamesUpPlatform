import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, MapPin, User, Mail, Phone, Lock, CheckCircle, Truck, Package } from 'lucide-react';
import { publicAnonKey } from '../../utils/supabase/info';
import { BASE_URL } from '../../utils/api';

interface CheckoutProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export function Checkout({ onBack, onSuccess }: CheckoutProps) {
  const [step, setStep] = useState<'info' | 'delivery' | 'payment' | 'success'>('info');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    loadCart();
    loadDeliveryOptions();
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  const loadDeliveryOptions = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/delivery-options`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeliveryOptions(data.deliveryOptions || []);
        if (data.deliveryOptions?.length > 0) {
          setSelectedDelivery(data.deliveryOptions[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading delivery options:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'info') {
      setStep('delivery');
    } else if (step === 'delivery') {
      setStep('payment');
    } else if (step === 'payment') {
      setLoading(true);
      
      try {
        // Get user session
        const savedSession = localStorage.getItem('customerSession');
        let customerEmail = 'guest@gamesup.com';
        let customerName = formData.fullName;
        
        if (savedSession) {
          const session = JSON.parse(savedSession);
          customerEmail = session.user.email;
          customerName = session.user.name;
        }
        
        // Get selected delivery method details
        const deliveryOption = deliveryOptions.find(d => d.id === selectedDelivery);
        
        // Create order
        const orderData = {
          customerEmail,
          customerName,
          items: cartItems,
          total,
          deliveryMethod: deliveryOption?.name || 'Standard Shipping',
          shippingAddress: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
        };
        
        const response = await fetch(
          `${BASE_URL}/customer-orders`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(orderData),
          }
        );
        
        if (response.ok) {
          // Clear cart
          localStorage.setItem('cart', JSON.stringify([]));
          setStep('success');
        } else {
          alert('Failed to create order. Please try again.');
        }
      } catch (error) {
        console.error('Error creating order:', error);
        alert('Failed to create order. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const deliveryFee = selectedDelivery ? (deliveryOptions.find(d => d.id === selectedDelivery)?.price || 0) : 0;
  const total = subtotal + tax + deliveryFee;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Successful!</h1>
            <p className="text-gray-600 mb-8">
              Your order has been placed successfully. You'll receive a confirmation email shortly.
            </p>
            
            {purchasedItems.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Your Digital Items</h3>
                <div className="space-y-4">
                  {purchasedItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-3">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Digital Product</p>
                        </div>
                      </div>
                      
                      {item.digitalItem ? (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                          {item.digitalItem.code && (
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">Code</span>
                              <div className="font-mono text-lg font-bold text-gray-800 bg-white px-3 py-1 rounded border border-blue-200 inline-block select-all">
                                {item.digitalItem.code}
                              </div>
                            </div>
                          )}
                          
                          {item.digitalItem.email && (
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">Email</span>
                              <div className="font-mono text-gray-800 bg-white px-3 py-1 rounded border border-blue-200 inline-block select-all">
                                {item.digitalItem.email}
                              </div>
                            </div>
                          )}
                          
                          {item.digitalItem.password && (
                            <div>
                              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">Password</span>
                              <div className="font-mono text-gray-800 bg-white px-3 py-1 rounded border border-blue-200 inline-block select-all">
                                {item.digitalItem.password}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 text-amber-600 text-sm italic">
                          Product details will be sent to your email.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Order Total</p>
              <p className="text-3xl font-bold text-red-600">${total.toFixed(2)}</p>
            </div>
            <button
              onClick={onSuccess}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium mb-4"
          >
            ← Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {['info', 'delivery', 'payment'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === s
                    ? 'bg-red-600 text-white'
                    : ['info', 'delivery'].includes(s) && ['delivery', 'payment'].includes(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {idx + 1}
              </div>
              {idx < 2 && (
                <div className={`w-16 h-1 ${
                  ['delivery', 'payment'].includes(step) && idx === 0
                    ? 'bg-green-500'
                    : step === 'payment' && idx === 1
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
              {step === 'info' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-8 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Shipping Address</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="123 Main St, Apt 4B"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="NY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="10001"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'delivery' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Delivery Method</h2>
                  </div>

                  <div className="space-y-4">
                    {deliveryOptions.length === 0 ? (
                      <p className="text-gray-600">Loading delivery options...</p>
                    ) : (
                      deliveryOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedDelivery === option.id
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              name="delivery"
                              value={option.id}
                              checked={selectedDelivery === option.id}
                              onChange={(e) => setSelectedDelivery(e.target.value)}
                              className="w-5 h-5 text-red-600"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{option.name}</p>
                              <p className="text-sm text-gray-600">{option.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{option.estimatedDays}</p>
                            </div>
                          </div>
                          <p className="font-bold text-red-600">
                            {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}
                          </p>
                        </label>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Lock className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-900">
                      Your payment information is secure and encrypted
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                {step !== 'info' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 'delivery') setStep('info');
                      if (step === 'payment') setStep('delivery');
                    }}
                    className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : step === 'payment' ? 'Place Order' : 'Continue'}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-red-600">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-red-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}