import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsAPI } from '../utils/api';

interface StoreSettings {
  currency_code: string;
  currency_symbol: string;
  tax_rate: number;
  website_title?: string;
  website_description?: string;
  website_favicon?: string;
  store_name?: string;
  store_email?: string;
  store_phone?: string;
  store_address?: string;
  business_hours?: { day: string; open: string; close: string }[];
  payment_methods?: { name: string; enabled: boolean }[];
}

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  formatPrice: (price: number | string) => string;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: StoreSettings = {
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
  business_hours: [],
  payment_methods: [],
};

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await settingsAPI.get();
      
      // Parse JSON strings for complex objects
      let business_hours = [];
      try {
        business_hours = data.business_hours ? JSON.parse(data.business_hours) : [];
      } catch (e) {
        console.error('Failed to parse business_hours', e);
      }

      let payment_methods = [];
      try {
        payment_methods = data.payment_methods ? JSON.parse(data.payment_methods) : [];
      } catch (e) {
        console.error('Failed to parse payment_methods', e);
      }

      setSettings({
        currency_code: data.currency_code || 'USD',
        currency_symbol: data.currency_symbol || '$',
        tax_rate: parseFloat(data.tax_rate) || 0,
        website_title: data.website_title || '',
        website_description: data.website_description || '',
        website_favicon: data.website_favicon || '',
        store_name: data.store_name || '',
        store_email: data.store_email || '',
        store_phone: data.store_phone || '',
        store_address: data.store_address || '',
        business_hours,
        payment_methods,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      // Optimistic update
      setSettings(prev => ({ ...prev, ...newSettings }));

      // Prepare data for server (serialize objects)
      const serverData: any = { ...newSettings };
      if (serverData.business_hours) {
        serverData.business_hours = JSON.stringify(serverData.business_hours);
      }
      if (serverData.payment_methods) {
        serverData.payment_methods = JSON.stringify(serverData.payment_methods);
      }

      await settingsAPI.update(serverData);
      
      await fetchSettings(); // Refresh to ensure sync
    } catch (error) {
      console.error('Failed to update settings:', error);
      fetchSettings(); // Revert on error
      throw error;
    }
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return `${settings.currency_symbol}0.00`;
    
    // Check if currency code implies different formatting (optional, keep simple for now)
    return `${settings.currency_symbol}${numPrice.toFixed(2)}`;
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, formatPrice, updateSettings, refreshSettings: fetchSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
}
