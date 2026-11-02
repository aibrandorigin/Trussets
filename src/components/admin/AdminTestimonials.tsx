import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { TestimonialItem } from '../../types/admin';
import {
  MessageSquare,
  Plus,
  Star,
  Edit2,
  Trash2,
  MoveUp,
  MoveDown,
  Check,
  X,
  MapPin,
  RefreshCw
} from 'lucide-react';

export const AdminTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TestimonialItem>>({
    customerName: '',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    userType: 'Property Seller',
    location: 'Hyderabad, Telangana',
    testimonial: '',
    rating: 5,
    status: 'Published',
    displayOrder: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getTestimonials();
      setTestimonials(res.testimonials);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const moveTestimonial = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= testimonials.length) return;

    const updated = [...testimonials];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setTestimonials(updated);

    try {
      await adminApi.reorderTestimonials(updated.map((t) => t.id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (item: TestimonialItem) => {
    const newStatus = item.status === 'Published' ? 'Unpublished' : 'Published';
    try {
      const res = await adminApi.updateTestimonial(item.id, { status: newStatus });
      setTestimonials((prev) => prev.map((t) => (t.id === item.id ? res.testimonial : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this client testimonial?')) return;
    try {
      await adminApi.deleteTestimonial(id);
      fetchTestimonials();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      customerName: '',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
      userType: 'Property Buyer',
      location: 'Bangalore, Karnataka',
      testimonial: '',
      rating: 5,
      status: 'Published',
      displayOrder: testimonials.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TestimonialItem) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingId) {
        await adminApi.updateTestimonial(editingId, formData);
      } else {
        await adminApi.createTestimonial(formData);
      }
      setIsModalOpen(false);
      fetchTestimonials();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Testimonials & Social Proof
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Curate verified buyer, seller, and tenant reviews showcased across landing pages.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-[#77101F]/30 border-t-[#77101F] rounded-full animate-spin mx-auto mb-2" />
            Loading customer testimonials...
          </div>
        ) : testimonials.length === 0 ? (
          <div className="col-span-3 bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-semibold">
            No testimonials found. Click "Add Testimonial" to create one.
          </div>
        ) : (
          testimonials.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Top controls */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveTestimonial(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTestimonial(index, 'down')}
                      disabled={index === testimonials.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      item.status === 'Published'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.status}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="py-4">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic line-clamp-4">
                  "{item.testimonial}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <img
                  src={item.profileImage}
                  alt={item.customerName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.customerName}</div>
                  <div className="text-[10px] text-slate-500">
                    {item.userType} • {item.location}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingId ? 'Edit Testimonial' : 'Add Client Review'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Persona</label>
                  <select
                    value={formData.userType || 'Property Buyer'}
                    onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Property Buyer">Property Buyer</option>
                    <option value="Property Seller">Property Seller</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Property Owner">Property Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    placeholder="e.g. Kokapet, Hyderabad"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Avatar / Profile Image URL</label>
                <input
                  type="text"
                  value={formData.profileImage || ''}
                  onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Star Rating (1-5)</label>
                <select
                  value={formData.rating || 5}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Testimonial Quote</label>
                <textarea
                  rows={4}
                  value={formData.testimonial || ''}
                  onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                  required
                  placeholder="Customer experience testimonial..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Publish Status</label>
                <select
                  value={formData.status || 'Published'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                >
                  <option value="Published">Published</option>
                  <option value="Unpublished">Unpublished</option>
                </select>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
