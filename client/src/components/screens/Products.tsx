import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/Modal';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { productsAPI, BASE_URL } from '@/utils/api';

interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  status: string;
  image: string;
  subCategory?: string;
  attributes?: Record<string, any>;
  digitalItems?: DigitalItem[];
  purchasedEmail?: string;
  purchasedPassword?: string;
  productCode?: string;
}

interface DigitalItem {
  email: string;
  password: string;
  code: string;
  outlookEmail?: string;
  outlookPassword?: string;
  birthdate?: string;
  region?: string;
  onlineId?: string;
  backupCodes?: string;
  slots?: Record<string, { sold: boolean; orderId: string | null; code?: string }>;
  totalCodes?: number;
}

export function Products() {
  const { settings, formatPrice } = useStoreSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    price: '',
    cost: '',
    stock: 0,
    image: '',
    attributes: {} as Record<string, any>,
    digitalItems: [] as Product['digitalItems'],
  });

  const [newItem, setNewItem] = useState({ 
    email: '', 
    password: '', 
    code: '', 
    outlookEmail: '', 
    outlookPassword: '', 
    birthdate: '', 
    region: '', 
    onlineId: '', 
    backupCodes: '' 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        console.log('Loading data...');
        setLoading(true);
        
        const [catsRes, subCatsRes, attrsRes, productsRes] = await Promise.all([
            fetch(`${BASE_URL}/system/categories`),
            fetch(`${BASE_URL}/system/subcategories`),
            fetch(`${BASE_URL}/system/attributes`),
            productsAPI.getAll()
        ]);

        console.log('API responses:', { catsRes, subCatsRes, attrsRes, productsRes });

        // Handle categories
        if (catsRes.ok) {
            const data = await catsRes.json();
            console.log('Categories data:', data);
            setCategories(data);
            if (data.length > 0 && !formData.category) {
                 setFormData(prev => ({ ...prev, category: data[0].name }));
            }
        } else {
            console.error('Categories API failed:', catsRes.status);
            setCategories([]);
        }
        
        // Handle subcategories
        if (subCatsRes.ok) {
            const subData = await subCatsRes.json();
            console.log('Subcategories data:', subData);
            setSubCategories(subData);
        } else {
            console.error('Subcategories API failed:', subCatsRes.status);
            setSubCategories([]);
        }
        
        // Handle attributes
        if (attrsRes.ok) {
            const attrsData = await attrsRes.json();
            console.log('Attributes data:', attrsData);
            setAttributes(attrsData);
        } else {
            console.error('Attributes API failed:', attrsRes.status);
            setAttributes([]);
        }
        
        console.log('Products response:', productsRes);
        setProducts(productsRes.products || []);
        setError(null);
    } catch (err: any) {
        console.error("Failed to load data", err);
        console.error('Error details:', {
            message: err?.message,
            stack: err?.stack,
            name: err?.name
        });
        setError(err?.message || 'Failed to load data');
    } finally {
        setLoading(false);
    }
  };

  async function loadProducts() {
     try {
       const data = await productsAPI.getAll();
       setProducts(data.products);
     } catch (err) {
       console.error(err);
     }
  }

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
    
    const codes = newItem.code
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    if (codes.length === 0) return;

    const mainCodes = codes.slice(0, 5);
    const backupCodes = codes.slice(5);
    
    const slots = {
      'Primary ps4': { sold: false, orderId: null, code: mainCodes[0] || '' },
      'Primary ps5': { sold: false, orderId: null, code: mainCodes[1] || '' },
      'Secondary': { sold: false, orderId: null, code: mainCodes[2] || '' },
      'Offline ps4': { sold: false, orderId: null, code: mainCodes[3] || '' },
      'Offline ps5': { sold: false, orderId: null, code: mainCodes[4] || '' }
    };

    const newItemData = {
      ...newItem,
      code: mainCodes[0] || '',
      slots,
      backupCodes: backupCodes.join('\n'),
      totalCodes: codes.length
    };

    setFormData(prev => ({
      ...prev,
      digitalItems: [...(Array.isArray(prev.digitalItems) ? prev.digitalItems : []), newItemData],
      stock: prev.stock + 5
    }));
    setNewItem({ email: '', password: '', code: '', outlookEmail: '', outlookPassword: '', birthdate: '', region: '', onlineId: '', backupCodes: '' });
  };

  const handleRemoveDigitalItem = (index: number) => {
    setFormData(prev => {
        const item = prev.digitalItems?.[index];
        const slotsCount = item?.slots ? 5 : 1;
        return {
            ...prev,
            digitalItems: (Array.isArray(prev.digitalItems) ? prev.digitalItems : []).filter((_, i) => i !== index),
            stock: Math.max(0, prev.stock - slotsCount)
        };
    });
  };

  const handleExportCSVTemplate = () => {
    const headers = ['Email,Password,Code,OutlookEmail,OutlookPassword,Birthdate,Region,OnlineID,BackupCodes'];
    const csvContent = headers.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'digital_stock_template.csv';
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
      const newItems: Product['digitalItems'] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',').map(item => item.trim());
        const [email, password, code, outlookEmail, outlookPassword, birthdate, region, onlineId, ...rest] = parts;
        
        const backupCodes = rest.join(',');

        if (email || password || code) {
          newItems.push({
            email, 
            password, 
            code,
            outlookEmail,
            outlookPassword,
            birthdate,
            region,
            onlineId,
            backupCodes,
            slots: {
                'Primary ps4': { sold: false, orderId: null },
                'Primary ps5': { sold: false, orderId: null },
                'Secondary': { sold: false, orderId: null },
                'Offline ps4': { sold: false, orderId: null },
                'Offline ps5': { sold: false, orderId: null }
            }
          });
        }
      }

      setFormData(prev => ({
        ...prev,
        digitalItems: [...(Array.isArray(prev.digitalItems) ? prev.digitalItems : []), ...newItems],
        stock: prev.stock + (newItems.length * 5)
      }));
    };
    reader.readAsText(file);
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
      setFormData({ name: '', category: categories[0]?.name || '', price: '', cost: '', stock: 0, image: '', digitalItems: [] });
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
      price: product.price.toString().replace('$', ''),
      cost: product.cost ? product.cost.toString().replace('$', '') : '',
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

  const renderContent = () => {
    try {
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
            <Button onClick={loadData}>Try Again</Button>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your product inventory</p>
            </div>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setFormData({ name: '', category: categories[0]?.name || '', price: '', cost: '', stock: 0, image: '', digitalItems: [] });
                setNewItem({ email: '', password: '', code: '' });
                setIsAddModalOpen(true);
              }}
              icon={Plus}
            >
              Add Product
            </Button>
          </div>

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
                {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.status === 'In Stock' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatPrice(product.price)}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.stock}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-white hover:text-white hover:bg-red-600 dark:hover:bg-red-600 bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Modal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingProduct(null);
              setFormData({ name: '', category: categories[0]?.name || '', price: '', cost: '', stock: 0, image: '', digitalItems: [] });
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sub Category</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Sub Category</option>
                    {(() => {
                        const cat = categories.find(c => c.name === formData.category);
                        return cat ? subCategories.filter(s => s.categoryId === cat.id && s.isActive).map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                        )) : [];
                    })()}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price ({settings.currency_symbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost ({settings.currency_symbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
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
                  disabled={formData.digitalItems.length > 0}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    formData.digitalItems.length > 0 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-700' 
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600'
                  }`}
                  placeholder="0"
                />
                {formData.digitalItems.length > 0 && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    Stock is automatically calculated from the number of digital items.
                  </p>
                )}
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
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                  {/* Main Account Information */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Main Account Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">PSN Email</label>
                        <input
                          type="email"
                          value={newItem.email}
                          onChange={(e) => setNewItem({ ...newItem, email: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="account@psn.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">PSN Password</label>
                        <input
                          type="text"
                          value={newItem.password}
                          onChange={(e) => setNewItem({ ...newItem, password: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Enter PSN password"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Region</label>
                        <select
                          value={newItem.region}
                          onChange={(e) => setNewItem({ ...newItem, region: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Select Region</option>
                          <option value="US">US</option>
                          <option value="EU">EU</option>
                          <option value="UK">UK</option>
                          <option value="JP">JP</option>
                          <option value="ASIA">ASIA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Online ID</label>
                        <input
                          type="text"
                          value={newItem.onlineId}
                          onChange={(e) => setNewItem({ ...newItem, onlineId: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="PSN Online ID"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recovery Information */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Recovery Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Outlook Email</label>
                        <input
                          type="email"
                          value={newItem.outlookEmail}
                          onChange={(e) => setNewItem({ ...newItem, outlookEmail: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="recovery@outlook.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Outlook Password</label>
                        <input
                          type="text"
                          value={newItem.outlookPassword}
                          onChange={(e) => setNewItem({ ...newItem, outlookPassword: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Outlook password"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Birthdate</label>
                        <input
                          type="date"
                          value={newItem.birthdate}
                          onChange={(e) => setNewItem({ ...newItem, birthdate: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Game Codes */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Game Codes & Keys
                    </h4>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Codes/Keys (Enter multiple codes, one per line)
                      </label>
                      <textarea
                        value={newItem.code}
                        onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                        placeholder="GAME-PS4-001&#10;GAME-PS5-002&#10;GAME-SEC-003&#10;GAME-OFF-PS4-004&#10;GAME-OFF-PS5-005&#10;BACKUP-001&#10;BACKUP-002"
                        rows={6}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                        {newItem.code ? (() => {
                          const codes = newItem.code.split('\n').filter(line => line.trim());
                          const mainCodes = codes.slice(0, 5);
                          const backupCodes = codes.slice(5);
                          return (
                            <div>
                              <div className="font-medium text-green-600">✅ {codes.length} code(s) detected</div>
                              <div className="text-gray-600">
                                → {mainCodes.length} main slots: Primary PS4, Primary PS5, Secondary, Offline PS4, Offline PS5
                              </div>
                              {backupCodes.length > 0 && (
                                <div className="text-gray-600">
                                  → {backupCodes.length} backup codes for recovery
                                </div>
                              )}
                              <div className="text-blue-600 mt-1">
                                📦 Creates {Math.max(5, mainCodes.length)} stock slots
                              </div>
                            </div>
                          );
                        })() : (
                          <div>
                            <div className="text-gray-500">📝 Enter at least one code</div>
                            <div className="text-gray-400 text-xs mt-1">First 5 codes become main slots, rest become backup codes</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleAddDigitalItem} className="w-full text-sm py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium" disabled={!newItem.email && !newItem.password && !newItem.code}>
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Digital Item (Creates 5 Stock Slots)
                    </span>
                  </Button>
                </div>

                {formData.digitalItems.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Main Info</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Outlook</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Details</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {formData.digitalItems.map((item, index) => (
                          <tr key={index} className="bg-white dark:bg-gray-800">
                            <td className="py-2 px-3 text-gray-900 dark:text-gray-300">
                              <div className="font-medium truncate max-w-[120px]">{item.email}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[120px]">{item.password}</div>
                              {item.code && <div className="text-xs font-mono text-gray-400 truncate max-w-[120px]">{item.code}</div>}
                              {item.totalCodes && item.totalCodes > 1 && (
                                <div className="text-xs text-blue-500 dark:text-blue-400">+{item.totalCodes - 1} backup codes</div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-900 dark:text-gray-300">
                               <div className="text-xs truncate max-w-[100px]">{item.outlookEmail}</div>
                               <div className="text-xs text-gray-500 truncate max-w-[100px]">{item.outlookPassword}</div>
                            </td>
                            <td className="py-2 px-3 text-gray-900 dark:text-gray-300">
                                <div className="text-xs">ID: {item.onlineId}</div>
                                <div className="text-xs text-gray-500">{item.region}</div>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveDigitalItem(index)}
                                className="text-white bg-red-600 hover:bg-red-700 p-1 rounded"
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
                  Total Digital Stock: {formData.digitalItems.length} items × 5 slots each = {formData.digitalItems.length * 5} total stock
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
    } catch (error) {
      console.error('Error rendering Products component:', error);
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Products</h3>
          <p className="text-red-600">There was an error loading the products. Please try refreshing the page.</p>
        </div>
      );
    }
  };

  return renderContent();
}
