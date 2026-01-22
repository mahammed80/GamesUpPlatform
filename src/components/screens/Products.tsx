import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { productsAPI, BASE_URL } from '../../utils/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';

interface Product {
  id: string | number;
  name: string;
  category: string;
  price: string;
  cost?: string;
  stock: number;
  status: string;
  image: string;
  purchasedEmail?: string;
  purchasedPassword?: string;
  productCode?: string;
  digitalItems?: {
    email?: string;
    password?: string;
    code?: string;
  }[];
}

const QuickEditCell = ({ value, onSave, type = "text", prefix = "" }: { value: string | number, onSave: (val: string | number) => void, type?: string, prefix?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue != value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  if (isEditing) {
    return (
        <input
          autoFocus
          type={type}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full min-w-[80px] px-2 py-1 bg-white dark:bg-gray-800 border border-blue-500 rounded text-gray-900 dark:text-white"
          onClick={(e) => e.stopPropagation()}
        />
    );
  }

  return (
    <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded border border-transparent hover:border-gray-300 transition-all">
      {prefix}{value}
    </div>
  );
};

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'PlayStation 5 Console',
    category: 'Consoles',
    price: '499.99',
    stock: 124,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=100&h=100&fit=crop',
  },
  {
    id: 2,
    name: 'DualSense Controller',
    category: 'Accessories',
    price: '69.99',
    stock: 456,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=100&h=100&fit=crop',
  },
  {
    id: 3,
    name: 'PS5 VR Headset',
    category: 'Accessories',
    price: '549.99',
    stock: 8,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1617802690658-1173a812650d?w=100&h=100&fit=crop',
  },
  {
    id: 4,
    name: 'God of War Ragnarök',
    category: 'Games',
    price: '69.99',
    stock: 234,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=100&h=100&fit=crop',
  },
  {
    id: 5,
    name: 'Spider-Man 2',
    category: 'Games',
    price: '69.99',
    stock: 189,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&h=100&fit=crop',
  },
  {
    id: 6,
    name: 'PlayStation Plus 12-Month',
    category: 'Services',
    price: '59.99',
    stock: 999,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop',
  },
];

