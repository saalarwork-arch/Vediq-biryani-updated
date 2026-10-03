'use client';

import React, { useState } from 'react';
import { Camera, Plus, Edit2, Trash2, Check, X, Sparkles, Eye, EyeOff } from 'lucide-react';
import { GalleryItem } from '@/types/supabase';
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from '@/lib/storageUpload';
import ImageUploadField from './ImageUploadField';

interface GalleryTabProps {
  galleryItems: GalleryItem[];
  onSaveGalleryItem: (item: GalleryItem) => Promise<{ success: boolean; error?: string }>;
  onDeleteGalleryItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function GalleryTab({
  galleryItems,
  onSaveGalleryItem,
  onDeleteGalleryItem,
  showToast,
}: GalleryTabProps) {
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<GalleryItem>({
    id: '',
    title: '',
    subtitle: '',
    image_url: '',
    tag: '',
    featured: false,
    display_order: 1,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenNew = () => {
    setEditingItem(null);
    setFormData({
      id: `gallery-${Date.now()}`,
      title: '',
      subtitle: '',
      image_url: '',
      tag: 'Heritage Dum',
      featured: false,
      display_order: galleryItems.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter gallery item title', 'error');
      return;
    }
    if (!formData.image_url.trim()) {
      showToast('Please select and upload a photo for the gallery', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: GalleryItem = {
        ...formData,
        id: formData.id || `gallery-${Date.now()}`,
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || '',
        tag: formData.tag?.trim() || '',
        image_url: formData.image_url.trim(),
        featured: Boolean(formData.featured),
        display_order: Number(formData.display_order) || 1,
        is_active: formData.is_active !== false,
      };

      const res = await onSaveGalleryItem(payload);
      if (res.success) {
        showToast(editingItem ? 'Gallery item updated!' : 'Gallery item added!', 'success');
        setIsModalOpen(false);
      } else {
        showToast(res.error || 'Failed to save gallery item', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (confirm(`Are you sure you want to delete "${item.title}" from the gallery?`)) {
      const res = await onDeleteGalleryItem(item.id);
      if (res.success) {
        showToast(`"${item.title}" deleted from gallery`, 'info');
      } else {
        showToast(res.error || 'Failed to delete gallery item', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">
            Portfolio & Kitchen Gallery
          </h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Showcase earthen handis, live slow-steaming dum craft, and royal dining presentation.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Gallery Photo</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryItems.map((item) => {
          const isActive = item.is_active !== false;
          return (
            <div
              key={item.id}
              className={`rounded-2xl bg-white border overflow-hidden shadow-xs flex flex-col justify-between transition ${
                isActive ? 'border-[#EAE6DF] hover:border-[#C59A3F]' : 'border-stone-300 opacity-60'
              }`}
            >
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                <img
                  src={resolveImageUrl(item.image_url)}
                  alt={item.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                      target.src = DEFAULT_FALLBACK_IMAGE;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {item.tag && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5E8] text-[#8C6418] border border-[#E9DCBF]">
                    {item.tag}
                  </span>
                )}

                {item.featured && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C59A3F] text-white flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Featured
                  </span>
                )}

                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-white font-serif font-bold text-xs truncate drop-shadow-xs">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-stone-300 text-[10px] truncate drop-shadow-xs">{item.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="p-3 flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#6B665E] font-medium">Seq #{item.display_order || 1}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-[#FAF5E8] hover:bg-[#F2EFE8] text-[#9E7422] font-bold transition cursor-pointer"
                    title="Edit Photo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition cursor-pointer"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF5E8] border border-[#E9DCBF] text-[#9E7422] flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1814]">
                    {editingItem ? `Edit Photo: ${editingItem.title}` : 'Add Gallery Photo'}
                  </h3>
                  <p className="text-xs text-[#6B665E]">Showcase culinary craft in the public gallery</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#8C877E] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Saffron Dum Cooking"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Subtitle / Caption</label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Slow cooked for 4 hours with pure ghee"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Category Tag</label>
                <input
                  type="text"
                  value={formData.tag || ''}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="e.g. Heritage Dum / Clay Oven / Satvik Craft"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <ImageUploadField
                label="Gallery Photo"
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                folder="gallery"
                required
                aspectRatio="video"
                showToast={showToast}
              />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.display_order || 1}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814]"
                  />
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.featured)}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded border-[#DDD8CE] text-[#C59A3F]"
                    />
                    <span className="font-bold text-[#8C6418]">Featured on Showcase</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_active)}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-[#DDD8CE] text-[#1A4B29]"
                    />
                    <span className="font-bold text-[#1A1814]">Active on Website</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#EAE6DF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#DDD8CE] text-xs font-bold text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Photo' : 'Save Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
