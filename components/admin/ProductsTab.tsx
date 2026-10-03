'use client';

import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  Flame,
  Clock,
  Sparkles,
  Check,
  X,
  Image as ImageIcon,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import { MenuItem, CategoryItem, MenuItemSize } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from '@/lib/storageUpload';
import { useData } from '@/context/DataContext';
import MultiImageUploadField from './MultiImageUploadField';

interface ProductsTabProps {
  menuItems: MenuItem[];
  categories: CategoryItem[];
  onSaveProduct: (item: MenuItem) => Promise<{ success: boolean; error?: string }>;
  onDeleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  onToggleActive: (id: string, active: boolean) => Promise<{ success: boolean; error?: string }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  openMediaLibraryForProduct?: () => void;
}

export default function ProductsTab({
  menuItems,
  categories,
  onSaveProduct,
  onDeleteProduct,
  onToggleActive,
  showToast,
}: ProductsTabProps) {
  const { refreshAllData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    id: '',
    name: '',
    tagline: '',
    description: '',
    category: 'biryani',
    badge: '',
    is_veg: true,
    is_jain: false,
    spicy_level: 2,
    preparation_time_minutes: 30,
    image_url: '',
    images: [],
    popular: false,
    is_active: true,
    sizes: [
      { name: 'Regular Handi (500g)', portion: '500g', serves: 'Serves 1-2', price: 299 },
    ],
  });

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchTag = item.tagline?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchTag) return false;
      }
      return true;
    });
  }, [menuItems, categoryFilter, searchQuery]);

  const handleOpenNew = () => {
    setEditingItem(null);
    setFormData({
      id: `dish-${Date.now()}`,
      name: '',
      tagline: '',
      description: '',
      category: categories[1]?.id || 'biryani',
      badge: '',
      is_veg: true,
      is_jain: false,
      spicy_level: 2,
      preparation_time_minutes: 30,
      image_url: '',
      images: [],
      popular: false,
      is_active: true,
      sizes: [
        { name: 'Regular Handi (500g)', portion: '500g', serves: 'Serves 1-2', price: 299 },
        { name: 'Family Handi (1kg)', portion: '1000g', serves: 'Serves 2-3', price: 549 },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      sizes: item.sizes && item.sizes.length > 0 ? [...item.sizes] : [{ name: 'Portion', portion: '1 Portion', serves: 'Serves 1', price: 199 }],
      images: item.images && item.images.length > 0 ? [...item.images] : (item.image_url ? [item.image_url] : []),
    });
    setIsModalOpen(true);
  };

  const handleAddSizeRow = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [
        ...(prev.sizes || []),
        { name: 'Custom Portion', portion: '500g', serves: 'Serves 1-2', price: 349 },
      ],
    }));
  };

  const handleRemoveSizeRow = (idx: number) => {
    if ((formData.sizes || []).length <= 1) {
      showToast('Each dish must have at least one portion size option', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      sizes: (prev.sizes || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSizeFieldChange = (idx: number, field: keyof MenuItemSize, value: any) => {
    setFormData((prev) => {
      const updatedSizes = [...(prev.sizes || [])];
      updatedSizes[idx] = { ...updatedSizes[idx], [field]: value };
      return { ...prev, sizes: updatedSizes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('Please enter dish name', 'error');
      return;
    }

    const primaryImg = (formData.image_url || formData.images?.[0] || '').trim();
    const allImages = (formData.images && formData.images.length > 0)
      ? formData.images
      : (primaryImg ? [primaryImg] : []);

    if (!primaryImg) {
      showToast('Please select and upload at least one dish photo', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: MenuItem = {
        id: formData.id || `dish-${Date.now()}`,
        name: formData.name.trim(),
        tagline: formData.tagline?.trim() || '',
        description: formData.description?.trim() || '',
        category: formData.category || 'royal-biryani',
        badge: formData.badge?.trim() || '',
        is_veg: Boolean(formData.is_veg),
        is_jain: Boolean(formData.is_jain),
        spicy_level: (formData.spicy_level as 1 | 2 | 3) || 2,
        preparation_time_minutes: Number(formData.preparation_time_minutes) || 30,
        image_url: primaryImg,
        images: allImages,
        sizes: formData.sizes || [{ name: 'Portion', portion: '1 Portion', serves: 'Serves 1', price: 299 }],
        popular: Boolean(formData.popular),
        is_active: formData.is_active !== false,
      };

      console.log('[PRODUCTS TAB WORKFLOW] Preparing product payload for onSaveProduct:', {
        productId: payload.id,
        primaryImg,
        allImages,
        payload,
      });

      const res = await onSaveProduct(payload);
      if (res.success) {
        await refreshAllData();
        showToast(editingItem ? 'Product updated successfully!' : 'New product created successfully!', 'success');
        setIsModalOpen(false);
      } else {
        showToast(res.error || 'Failed to save product', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}" from the menu?`)) {
      const res = await onDeleteProduct(item.id);
      if (res.success) {
        showToast(`"${item.name}" deleted from menu`, 'info');
      } else {
        showToast(res.error || 'Failed to delete product', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">Products & Dishes</h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Create, update prices, portion variants, images, spicy levels, and Satvik tags.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C877E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish by name, ingredients, tagline..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] placeholder-[#8C877E] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#1A1814] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-[#5A564F] hover:bg-[#F2EFE8] border border-[#EAE6DF]'
            }`}
          >
            All ({menuItems.length})
          </button>
          {categories
            .filter((c) => c.id !== 'all')
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-[#1A1814] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#5A564F] hover:bg-[#F2EFE8] border border-[#EAE6DF]'
                }`}
              >
                {cat.label}
              </button>
            ))}
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const startingPrice = Math.min(...item.sizes.map((s) => s.price));
          const isActive = item.is_active !== false;

          return (
            <div
              key={item.id}
              className={`rounded-2xl bg-white border transition-all overflow-hidden flex flex-col shadow-xs ${
                isActive ? 'border-[#EAE6DF] hover:border-[#C59A3F]' : 'border-stone-300 opacity-60 bg-stone-50'
              }`}
            >
              {/* Image & Badges */}
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                <img
                  src={resolveImageUrl(item.image_url, item.images)}
                  alt={item.name}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                      target.src = DEFAULT_FALLBACK_IMAGE;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5E8] text-[#8C6418] border border-[#E9DCBF] shadow-xs">
                      {item.badge}
                    </span>
                  )}
                  {item.popular && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C59A3F] text-white shadow-xs">
                      Best Seller
                    </span>
                  )}
                </div>

                {/* Active toggle button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => onToggleActive(item.id, !isActive)}
                    className={`p-1.5 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1 cursor-pointer ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-stone-600 text-white'
                    }`}
                    title={isActive ? 'Active on public menu' : 'Hidden from public menu'}
                  >
                    {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Bottom title on image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-white font-serif font-bold text-sm block drop-shadow-sm truncate">
                    {item.name}
                  </span>
                  <span className="text-stone-300 text-[11px] block truncate drop-shadow-xs">
                    {item.tagline || item.description}
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                {/* Dietary & time tags */}
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  {item.is_jain ? (
                    <span className="px-2 py-0.5 rounded-md bg-[#ECF7F0] text-[#1A4B29] font-bold border border-[#D1EBD9] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 100% Satvik Jain
                    </span>
                  ) : item.is_veg ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      Pure Veg
                    </span>
                  ) : null}

                  <span className="text-[#6B665E] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#8C877E]" /> {item.preparation_time_minutes} min
                  </span>

                  <span className="text-[#6B665E] flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-600" /> Spice: {item.spicy_level}/3
                  </span>
                </div>

                {/* Variants preview */}
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#6B665E]">{item.sizes.length} Portion Sizes:</span>
                    <span className="font-bold text-[#1A1814]">From {formatINR(startingPrice)}</span>
                  </div>
                  <div className="text-[10px] text-[#8C877E] truncate">
                    {item.sizes.map((s) => `${s.name} (${formatINR(s.price)})`).join(' • ')}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-[#F2EFE8]">
                  <span className="text-[11px] text-[#6B665E] font-medium capitalize">
                    Cat: {categories.find((c) => c.id === item.category)?.label || item.category}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-[#FAF5E8] hover:bg-[#F2EFE8] text-[#9E7422] font-bold transition cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF5E8] border border-[#E9DCBF] text-[#9E7422] flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1814]">
                    {editingItem ? `Edit Dish: ${editingItem.name}` : 'Add New Dish to Menu'}
                  </h3>
                  <p className="text-xs text-[#6B665E]">
                    Fill in dish name, description, portion sizes, prices, and imagery
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#8C877E] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dish Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#1A1814]">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Royal Shahi Dum Biryani Handi"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#1A1814]">Short Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Clay oven steamed with pure saffron & aged Basmati"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#1A1814]">Detailed Description</label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed ingredients and preparation details..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Category</label>
                  <select
                    value={formData.category || 'royal-biryani'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition cursor-pointer"
                  >
                    {categories
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Badge text */}
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Special Badge (Optional)</label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Chef's Signature, 100% Satvik"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                  />
                </div>

                {/* Multi Image Upload Field */}
                <div className="sm:col-span-2">
                  <MultiImageUploadField
                    primaryImage={formData.image_url || ''}
                    images={formData.images || (formData.image_url ? [formData.image_url] : [])}
                    onChange={(primary, allImages) =>
                      setFormData({
                        ...formData,
                        image_url: primary,
                        images: allImages,
                      })
                    }
                    folder="products"
                    showToast={showToast}
                  />
                </div>

                {/* Prep time & Spice Level */}
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Prep Time (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={formData.preparation_time_minutes || 30}
                    onChange={(e) =>
                      setFormData({ ...formData, preparation_time_minutes: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Spiciness Level (1 to 3)</label>
                  <select
                    value={formData.spicy_level || 2}
                    onChange={(e) =>
                      setFormData({ ...formData, spicy_level: Number(e.target.value) as 1 | 2 | 3 })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition cursor-pointer"
                  >
                    <option value={1}>1 - Mild & Royal Sweet Fragrance</option>
                    <option value={2}>2 - Medium Balanced Spices</option>
                    <option value={3}>3 - Robust & Spicy</option>
                  </select>
                </div>

                {/* Dietary Checks */}
                <div className="flex items-center gap-6 sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_veg)}
                      onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                      className="rounded border-[#DDD8CE] text-[#1A4B29] focus:ring-[#1A4B29]"
                    />
                    <span className="font-bold text-[#1A1814]">Pure Vegetarian</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_jain)}
                      onChange={(e) => setFormData({ ...formData, is_jain: e.target.checked })}
                      className="rounded border-[#DDD8CE] text-[#1A4B29] focus:ring-[#1A4B29]"
                    />
                    <span className="font-bold text-[#1A4B29] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Satvik Jain (No Root Veg)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.popular)}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                      className="rounded border-[#DDD8CE] text-[#C59A3F] focus:ring-[#C59A3F]"
                    />
                    <span className="font-bold text-[#8C6418]">Featured / Best Seller</span>
                  </label>
                </div>
              </div>

              {/* Portion Sizes / Variants Table */}
              <div className="space-y-3 pt-4 border-t border-[#EAE6DF]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#1A1814] uppercase tracking-wider text-[11px]">
                      Portion Sizes & Pricing
                    </h4>
                    <p className="text-[11px] text-[#6B665E]">
                      Define Handi weight, serves count, and unit price in INR
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSizeRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF5E8] border border-[#E9DCBF] text-[#8C6418] text-xs font-bold hover:bg-[#F2EFE8] cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Size Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(formData.sizes || []).map((size, sIdx) => (
                    <div
                      key={sIdx}
                      className="grid grid-cols-12 gap-2 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] items-center"
                    >
                      <div className="col-span-4">
                        <label className="text-[10px] font-semibold text-[#6B665E] block">Size Name</label>
                        <input
                          type="text"
                          required
                          value={size.name}
                          onChange={(e) => handleSizeFieldChange(sIdx, 'name', e.target.value)}
                          placeholder="e.g. Regular Handi"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DDD8CE] text-xs text-[#1A1814]"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] font-semibold text-[#6B665E] block">Portion / Wt</label>
                        <input
                          type="text"
                          value={size.portion}
                          onChange={(e) => handleSizeFieldChange(sIdx, 'portion', e.target.value)}
                          placeholder="e.g. 500g"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DDD8CE] text-xs text-[#1A1814]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-[#6B665E] block">Serves</label>
                        <input
                          type="text"
                          value={size.serves}
                          onChange={(e) => handleSizeFieldChange(sIdx, 'serves', e.target.value)}
                          placeholder="1-2"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DDD8CE] text-xs text-[#1A1814]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-[#6B665E] block">Price (₹)</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={size.price}
                          onChange={(e) => handleSizeFieldChange(sIdx, 'price', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DDD8CE] text-xs text-[#1A1814] font-bold"
                        />
                      </div>
                      <div className="col-span-1 text-right pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveSizeRow(sIdx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="p-4 -mx-6 -mb-6 mt-6 border-t border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-end gap-3">
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
                  {isSubmitting ? 'Saving Dish...' : editingItem ? 'Update Dish' : 'Publish Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
