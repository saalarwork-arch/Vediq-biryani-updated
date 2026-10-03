'use client';

import React from 'react';
import { ShieldCheck, Leaf, Sparkles } from 'lucide-react';
import { useData } from '@/context/DataContext';
import ProductCard from './ProductCard';

export default function JainSpecialSection() {
  const { menuItems } = useData();

  // The 4 authentic Jain Satvik Biryani options in EXACT required order:
  // 1. Jain Veg Biryani
  // 2. Jain Chaap Pieces Biryani
  // 3. Jain Chaap Whole Biryani
  // 4. Jain Paneer Biryani
  const jainOrderMap: Record<string, number> = {
    'biryani-jain-veg': 1,
    'biryani-jain-chaap': 2,
    'biryani-jain-chaap-pieces': 2,
    'biryani-jain-whole-chaap': 3,
    'biryani-jain-paneer': 4,
  };

  const getJainOrderRank = (item: { id: string; name?: string }): number => {
    if (jainOrderMap[item.id]) return jainOrderMap[item.id];
    const name = (item.name || '').toLowerCase();
    const id = item.id.toLowerCase();
    // Exclude any Aloo or Mushroom options
    if (name.includes('aloo') || id.includes('aloo') || name.includes('mushroom') || id.includes('mushroom')) {
      return 999;
    }
    if (name.includes('veg')) return 1;
    if (name.includes('whole')) return 3;
    if (name.includes('chaap')) return 2;
    if (name.includes('paneer')) return 4;
    return 999;
  };

  const seenRanks = new Set<number>();
  const jainBiryanis = menuItems
    .filter((item) => {
      if (!item.is_jain || item.category !== 'biryani') return false;
      const id = item.id.toLowerCase();
      const name = (item.name || '').toLowerCase();
      // Explicitly reject aloo and mushroom options from Jain Satvik section
      if (id.includes('aloo') || name.includes('aloo') || id.includes('mushroom') || name.includes('mushroom')) {
        return false;
      }
      return getJainOrderRank(item) <= 4;
    })
    .sort((a, b) => getJainOrderRank(a) - getJainOrderRank(b))
    .filter((item) => {
      const rank = getJainOrderRank(item);
      if (seenRanks.has(rank)) return false;
      seenRanks.add(rank);
      return true;
    });

  return (
    <section id="jain-specials" className="py-8 sm:py-12 md:py-14 bg-[#0A1628] border-b border-[#1C2D4A] relative overflow-hidden transition-colors duration-200 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101F35] border border-[#C9A24A]/40 text-[11px] font-bold text-[#E2C56B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span>Dedicated Satvik Kitchen Protocol</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#F5F1E8] tracking-tight">
            100% Jain Satvik Biryani
          </h2>

          <p className="text-[#AAB4C2] text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            Pure Jain-friendly biryani options prepared without onion, garlic, or root vegetables.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-[#E2C56B]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#07111F] border border-[#1C2D4A] flex items-center gap-1">
              <Leaf className="w-3 h-3 text-[#C9A24A]" />
              No Onion &amp; No Garlic
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#07111F] border border-[#1C2D4A] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#C9A24A]" />
              Dedicated Cooking Utensils
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#07111F] border border-[#1C2D4A] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C9A24A]" />
              Authentic Charcoal Dum
            </span>
          </div>
        </div>

        {/* Exactly 4 Jain Products in Exact Order: 2 columns on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5 w-full">
          {jainBiryanis.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