export function Products() {
  const { settings, formatPrice } = useStoreSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Consoles',
    price: '',
    cost: '',
    stock: 0,
    image: '',
    digitalItems: [] as { email?: string; password?: string; code?: string }[],
  });

  // Temp state for adding new digital item
  const [newItem, setNewItem] = useState({ email: '', password: '', code: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      setProducts(data.products);
      setError(null);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
      // If unauthorized, might need to re-login
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('Session expired. Please refresh the page and log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpdate = async (id: string | number, field: string, value: any) => {
    try {
        const product = products.find(p => p.id === id);
        if (!product) return;

        // Optimistic update
        setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));

        await productsAPI.update(id, { ...product, [field]: value });
    } catch (error) {
        console.error('Error updating product:', error);
        // Revert or show error (simplest is to reload)
        loadProducts();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData(prev => ({ ...prev, image: data.url }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  const handleAddDigitalItem = () => {
    if (!newItem.email && !newItem.password && !newItem.code) return;
    
    setFormData(prev => ({
      ...prev,
      digitalItems: [...prev.digitalItems, newItem],
      stock: prev.stock + 1 // Auto-increment stock
    }));
    setNewItem({ email: '', password: '', code: '' });
  };

  const handleRemoveDigitalItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      digitalItems: prev.digitalItems.filter((_, i) => i !== index),
      stock: Math.max(0, prev.stock - 1) // Auto-decrement stock
    }));
  };

  const handleExportCSVTemplate = () => {
    const headers = ['Email,Password,Code'];
    const csvContent = headers.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'digital_products_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newItems: { email?: string; password?: string; code?: string }[] = [];

      // Skip header (index 0)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [email, password, code] = line.split(',').map(item => item.trim());
        if (email || password || code) {
          newItems.push({ email, password, code });
        }
      }

      setFormData(prev => ({
        ...prev,
        digitalItems: [...prev.digitalItems, ...newItems],
        stock: prev.stock + newItems.length
      }));
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleSaveProduct = async () => {
    try {
      const status = formData.stock > 10 ? 'In Stock' : 'Low Stock';
      const productData = {
        ...formData,
        status,
        image: formData.image || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=100&h=100&fit=crop',
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productData);
      } else {
        await productsAPI.create(productData);
      }

      await loadProducts();
      setIsAddModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', category: 'Consoles', price: '', cost: '', stock: 0, image: '', digitalItems: [] });
      setNewItem({ email: '', password: '', code: '' });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productsAPI.delete(id);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.replace('$', ''),
      cost: product.cost ? product.cost.replace('$', '') : '',
      stock: product.stock,
      image: product.image,
      purchasedEmail: product.purchasedEmail || '',
      purchasedPassword: product.purchasedPassword || '',
      productCode: product.productCode || '',
      digitalItems: product.digitalItems || [],
    });
    setIsAddModalOpen(true);
  };

  const filteredProducts = (products || []).filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500 dark:text-gray-400">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 dark:text-red-400">{error}</div>
        <Button onClick={loadProducts}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your product inventory</p>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', category: 'Consoles', price: '', cost: '', stock: 0, image: '', digitalItems: [] });
            setNewItem({ email: '', password: '', code: '' });
            setIsAddModalOpen(true);
          }}
          icon={Plus}
        >
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All</option>
            <option>Consoles</option>
            <option>Accessories</option>
            <option>Games</option>
            <option>Services</option>
          </select>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="p-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cost</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="font-medium text-gray-900 dark:text-white">
                        <QuickEditCell value={product.name} onSave={(val) => handleQuickUpdate(product.id, 'name', val)} />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{product.category}</td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    <QuickEditCell 
                        value={product.price} 
                        onSave={(val) => handleQuickUpdate(product.id, 'price', val)} 
                        prefix={settings.currency_symbol}
                    />
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <QuickEditCell 
                        value={product.cost || '0.00'} 
                        onSave={(val) => handleQuickUpdate(product.id, 'cost', val)} 
                        prefix={settings.currency_symbol}
                    />
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                    <QuickEditCell 
                        value={product.stock} 
                        onSave={(val) => handleQuickUpdate(product.id, 'stock', parseInt(val as string))} 
                        type="number"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'In Stock'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
          setFormData({ name: '', category: 'Consoles', price: '', cost: '', stock: 0, image: '', purchasedEmail: '', purchasedPassword: '', productCode: '' });
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter product name"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option>Consoles</option>
                <option>Accessories</option>
                <option>Games</option>
                <option>Services</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stock Quantity</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL (optional)</label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="https://..."
              />
              <div className="flex items-center gap-2">
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">OR UPLOAD</span>
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900/30 dark:file:text-red-400"
              />
            </div>
          </div>

          {/* Admin-Only Fields Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded">Admin Only</span>
                Digital Stock Items
              </h3>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleExportCSVTemplate} className="text-xs py-1 h-8 dark:text-white">
                  Download Template
                </Button>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors h-8">
                    Import CSV
                  </span>
                  <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                </label>
              </div>
            </div>
            
            {/* Add New Item Form */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input
                  type="email"
                  value={newItem.email}
                  onChange={(e) => setNewItem({ ...newItem, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Email"
                />
                <input
                  type="text"
                  value={newItem.password}
                  onChange={(e) => setNewItem({ ...newItem, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Password"
                />
                <input
                  type="text"
                  value={newItem.code}
                  onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Code/Key"
                />
              </div>
              <Button onClick={handleAddDigitalItem} className="w-full text-sm py-1" disabled={!newItem.email && !newItem.password && !newItem.code}>
                Add Item (+)
              </Button>
            </div>

            {/* Items List */}
            {formData.digitalItems.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Password</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Code</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.digitalItems.map((item, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800">
                        <td className="py-2 px-3 text-gray-900 dark:text-gray-300 truncate max-w-[100px]">{item.email}</td>
                        <td className="py-2 px-3 text-gray-900 dark:text-gray-300 truncate max-w-[100px]">{item.password}</td>
                        <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{item.code}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleRemoveDigitalItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              Total Digital Stock: {formData.digitalItems.length} items (Stock quantity updated automatically)
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
                setFormData({ name: '', category: 'Consoles', price: '', cost: '', stock: 0, image: '', digitalItems: [] });
              }}
              className="dark:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} className="dark:text-white">
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}