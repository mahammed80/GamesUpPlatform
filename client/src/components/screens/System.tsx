import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag, FolderTree, Settings as SettingsIcon } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { Toast } from '../ui/Toast';
import { publicAnonKey } from '../../utils/supabase/info';
import { BASE_URL } from '../../utils/api';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface Attribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

type Tab = 'categories' | 'subcategories' | 'attributes';

export function System() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'categories' ? 'categories' : activeTab === 'subcategories' ? 'subcategories' : 'attributes';
      const response = await fetch(
        `${BASE_URL}/system/${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load ${activeTab}`);
      }

      const data = await response.json();
      
      if (activeTab === 'categories') {
        setCategories(data);
      } else if (activeTab === 'subcategories') {
        setSubCategories(data);
      } else {
        setAttributes(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: `Failed to load ${activeTab}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const endpoint = activeTab === 'categories' ? 'categories' : activeTab === 'subcategories' ? 'subcategories' : 'attributes';
      const method = editingItem?.id ? 'PUT' : 'POST';
      const url = editingItem?.id
        ? `${BASE_URL}/system/${endpoint}/${editingItem.id}`
        : `${BASE_URL}/system/${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingItem),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setToast({ message: `${activeTab} saved successfully!`, type: 'success' });
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      setToast({ message: 'Failed to save', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const endpoint = activeTab === 'categories' ? 'categories' : activeTab === 'subcategories' ? 'subcategories' : 'attributes';
      const response = await fetch(
        `${BASE_URL}/system/${endpoint}/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      setToast({ message: 'Deleted successfully!', type: 'success' });
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const initializeDemoData = async () => {
    if (!confirm('This will create demo categories, subcategories, and attributes. Continue?')) return;

    setLoading(true);
    try {
      // Demo categories
      const demoCategories = [
        { name: 'Consoles', slug: 'consoles', icon: '🎮', description: 'Gaming consoles and hardware', displayOrder: 1, isActive: true },
        { name: 'Games', slug: 'games', icon: '🎯', description: 'Video games for all platforms', displayOrder: 2, isActive: true },
        { name: 'Accessories', slug: 'accessories', icon: '🎧', description: 'Gaming accessories and peripherals', displayOrder: 3, isActive: true },
        { name: 'Digital', slug: 'digital', icon: '💳', description: 'Digital codes and subscriptions', displayOrder: 4, isActive: true },
      ];

      for (const cat of demoCategories) {
        await fetch(`${BASE_URL}/system/categories`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cat),
        });
      }

      setToast({ message: 'Demo data initialized successfully!', type: 'success' });
      loadData();
    } catch (error) {
      console.error('Error initializing demo data:', error);
      setToast({ message: 'Failed to initialize demo data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    if (activeTab === 'categories') {
      setEditingItem({
        name: '',
        description: '',
        slug: '',
        icon: '',
        displayOrder: 0,
        isActive: true,
      });
    } else if (activeTab === 'subcategories') {
      setEditingItem({
        categoryId: categories[0]?.id || '',
        name: '',
        description: '',
        slug: '',
        displayOrder: 0,
        isActive: true,
      });
    } else {
      setEditingItem({
        name: '',
        type: 'text',
        options: [],
        isRequired: false,
        displayOrder: 0,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const renderCategoriesTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Name</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Slug</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Icon</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Order</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
            <th className="text-right p-4 text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-4 text-sm text-gray-900 dark:text-white font-medium">{category.name}</td>
              <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{category.slug}</td>
              <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{category.icon}</td>
              <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{category.displayOrder}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  category.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={() => openEditModal(category)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg mr-2"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSubCategoriesTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Name</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Category</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Slug</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Order</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
            <th className="text-right p-4 text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subCategories.map((subCategory) => (
            <tr key={subCategory.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-4 text-sm text-gray-900 dark:text-white font-medium">{subCategory.name}</td>
              <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                {categories.find(c => c.id === subCategory.categoryId)?.name || 'Unknown'}
              </td>
              <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{subCategory.slug}</td>
              <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{subCategory.displayOrder}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  subCategory.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {subCategory.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={() => openEditModal(subCategory)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg mr-2"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(subCategory.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAttributesTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Name</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Type</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Required</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Order</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
            <th className="text-right p-4 text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attributes.map((attribute) => (
            <tr key={attribute.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-4 text-sm text-gray-900 dark:text-white font-medium">{attribute.name}</td>
              <td className="p-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{attribute.type}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  attribute.isRequired ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {attribute.isRequired ? 'Required' : 'Optional'}
                </span>
              </td>
              <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{attribute.displayOrder}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  attribute.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {attribute.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={() => openEditModal(attribute)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg mr-2"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(attribute.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderModal = () => {
    if (!editingItem) return null;

    return (
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${editingItem.id ? 'Edit' : 'Add'} ${activeTab}`}>
        <div className="space-y-4">
          {activeTab === 'categories' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug</label>
                <input
                  type="text"
                  value={editingItem.slug}
                  onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon (emoji or text)</label>
                <input
                  type="text"
                  value={editingItem.icon}
                  onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Order</label>
                <input
                  type="number"
                  value={editingItem.displayOrder}
                  onChange={(e) => setEditingItem({ ...editingItem, displayOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingItem.isActive}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
              </div>
            </>
          )}

          {activeTab === 'subcategories' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Parent Category</label>
                <select
                  value={editingItem.categoryId}
                  onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug</label>
                <input
                  type="text"
                  value={editingItem.slug}
                  onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Order</label>
                <input
                  type="number"
                  value={editingItem.displayOrder}
                  onChange={(e) => setEditingItem({ ...editingItem, displayOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingItem.isActive}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
              </div>
            </>
          )}

          {activeTab === 'attributes' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <select
                  value={editingItem.type}
                  onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
              {editingItem.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options (comma-separated)</label>
                  <input
                    type="text"
                    value={editingItem.options?.join(', ') || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, options: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Order</label>
                <input
                  type="number"
                  value={editingItem.displayOrder}
                  onChange={(e) => setEditingItem({ ...editingItem, displayOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingItem.isRequired}
                  onChange={(e) => setEditingItem({ ...editingItem, isRequired: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Required</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingItem.isActive}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage categories, sub-categories, and product attributes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          Categories
        </button>
        <button
          onClick={() => setActiveTab('subcategories')}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'subcategories'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Sub-Categories
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'attributes'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Attributes
        </button>
      </div>

      {/* Content */}
      <Card className="p-8">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">{activeTab}</h2>
            <div className="flex gap-2">
              {activeTab === 'categories' && categories.length === 0 && (
                <Button onClick={initializeDemoData} variant="secondary">
                  Initialize Demo Data
                </Button>
              )}
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add {activeTab === 'categories' ? 'Category' : activeTab === 'subcategories' ? 'Sub-Category' : 'Attribute'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'categories' && renderCategoriesTable()}
              {activeTab === 'subcategories' && renderSubCategoriesTable()}
              {activeTab === 'attributes' && renderAttributesTable()}
            </>
          )}
        </div>
      </Card>

      {renderModal()}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}