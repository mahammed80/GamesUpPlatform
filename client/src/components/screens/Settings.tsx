import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Save } from 'lucide-react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { BASE_URL } from '../../utils/api';

export function Settings() {
  const { settings, updateSettings } = useStoreSettings();
  const [activeTab, setActiveTab] = useState('store');
  
  // Local state for form forms
  const [formData, setFormData] = useState({
    currency_code: 'USD',
    currency_symbol: '$',
    tax_rate: 8.5,
    website_title: '',
    website_description: '',
    website_favicon: '',
    store_name: '',
    store_email: '',
    store_phone: '',
    store_address: '',
    business_hours: [] as { day: string; open: string; close: string }[],
    payment_methods: [] as { name: string; enabled: boolean }[],
  });
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  useEffect(() => {
    if (settings) {
      const defaultPaymentMethods = [
        { name: 'Credit/Debit Cards', enabled: true },
        { name: 'PayPal', enabled: true },
        { name: 'Apple Pay', enabled: true },
        { name: 'Google Pay', enabled: false },
        { name: 'Cryptocurrency', enabled: false },
      ];

      const defaultBusinessHours = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
        day,
        open: '09:00',
        close: '18:00'
      }));

      setFormData({
        currency_code: settings.currency_code,
        currency_symbol: settings.currency_symbol,
        tax_rate: settings.tax_rate,
        website_title: settings.website_title || '',
        website_description: settings.website_description || '',
        website_favicon: settings.website_favicon || '',
        store_name: settings.store_name || '',
        store_email: settings.store_email || '',
        store_phone: settings.store_phone || '',
        store_address: settings.store_address || '',
        business_hours: (settings.business_hours && settings.business_hours.length > 0) ? settings.business_hours : defaultBusinessHours,
        payment_methods: (settings.payment_methods && settings.payment_methods.length > 0) ? settings.payment_methods : defaultPaymentMethods,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    let symbol = '$';
    switch (code) {
      case 'USD': symbol = '$'; break;
      case 'EUR': symbol = '€'; break;
      case 'GBP': symbol = '£'; break;
      case 'JPY': symbol = '¥'; break;
      case 'EGP': symbol = 'E£'; break;
      default: symbol = '$';
    }
    setFormData({ ...formData, currency_code: code, currency_symbol: symbol });
  };

  const handlePaymentToggle = (name: string) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.map(method => 
        method.name === name ? { ...method, enabled: !method.enabled } : method
      )
    }));
  };

  const handleBusinessHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      business_hours: prev.business_hours.map(bh => 
        bh.day === day ? { ...bh, [field]: value } : bh
      )
    }));
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', faviconFile);

    try {
      const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData(prev => ({ ...prev, website_favicon: data.url }));
      setFaviconFile(null);
    } catch (error) {
      console.error('Error uploading favicon:', error);
      alert('Failed to upload favicon');
    }
  };


  const tabs = [
    { id: 'store', label: 'Store Info' },
    { id: 'payments', label: 'Payments' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
    { id: 'integrations', label: 'Integrations' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your store settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Store Info */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          <Card className="p-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Store Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Name</label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  placeholder="PlayStation Store Admin"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Email</label>
                <input
                  type="email"
                  value={formData.store_email}
                  onChange={(e) => setFormData({ ...formData, store_email: e.target.value })}
                  placeholder="store@playstation.com"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Phone</label>
                <input
                  type="tel"
                  value={formData.store_phone}
                  onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Address</label>
                <textarea
                  value={formData.store_address}
                  onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                  placeholder="2207 Bridgepointe Parkway, San Mateo, CA 94404"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website Title</label>
                <input
                  type="text"
                  value={formData.website_title}
                  onChange={(e) => setFormData({ ...formData, website_title: e.target.value })}
                  placeholder="Games Up"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website Description</label>
                <textarea
                  value={formData.website_description}
                  onChange={(e) => setFormData({ ...formData, website_description: e.target.value })}
                  placeholder="Your ultimate destination for gaming products and digital goods."
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Favicon URL</label>
                <input
                  type="text"
                  value={formData.website_favicon}
                  onChange={(e) => setFormData({ ...formData, website_favicon: e.target.value })}
                  placeholder="https://example.com/favicon.png"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <label
                    htmlFor="favicon-upload"
                    className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    Choose PNG
                  </label>
                  <Button type="button" onClick={handleFaviconUpload} className="bg-red-600 hover:bg-red-700 text-white">
                    Upload Icon
                  </Button>
                  {(faviconFile || formData.website_favicon) && (
                    <span className="text-xs text-green-500">Selected</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Business Hours</h3>
            <div className="space-y-3">
              {formData.business_hours.map((day) => (
                <div key={day.day} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-700 dark:text-gray-300">{day.day}</div>
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => handleBusinessHoursChange(day.day, 'open', e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => handleBusinessHoursChange(day.day, 'close', e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <Card className="p-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
            <div className="space-y-3">
              {formData.payment_methods.map((method) => (
                <div key={method.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-900 dark:text-white">{method.name}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={method.enabled} 
                      onChange={() => handlePaymentToggle(method.name)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Currency Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Currency</label>
                <select 
                  value={formData.currency_code}
                  onChange={handleCurrencyChange}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="EGP">EGP - Egyptian Pound</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                  step="0.1"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Shipping */}
      {activeTab === 'shipping' && (
        <Card className="p-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Shipping Options</h3>
          <div className="space-y-4">
            {[
              { name: 'Standard Shipping', price: '$5.99', time: '5-7 business days' },
              { name: 'Express Shipping', price: '$12.99', time: '2-3 business days' },
              { name: 'Next Day Delivery', price: '$24.99', time: '1 business day' },
            ].map((option) => (
              <div key={option.name} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{option.name}</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{option.price}</span>
                  <span>•</span>
                  <span>{option.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <Card className="p-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { title: 'New Orders', description: 'Get notified when new orders are placed' },
              { title: 'Low Stock Alerts', description: 'Receive alerts when products are running low' },
              { title: 'Customer Messages', description: 'Get notified of new customer support messages' },
              { title: 'Sales Reports', description: 'Receive daily sales summary reports' },
              { title: 'System Updates', description: 'Get notified about system updates and maintenance' },
            ].map((notif) => (
              <div key={notif.title} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{notif.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notif.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="p-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add an extra layer of security to your account</p>
            <Button>Enable 2FA</Button>
          </Card>

          <Card className="p-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">MacBook Pro - Chrome</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">San Francisco, CA • Active now</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    Current
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'Stripe', description: 'Payment processing', connected: true, logo: '💳' },
            { name: 'Mailchimp', description: 'Email marketing', connected: true, logo: '📧' },
            { name: 'Slack', description: 'Team communication', connected: false, logo: '💬' },
            { name: 'Google Analytics', description: 'Website analytics', connected: true, logo: '📊' },
            { name: 'Shopify', description: 'E-commerce platform', connected: false, logo: '🛍️' },
            { name: 'Zendesk', description: 'Customer support', connected: false, logo: '🎧' },
          ].map((integration) => (
            <Card key={integration.name} className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                  {integration.logo}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{integration.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{integration.description}</p>
                  {integration.connected ? (
                    <Button variant="secondary">Disconnect</Button>
                  ) : (
                    <Button>Connect</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
