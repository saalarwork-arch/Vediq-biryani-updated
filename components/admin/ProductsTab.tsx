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
  ShoppingBag,
  ExternalLink,
  ChevronDown,
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
      { name: 'Family Handi (1kg)', portion: '1000g', serves: 'Serves 2-3', price: 549 },
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
    setIsPreviewOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      sizes:
        item.sizes && item.sizes.length > 0
          ? [...item.sizes]
          : [{ name: 'Regular Handi (500g)', portion: '500g', serves: 'Serves 1-2', price: 299 }],
      images:
        item.images && item.images.length > 0
          ? [...item.images]
          : item.image_url
          ? [item.image_url]
          : [],
    });
    setIsPreviewOpen(false);
    setIsModalOpen(true);
  };

  const handleAddSizePreset = (type: '500g' | '1kg') => {
    if (type === '500g') {
      setFormData((prev) => ({
        ...prev,
        sizes: [
          ...(prev.sizes || []),
          { name: 'Regular Handi (500g)', portion: '500g', serves: 'Serves 1-2', price: 349 },
        ],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        sizes: [
          ...(prev.sizes || []),
          { name: 'Family Feast Handi (1kg)', portion: '1000g', serves: 'Serves 2-3', price: 599 },
        ],
      }));
    }
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
    const allImages =
      formData.images && formData.images.length > 0
        ? formData.images
        : primaryImg
        ? [primaryImg]
        : [];

    if (!primaryImg) {
      showToast('Please upload at least one dish photo using Supabase storage', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: MenuItem = {
        id: formData.id || `dish-${Date.now()}`,
        name: formData.name.trim(),
        tagline: formData.tagline?.trim() || '',
        description: formData.description?.trim() || '',
        category: formData.category || 'biryani',
        badge: formData.badge?.trim() || '',
        is_veg: Boolean(formData.is_veg),
        is_jain: Boolean(formData.is_jain),
        spicy_level: (formData.spicy_level as 1 | 2 | 3) || 2,
        preparation_time_minutes: Number(formData.preparation_time_minutes) || 30,
        image_url: primaryImg,
        images: allImages,
        sizes:
          formData.sizes || [
            { name: 'Regular Handi (500g)', portion: '500g', serves: 'Serves 1-2', price: 299 },
          ],
        popular: Boolean(formData.popular),
        is_active: formData.is_active !== false,
      };

      const res = await onSaveProduct(payload);
      if (res.success) {
        await refreshAllData();
        showToast(
          editingItem ? 'Product updated successfully!' : 'New product created successfully!',
          'success'
        );
        setIsModalOpen(false);
      } else {
        showToast(res.error || 'Failed to save product', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (confirm(`Are you sure you want to permanently delete "${item.name}"?`)) {
      const res = await onDeleteProduct(item.id);
      if (res.success) {
        showToast(`"${item.name}" deleted from menu`, 'info');
      } else {
        showToast(res.error || 'Failed to delete product', 'error');
      }
    }
  };

  const handleToggleSoldOut = async (item: MenuItem) => {
    const nextState = !(item.is_active !== false);
    const res = await onToggleActive(item.id, nextState);
    if (res.success) {
      showToast(
        `"${item.name}" marked as ${nextState ? 'Available' : 'Sold Out / Inactive'}`,
        'success'
      );
    } else {
      showToast(res.error || 'Failed to update availability', 'error');
    }
  };

  return (
    <div className="space-y-6 text-[#F5F1E8]">
      {/* 1. HEADER & NEW DISH BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1C2D4A]">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F1E8] flex items-center gap-2.5">
            <UtensilsCrossed className="w-6 h-6 text-[#C9A24A]" />
            <span>Product &amp; Menu Management</span>
          </h1>
          <p className="text-xs text-[#AAB4C2] mt-0.5">
            Configure dishes, 500g &amp; 1kg portions, photo uploads to Supabase Storage, and mark items as Sold Out.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* 2. SEARCH & CATEGORY BAR */}
      <div className="bg-[#0A1628] p-4 rounded-2xl border border-[#1C2D4A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish by name, ingredients, tagline..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#C9A24A] text-[#07111F]'
                : 'bg-[#07111F] text-[#AAB4C2] hover:text-[#F5F1E8] border border-[#1C2D4A]'
            }`}
          >
            All Dishes ({menuItems.length})
          </button>
          {categories
            .filter((c) => c.id !== 'all')
            .map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-[#C9A24A] text-[#07111F]'
                    : 'bg-[#07111F] text-[#AAB4C2] hover:text-[#F5F1E8] border border-[#1C2D4A]'
                }`}
              >
                {cat.label}
              </button>
            ))}
        </div>
      </div>

      {/* 3. PRODUCT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const startingPrice = Math.min(...(item.sizes || []).map((s) => s.price));
          const isActive = item.is_active !== false;

          return (
            <div
              key={item.id}
              className={`rounded-3xl bg-[#0A1628] border transition-all overflow-hidden flex flex-col shadow-lg ${
                isActive
                  ? 'border-[#1C2D4A] hover:border-[#C9A24A]/50'
                  : 'border-rose-900/40 opacity-75 bg-[#080E1A]'
              }`}
            >
              {/* Product Image & Badges */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#07111F]">
                <img
                  src={resolveImageUrl(item.image_url, item.images)}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                  }}
                />

                {/* Status Overlay Badge */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {!isActive ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-950/90 text-rose-300 border border-rose-500/50 shadow-md">
                      Sold Out / Inactive
                    </span>
                  ) : item.badge ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#101F35]/90 text-[#E2C56B] border border-[#C9A24A]/40 shadow-md">
                      {item.badge}
                    </span>
                  ) : null}

                  {item.is_jain && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                      100% Satvik Jain
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#07111F]/90 text-[#E2C56B] border border-[#C9A24A]/40">
                  Starts at {formatINR(startingPrice)}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-base font-bold text-[#F5F1E8] leading-tight">
                      {item.name}
                    </h3>
                  </div>
                  {item.tagline && (
                    <p className="text-[11px] text-[#C9A24A] font-medium italic">{item.tagline}</p>
                  )}
                  <p className="text-xs text-[#AAB4C2] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Portion Sizes Pill List */}
                <div className="pt-2 border-t border-[#1C2D4A] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#7E8B9B] uppercase block">
                    Available Portions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(item.sizes || []).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[11px] font-semibold text-[#F5F1E8]"
                      >
                        {s.portion || s.name}: <strong className="text-[#E2C56B]">{formatINR(s.price)}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Controls */}
                <div className="pt-3 border-t border-[#1C2D4A] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSoldOut(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#101F35] hover:bg-rose-950/40 text-[#AAB4C2] hover:text-rose-300 border border-[#1C2D4A]'
                        : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Mark Sold Out</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mark Active</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-[#E2C56B] transition cursor-pointer"
                      title="Edit Dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-xl bg-[#101F35] hover:bg-rose-950/50 border border-[#1C2D4A] text-rose-400 transition cursor-pointer"
                      title="Delete Dish"
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

      {/* 4. ADD / EDIT PRODUCT MODAL WITH PREVIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0A1628] border border-[#1C2D4A] rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 text-[#F5F1E8] max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-[#07111F] border-b border-[#1C2D4A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B]">
                  <UtensilsCrossed className="w-4 h-4 text-[#C9A24A]" />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#F5F1E8]">
                    {editingItem ? `Edit: ${editingItem.name}` : 'Add New Royal Dish'}
                  </h3>
                  <p className="text-xs text-[#AAB4C2]">Direct sync with Supabase catalog &amp; storage</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isPreviewOpen
                      ? 'bg-[#C9A24A] text-[#07111F] border-[#C9A24A]'
                      : 'bg-[#101F35] text-[#E2C56B] border-[#1C2D4A]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isPreviewOpen ? 'Hide Preview' : 'Preview Card'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-[#101F35] text-[#AAB4C2] hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Preview Strip */}
            {isPreviewOpen && (
              <div className="p-4 bg-[#07111F] border-b border-[#1C2D4A] shrink-0">
                <p className="text-[10px] font-bold text-[#C9A24A] uppercase tracking-wider mb-2">
                  Live Public Website Preview:
                </p>
                <div className="max-w-sm mx-auto rounded-2xl bg-[#0A1628] border border-[#1C2D4A] p-4 flex gap-3 shadow-xl">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#07111F] shrink-0">
                    <img
                      src={resolveImageUrl(formData.image_url, formData.images)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <h4 className="font-bold text-[#F5F1E8]">{formData.name || 'Dish Name Preview'}</h4>
                    <p className="text-[11px] text-[#C9A24A] italic">{formData.tagline || 'Royal Tagline'}</p>
                    <p className="text-[10px] text-[#AAB4C2] line-clamp-1">{formData.description || 'Description...'}</p>
                    <p className="text-xs font-bold text-[#E2C56B] pt-1">
                      From {formatINR(Math.min(...(formData.sizes || [{ price: 299 }]).map((s) => s.price)))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Scroll Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dish Name */}
                <div className="space-y-1">
                  <label className="font-bold text-[#F5F1E8]">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Royal Shahi Veg Dum Biryani"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#C9A24A]"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-[#F5F1E8]">Category *</label>
                  <select
                    value={formData.category || 'biryani'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#C9A24A] cursor-pointer"
                  >
                    {categories
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0A1628]">
                          {c.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tagline */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#F5F1E8]">Royal Tagline (Subtitle)</label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Aromatic aged basmati slow-dummed with fresh saffron & garden herbs"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#C9A24A]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#F5F1E8]">Full Culinary Description</label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe authentic charcoal dum technique, spices, aromas..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#C9A24A]"
                  />
                </div>

                {/* Highlight Badge */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#F5F1E8]">Highlight Ribbon Badge</label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Chef's Signature, Best Seller, Satvik Special"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#C9A24A]"
                  />
                </div>

                {/* Multi Image Upload Field (Supabase Storage) */}
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

                {/* Prep time & Spiciness */}
                <div className="space-y-1">
                  <label className="font-bold text-[#F5F1E8]">Preparation Time (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={formData.preparation_time_minutes || 30}
                    onChange={(e) =>
                      setFormData({ ...formData, preparation_time_minutes: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#C9A24A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#F5F1E8]">Spiciness Level (1 to 3)</label>
                  <select
                    value={formData.spicy_level || 2}
                    onChange={(e) =>
                      setFormData({ ...formData, spicy_level: Number(e.target.value) as 1 | 2 | 3 })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#C9A24A] cursor-pointer"
                  >
                    <option value={1} className="bg-[#0A1628]">1 - Mild &amp; Royal Sweet Fragrance</option>
                    <option value={2} className="bg-[#0A1628]">2 - Medium Balanced Spices</option>
                    <option value={3} className="bg-[#0A1628]">3 - Robust &amp; Spicy</option>
                  </select>
                </div>

                {/* Dietary Checks & Availability */}
                <div className="sm:col-span-2 pt-2 flex flex-wrap gap-4 border-t border-[#1C2D4A]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_veg)}
                      onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                      className="rounded border-[#1C2D4A] text-emerald-500 focus:ring-0"
                    />
                    <span className="font-bold text-[#F5F1E8]">Pure Vegetarian</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_jain)}
                      onChange={(e) => setFormData({ ...formData, is_jain: e.target.checked })}
                      className="rounded border-[#1C2D4A] text-emerald-500 focus:ring-0"
                    />
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Satvik Jain (No Root Veg)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.popular)}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                      className="rounded border-[#1C2D4A] text-[#C9A24A] focus:ring-0"
                    />
                    <span className="font-bold text-[#E2C56B]">Featured / Best Seller</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active !== false}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-[#1C2D4A] text-emerald-500 focus:ring-0"
                    />
                    <span className="font-bold text-[#F5F1E8]">Available for Order (Uncheck to Mark Sold Out)</span>
                  </label>
                </div>
              </div>

              {/* 5. PORTION SIZES & WEIGHTS (500g and 1kg presets) */}
              <div className="space-y-3 pt-4 border-t border-[#1C2D4A]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-[#E2C56B] uppercase tracking-wider text-[11px]">
                      Portion Sizes &amp; Pricing (500g / 1kg)
                    </h4>
                    <p className="text-[11px] text-[#AAB4C2]">
                      Add 500g Regular Handi, 1kg Family Feast, or custom portion variants
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddSizePreset('500g')}
                      className="px-2.5 py-1 rounded-lg bg-[#101F35] border border-[#1C2D4A] text-[11px] font-bold text-[#E2C56B] hover:bg-[#1C2D4A] cursor-pointer"
                    >
                      + 500g Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSizePreset('1kg')}
                      className="px-2.5 py-1 rounded-lg bg-[#101F35] border border-[#1C2D4A] text-[11px] font-bold text-[#E2C56B] hover:bg-[#1C2D4A] cursor-pointer"
                    >
                      + 1kg Preset
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSizeRow}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#C9A24A] to-[#B89033] text-[#07111F] text-[11px] font-bold cursor-pointer"
                    >
                      + Custom Size
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(formData.sizes || []).map((size, sIdx) => (
                    <div
                      key={sIdx}
                      className="grid grid-cols-12 gap-2 p-3 bg-[#07111F] rounded-xl border border-[#1C2D4A] items-center text-xs"
                    >
                      <div className="col-span-4">
                        <label className="text-[10px] font-semibold text-[#7E8B9B] block">Size Name</label>
                        <input
                          type="text"
                          required
                          value={size.name}
                          onChange={(e) => handleSizeFieldChange(sIdx, 'name', e.target.value)}
                          placeholder="e.g. Regular Handi (500g)"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A1628] border border-[#1C2D4A] text-xs text-[#F5F1E8]"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] font-semibold text-[#7E8B9B] block">Weight / Port</label>
                        <input
                          type="text"
                          value={size.portion}
                          onChange={(e) => handleSizeFieldChange(sIdx, 'portion', e.target.value)}
                          placeholder="500g"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A1628] border border-[#1C2D4A] text-xs text-[#F5F1E8]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-[#7E8B9B] block">Serves</label>
                        <input
                          type="text"
                          value={size.serves}
                          onChange={(e) => handleSizeFieldChange(sIdx, 'serves', e.target.value)}
                          placeholder="1-2"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A1628] border border-[#1C2D4A] text-xs text-[#F5F1E8]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-[#7E8B9B] block">Price (₹)</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={size.price}
                          onChange={(e) => handleSizeFieldChange(sIdx, 'price', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A1628] border border-[#1C2D4A] text-xs text-[#E2C56B] font-bold"
                        />
                      </div>
                      <div className="col-span-1 text-right pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveSizeRow(sIdx)}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Submit Footer */}
              <div className="p-4 -mx-6 -mb-6 mt-6 border-t border-[#1C2D4A] bg-[#07111F] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#101F35] text-[#AAB4C2] hover:text-[#F5F1E8] text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Dish...' : editingItem ? 'Save Changes' : 'Publish Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
