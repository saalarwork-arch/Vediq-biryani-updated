'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { MediaItem } from '@/types/supabase';
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from '@/lib/storageUpload';
import ImageUploadField from './ImageUploadField';

interface MediaTabProps {
  mediaItems: MediaItem[];
  onAddMediaItem: (item: MediaItem) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function MediaTab({ mediaItems, onAddMediaItem, showToast }: MediaTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // New Image Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'dish' | 'hero' | 'gallery' | 'brand' | 'banner'>('dish');

  const filteredMedia = mediaItems.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const title = (item.title || item.name || '').toLowerCase();
      const matchTitle = title.includes(q);
      const matchUrl = (item.url || '').toLowerCase().includes(q);
      if (!matchTitle && !matchUrl) return false;
    }
    return true;
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast('Image URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) {
      showToast('Please select and upload a photo', 'error');
      return;
    }

    const title = newTitle.trim() || `Photo ${new Date().toLocaleDateString()}`;

    const newItem: MediaItem = {
      id: `media-${Date.now()}`,
      title,
      name: title,
      url: newUrl.trim(),
      category: newCategory,
      created_at: new Date().toISOString(),
    };

    onAddMediaItem(newItem);
    showToast('Photo uploaded and added to Media Library!', 'success');
    setNewTitle('');
    setNewUrl('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">Media Asset Library</h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Upload and manage restaurant culinary imagery, dish photos, and promotional banners.
          </p>
        </div>

        <button
          onClick={() => {
            setNewTitle('');
            setNewUrl('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Photo</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C877E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media assets..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'dish', 'hero', 'gallery', 'brand', 'banner'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap capitalize transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#1A1814] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#5A564F] hover:bg-[#F2EFE8] border border-[#EAE6DF]'
              }`}
            >
              {cat === 'all' ? `All (${mediaItems.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs hover:border-[#C59A3F] transition group flex flex-col"
          >
            <div className="relative aspect-square bg-stone-100 overflow-hidden">
              <img
                src={resolveImageUrl(item.url)}
                alt={item.title || item.name || 'Media Asset'}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                    target.src = DEFAULT_FALLBACK_IMAGE;
                  }
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-black/60 text-white backdrop-blur-xs">
                {item.category}
              </span>
            </div>

            <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-xs">
              <p className="font-bold text-[#1A1814] truncate text-[11px]">{item.title || item.name || 'Untitled'}</p>

              <button
                onClick={() => handleCopyUrl(item.url)}
                className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  copiedUrl === item.url
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FAF5E8] text-[#8C6418] hover:bg-[#F2EFE8]'
                }`}
              >
                {copiedUrl === item.url ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Media Modal with Direct Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF5E8] border border-[#E9DCBF] text-[#9E7422] flex items-center justify-center font-bold">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1814]">Upload Media Asset</h3>
                  <p className="text-xs text-[#6B665E]">Select photo from your phone or computer</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#8C877E] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Asset Title / Label</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Royal Dum Handi Plating"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Image Category</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
                >
                  <option value="dish">Dish / Food</option>
                  <option value="hero">Hero / Showcase</option>
                  <option value="gallery">Gallery / Kitchen</option>
                  <option value="brand">Brand / Packaging</option>
                  <option value="banner">Banner</option>
                </select>
              </div>

              {/* Direct Photo Select & Upload */}
              <ImageUploadField
                label="Select Photo"
                value={newUrl}
                onChange={(url) => setNewUrl(url)}
                folder="media"
                required
                aspectRatio="square"
                showToast={showToast}
              />

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
                  disabled={!newUrl}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Save to Media Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

