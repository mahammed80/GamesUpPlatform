import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { bannersAPI } from '../../utils/api';

interface Banner {
  id: string | number;
  title: string;
  imageUrl: string;
  link: string;
  position: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    link: '',
    position: 1,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const [heroConfig, setHeroConfig] = useState({
    badge: '🎮 Your Ultimate Gaming Destination',
    title: 'GAMES UP',
    subtitle: 'Experience the next level of gaming with our premium collection of consoles, accessories, and titles.',
    ctaPrimary: 'Shop Now',
    ctaSecondary: 'Learn More'
  });

  const [specialOffer, setSpecialOffer] = useState({
    title: 'SPECIAL OFFER',
    subtitle: 'Up to 50% Off on Selected Items'
  });

  useEffect(() => {
    loadBanners();
    const savedOffer = localStorage.getItem('specialOfferConfig');
    if (savedOffer) {
      setSpecialOffer(JSON.parse(savedOffer));
    }
    const savedHero = localStorage.getItem('heroConfig');
    if (savedHero) {
      setHeroConfig(JSON.parse(savedHero));
    }
  }, []);

  const handleSaveHero = () => {
    localStorage.setItem('heroConfig', JSON.stringify(heroConfig));
    // Dispatch event for same-tab updates
    window.dispatchEvent(new Event('heroConfigUpdated'));
    window.dispatchEvent(new Event('storage')); // Force update for some listeners
    alert('Hero section updated successfully!');
  };

  const handleSaveSpecialOffer = () => {
    localStorage.setItem('specialOfferConfig', JSON.stringify(specialOffer));
    // Dispatch event for same-tab updates
    window.dispatchEvent(new Event('specialOfferUpdated'));
    window.dispatchEvent(new Event('storage')); // Force update for some listeners
    alert('Special Offer updated successfully!');
  };

  async function loadBanners() {
    try {
      setLoading(true);
      const data = await bannersAPI.getAll();
      setBanners(data.banners || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading banners:', err);
      setError(err.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }

  const handleSaveBanner = async () => {
    try {
      if (editingBanner) {
        await bannersAPI.update(editingBanner.id, formData);
      } else {
        await bannersAPI.create(formData);
      }

      await loadBanners();
      setIsAddModalOpen(false);
      setEditingBanner(null);
      setFormData({ title: '', imageUrl: '', link: '', position: 1, isActive: true, startDate: '', endDate: '' });
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleDeleteBanner = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      await bannersAPI.delete(id);
      await loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await bannersAPI.update(banner.id, { ...banner, isActive: !banner.isActive });
      await loadBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('Failed to update banner');
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      link: banner.link,
      position: banner.position,
      isActive: banner.isActive,
      startDate: banner.startDate || '',
      endDate: banner.endDate || '',
    });
    setIsAddModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500 dark:text-gray-400">Loading banners...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 dark:text-red-400">{error}</div>
        <Button onClick={loadBanners}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Website Banners</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage promotional banners for your website</p>
        </div>
        <Button
          onClick={() => {
            setEditingBanner(null);
            setFormData({ title: '', imageUrl: '', link: '', position: 1, isActive: true, startDate: '', endDate: '' });
            setIsAddModalOpen(true);
          }}
          icon={Plus}
        >
          Add Banner
        </Button>
      </div>

      {/* Hero Section Configuration */}
      <Card className="p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Hero Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Badge Text</label>
            <input
              type="text"
              value={heroConfig.badge}
              onChange={(e) => setHeroConfig({ ...heroConfig, badge: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="🎮 Your Ultimate Gaming Destination"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Title</label>
            <input
              type="text"
              value={heroConfig.title}
              onChange={(e) => setHeroConfig({ ...heroConfig, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="GAMES UP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtitle</label>
            <textarea
              value={heroConfig.subtitle}
              onChange={(e) => setHeroConfig({ ...heroConfig, subtitle: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Description text..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Button Text</label>
            <input
              type="text"
              value={heroConfig.ctaPrimary}
              onChange={(e) => setHeroConfig({ ...heroConfig, ctaPrimary: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Shop Now"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secondary Button Text</label>
            <input
              type="text"
              value={heroConfig.ctaSecondary}
              onChange={(e) => setHeroConfig({ ...heroConfig, ctaSecondary: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Learn More"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveHero}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Save Hero Section
          </Button>
        </div>
      </Card>

      {/* Special Offer Configuration */}
      <Card className="p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Special Offer Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section Title</label>
            <input
              type="text"
              value={specialOffer.title}
              onChange={(e) => setSpecialOffer({ ...specialOffer, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="SPECIAL OFFER"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Offer Text</label>
            <input
              type="text"
              value={specialOffer.subtitle}
              onChange={(e) => setSpecialOffer({ ...specialOffer, subtitle: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Up to 50% Off on Selected Items"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSpecialOffer}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Save Special Offer
          </Button>
        </div>
      </Card>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="p-8">
            <div className="space-y-4">
              {/* Banner Preview */}
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&h=400&fit=crop';
                  }}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    banner.isActive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    Position {banner.position}
                  </span>
                </div>
              </div>

              {/* Banner Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{banner.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Link: {banner.link || 'No link'}
                </p>
                {(banner.startDate || banner.endDate) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {banner.startDate && `From: ${new Date(banner.startDate).toLocaleDateString()}`}
                    {banner.endDate && ` | To: ${new Date(banner.endDate).toLocaleDateString()}`}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleToggleActive(banner)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {banner.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleEditBanner(banner)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteBanner(banner.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {banners.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
            No banners yet. Click "Add Banner" to create your first one.
          </div>
        )}
      </div>

      {/* Add/Edit Banner Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBanner(null);
          setFormData({ title: '', imageUrl: '', link: '', position: 1, isActive: true, startDate: '', endDate: '' });
        }}
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banner Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Summer Sale 2024"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link URL (optional)</label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position</label>
              <input
                type="number"
                min="1"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date (optional)</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date (optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingBanner(null);
                setFormData({ title: '', imageUrl: '', link: '', position: 1, isActive: true, startDate: '', endDate: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveBanner}>
              {editingBanner ? 'Update Banner' : 'Add Banner'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
