import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BASE_URL } from '../utils/api';

interface StoreSettings {
  currency_code: string;
  currency_symbol: string;
  tax_rate: number;
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
};

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${BASE_URL}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          currency_code: data.currency_code || 'USD',
          currency_symbol: data.currency_symbol || '$',
          tax_rate: parseFloat(data.tax_rate) || 0,
        });
      }
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

      const response = await fetch(`${BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
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
