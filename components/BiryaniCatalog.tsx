'use client';

import React from 'react';
import { Sparkles, Search, Info } from 'lucide-react';
import { useData } from '@/context/DataContext';
import ProductCard from './ProductCard';

export default function BiryaniCatalog() {
  const {
    categories,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    filteredMenuItems,
  } = useData();

  return (
    <section id="menu" className="py-8 sm:py-12 md:py-16 bg-[#07111F] border-b border-[#1C2D4A] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101F35] border border-[#C9A24A]/40 text-[11px] font-bold text-[#E2C56B]">
            <Sparkles className="w-3 h-3 text-[#C9A24A]" />
            <span>Royal Dining at Home</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#F5F1E8] tracking-tight">
            Our Authentic Royal Menu
          </h2>
          <p className="text-[#AAB4C2] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Slow-steamed on authentic royal dum to seal the natural moisture, whole spices, and Kashmiri saffron.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="mb-6 sm:mb-8 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search royal biryani, desserts, sides..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0A1628] border border-[#1C2D4A] text-xs sm:text-sm text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] transition shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7E8B9B] hover:text-[#F5F1E8] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#C9A24A] text-[#07111F] shadow-xs font-bold'
                        : 'bg-[#0A1628] text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] border border-[#1C2D4A]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compact, Image-Focused Menu Grid: 2 COLUMNS ON MOBILE, 3-4 ON DESKTOP */}
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12 bg-[#0A1628] rounded-3xl border border-[#1C2D4A] p-6 max-w-sm mx-auto">
            <Info className="w-8 h-8 text-[#C9A24A] mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#F5F1E8]">No dishes found</h3>
            <p className="text-xs text-[#AAB4C2] mt-1 leading-relaxed">
              Try adjusting your search query or switching the category tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
            {filteredMenuItems.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
