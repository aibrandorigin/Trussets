import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../services/adminApi';
import { BannersState, BannerItem } from '../../types/admin';
import {
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Check,
  X,
  ExternalLink,
  Layers,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  RefreshCw
} from 'lucide-react';

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<BannersState | null>(null);
  const [activeSection, setActiveSection] = useState<keyof BannersState>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<BannerItem>>({
    title: '',
    altText: '',
    imageUrl: '',
    mobileImageUrl: '',
    clickUrl: '/',
    status: 'Active',
    displayOrder: 1,
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getBanners();
      setBanners(res.banners);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const currentList = banners ? banners[activeSection] || [] : [];

  // Reorder banner items
  const moveBanner = async (index: number, direction: 'up' | 'down') => {
    if (!banners) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= currentList.length) return;

    const updated = [...currentList];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);

    // update displayOrder
    updated.forEach((item, idx) => {
      item.displayOrder = idx + 1;
    });

    const newBanners = { ...banners, [activeSection]: updated };
    setBanners(newBanners);

    try {
      await adminApi.updateBanners(activeSection, updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle status
  const handleToggleStatus = async (index: number) => {
    if (!banners) return;
    const updated = [...currentList];
    updated[index].status = updated[index].status === 'Active' ? 'Inactive' : 'Active';

    setBanners({ ...banners, [activeSection]: updated });
    try {
      await adminApi.updateBanners(activeSection, updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete banner
  const handleDelete = async (index: number) => {
    if (!banners) return;
    const updated = [...currentList];
    updated.splice(index, 1);

    setBanners({ ...banners, [activeSection]: updated });
    try {
      await adminApi.updateBanners(activeSection, updated);
    } catch (e) {
      console.error(e);
    }
  };

  // File Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await adminApi.uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        imageUrl: res.url,
      }));
    } catch (err: any) {
      alert(err.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open modal
  const handleOpenCreate = () => {
    setEditingIndex(null);
    setFormData({
      title: '',
      altText: '',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop',
      clickUrl: '/',
      status: 'Active',
      displayOrder: currentList.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BannerItem, index: number) => {
    setEditingIndex(index);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banners) return;

    const updated = [...currentList];
    if (editingIndex !== null) {
      updated[editingIndex] = {
        ...updated[editingIndex],
        ...(formData as BannerItem),
      };
    } else {
      updated.push({
        id: `banner-${Date.now()}`,
        ...(formData as BannerItem),
        displayOrder: updated.length + 1,
      });
    }

    setBanners({ ...banners, [activeSection]: updated });
    setIsModalOpen(false);

    try {
      await adminApi.updateBanners(activeSection, updated);
    } catch (e) {
      console.error(e);
    }
  };

  const sectionConfig = [
    { id: 'desktop' as keyof BannersState, label: 'Main Banner - Desktop', icon: Monitor },
    { id: 'mobile' as keyof BannersState, label: 'Main Banner - Mobile', icon: Smartphone },
    { id: 'carousel1' as keyof BannersState, label: 'Promotional Carousel 1', icon: Layers },
    { id: 'carousel2' as keyof BannersState, label: 'Featured Carousel 2', icon: Layers },
    { id: 'carousel3' as keyof BannersState, label: 'Hero Carousel 3', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Responsive Banners & Carousels
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Independent desktop and mobile banner uploads, carousels, CTA links, and scheduling.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Slide / Banner
        </button>
      </div>

      {/* Sections Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {sectionConfig.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          const count = banners ? banners[sec.id]?.length || 0 : 0;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{sec.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notice on Mobile vs Desktop */}
      <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
        <span>
          💡 <strong>Separate Mobile Optimization:</strong> Desktop banners are recommended at 1920×600px, while Mobile banners use dedicated portrait/square assets (800×600px or 1080×1080px) to prevent awkward cropping.
        </span>
      </div>

      {/* Banner Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-[#77101F]/30 border-t-[#77101F] rounded-full animate-spin mx-auto mb-2" />
            Loading banner assets...
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-semibold">
            No banners configured in this section yet. Click "Add Slide / Banner" above.
          </div>
        ) : (
          currentList.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="w-full md:w-56 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative group">
                <img
                  src={item.imageUrl}
                  alt={item.altText || item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white rounded-md text-[10px] font-bold">
                  #{index + 1}
                </div>
              </div>

              {/* Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">{item.title}</h3>
                  <button
                    onClick={() => handleToggleStatus(index)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      item.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.status}
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">Alt Text:</span> {item.altText || 'None'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                  <span className="font-semibold text-slate-700">Click URL:</span>{' '}
                  <span className="text-blue-600 truncate">{item.clickUrl}</span>
                </div>
                {item.startDate && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    Scheduled: {item.startDate} to {item.endDate || 'Permanent'}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 self-end md:self-center">
                <button
                  onClick={() => moveBanner(index, 'up')}
                  disabled={index === 0}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveBanner(index, 'down')}
                  disabled={index === currentList.length - 1}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(item, index)}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 cursor-pointer"
                  title="Edit Banner"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="p-2 border border-red-200 rounded-xl hover:bg-red-50 text-red-600 cursor-pointer"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingIndex !== null ? 'Edit Banner / Slide' : 'Add New Slide to ' + activeSection}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g. Festival Plot Special Offers"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Image Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image Asset</label>
                <div className="flex gap-3 items-center mb-2">
                  <div className="w-24 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'Uploading...' : 'Upload Image File'}
                    </button>
                    <div className="text-[10px] text-slate-400 mt-1">PNG, JPG or WebP (Max 10MB)</div>
                  </div>
                </div>

                <input
                  type="text"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                  placeholder="Or paste direct image URL (https://...)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alt Text (Accessibility & SEO)</label>
                <input
                  type="text"
                  value={formData.altText || ''}
                  onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                  placeholder="Describe what is visible on this banner..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Click / Redirect URL</label>
                <input
                  type="text"
                  value={formData.clickUrl || ''}
                  onChange={(e) => setFormData({ ...formData, clickUrl: e.target.value })}
                  placeholder="/buy or https://..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.displayOrder || 1}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
