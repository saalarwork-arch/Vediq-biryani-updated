'use client';

import React, { useState } from 'react';
import { Layers, Plus, Edit2, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { CategoryItem } from '@/types/supabase';

interface CategoriesTabProps {
  categories: CategoryItem[];
  onSaveCategory: (cat: CategoryItem) => Promise<{ success: boolean; error?: string }>;
  onDeleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CategoriesTab({
  categories,
  onSaveCategory,
  onDeleteCategory,
  showToast,
}: CategoriesTabProps) {
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryItem>({
    id: '',
    label: '',
    description: '',
    image_url: '',
    is_active: true,
    display_order: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenNew = () => {
    setEditingCategory(null);
    setFormData({
      id: `cat-${Date.now()}`,
      label: '',
      description: '',
      image_url: '',
      is_active: true,
      display_order: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      showToast('Please enter category name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug =
        formData.id.trim() ||
        formData.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const payload: CategoryItem = {
        ...formData,
        id: slug,
        label: formData.label.trim(),
        description: formData.description?.trim() || '',
        image_url: formData.image_url?.trim() || '',
        display_order: Number(formData.display_order) || 1,
        is_active: formData.is_active !== false,
      };

      const res = await onSaveCategory(payload);
      if (res.success) {
        showToast(editingCategory ? 'Category updated!' : 'Category created!', 'success');
        setIsModalOpen(false);
      } else {
        showToast(res.error || 'Failed to save category', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (cat.id === 'all') {
      showToast('Cannot delete default "All Delights" category', 'error');
      return;
    }
    if (confirm(`Are you sure you want to delete category "${cat.label}"?`)) {
      const res = await onDeleteCategory(cat.id);
      if (res.success) {
        showToast(`Category "${cat.label}" deleted`, 'info');
      } else {
        showToast(res.error || 'Failed to delete category', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">Menu Categories</h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Organize menu collections, descriptions, display order, and active visibility.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isActive = cat.is_active !== false;
          return (
            <div
              key={cat.id}
              className={`p-5 rounded-2xl bg-white border transition shadow-xs flex flex-col justify-between ${
                isActive ? 'border-[#EAE6DF] hover:border-[#C59A3F]' : 'border-stone-300 opacity-60 bg-stone-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF5E8] border border-[#E9DCBF] text-[10px] font-bold text-[#8C6418] uppercase">
                    Order: #{cat.display_order || 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#1A1814]">{cat.label}</h3>
                  <p className="text-[11px] font-mono text-[#8C877E] mt-0.5">ID: {cat.id}</p>
                  {cat.description && (
                    <p className="text-xs text-[#5A564F] mt-2 leading-relaxed">{cat.description}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 flex items-center justify-between border-t border-[#F2EFE8]">
                <span className="text-[11px] text-[#6B665E]">
                  {cat.id === 'all' ? 'Default Root Category' : 'Custom Category'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg bg-[#FAF5E8] hover:bg-[#F2EFE8] text-[#9E7422] font-bold transition cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {cat.id !== 'all' && (
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1814]">
                    {editingCategory ? `Edit Category: ${editingCategory.label}` : 'Add New Category'}
                  </h3>
                  <p className="text-xs text-[#6B665E]">Configure menu tab name and sequence</p>
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
                <label className="font-bold text-[#1A1814]">Category Label *</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. Royal Biryanis"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Unique Identifier / Slug</label>
                <input
                  type="text"
                  disabled={editingCategory?.id === 'all'}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g. royal-biryani"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] font-mono focus:outline-none focus:border-[#C59A3F] focus:bg-white transition disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the category..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.display_order || 1}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_active)}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-[#DDD8CE] text-[#C59A3F] focus:ring-[#C59A3F]"
                    />
                    <span className="font-bold text-[#1A1814]">Visible on Public Menu</span>
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
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
