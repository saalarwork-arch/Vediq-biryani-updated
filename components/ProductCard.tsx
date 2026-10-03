'use client';

import React, { useState } from 'react';
import { Plus, Check, MessageCircle, UtensilsCrossed } from 'lucide-react';
import { MenuItem } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/storageUpload';
import { useCart } from '@/context/CartContext';
import { useData } from '@/context/DataContext';
import ProductDetailView from './ProductDetailView';

interface ProductCardProps {
  item: MenuItem;
}

export default function ProductCard({ item }: ProductCardProps) {
  const { addToCart } = useCart();
  const { siteSettings } = useData();
  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number>(0);
  const [isAddedAnimation, setIsAddedAnimation] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0;
  const currentSize = hasSizes ? (item.sizes[selectedSizeIdx] || item.sizes[0]) : null;
  const hasValidPrice = currentSize && typeof currentSize.price === 'number';
  const hasImage = Boolean(item.image_url && item.image_url.trim() !== '');
  const imageUrl = resolveImageUrl(item.image_url, item.images);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentSize) return;

    addToCart({
      productId: item.id,
      name: item.name,
      size: currentSize.name,
      price: currentSize.price,
      imageUrl: imageUrl,
    });

    setIsAddedAnimation(true);
    setTimeout(() => setIsAddedAnimation(false), 900);
  };

  const handleInquireWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const rawPhone = (siteSettings.whatsapp || siteSettings.phone || '+918744044994').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello Vediq Biryani! I would like to inquire about "${item.name}". Please share details.`
    );
    window.open(`https://wa.me/${rawPhone}?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Clean, Compact, Image-Focused Product Card */}
      <div
        onClick={() => setShowDetailModal(true)}
        className="w-full min-w-0 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] hover:border-[#C9A24A]/50 transition-all duration-200 overflow-hidden flex flex-col group shadow-xs hover:shadow-lg cursor-pointer"
      >
        {/* Large Food Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#101F35] flex items-center justify-center shrink-0">
          {hasImage ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0A1628] via-[#101F35] to-[#07111F] p-3 text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] border border-[#C9A24A]/30 flex items-center justify-center text-[#C9A24A]">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#E2C56B] uppercase tracking-wider">
                {item.is_jain ? 'Jain Satvik' : 'Royal Dum'}
              </span>
            </div>
          )}

          {/* Minimal unobtrusive indicator for Jain / Chef's Pick */}
          {item.is_jain && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-[#07111F]/85 text-[#E2C56B] backdrop-blur-xs border border-[#C9A24A]/40 shadow-xs pointer-events-none">
              Jain
            </span>
          )}
        </div>

        {/* Compact Content: Name & Price + Add */}
        <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between min-w-0 space-y-1.5">
          {/* Product Name */}
          <div className="min-w-0">
            <h3 className="font-serif text-xs sm:text-sm font-bold text-[#F5F1E8] group-hover:text-[#E2C56B] transition-colors leading-tight line-clamp-1 sm:line-clamp-2">
              {item.name}
            </h3>
          </div>

          {/* Portion Selector ONLY if multiple sizes exist */}
          {hasSizes && item.sizes.length > 1 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 my-0.5 overflow-x-auto scrollbar-none"
            >
              {item.sizes.map((s, idx) => {
                const isSelected = selectedSizeIdx === idx;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSelectedSizeIdx(idx)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A24A] text-[#07111F] shadow-xs'
                        : 'bg-[#101F35] text-[#AAB4C2] hover:text-[#F5F1E8] border border-[#1C2D4A]'
                    }`}
                  >
                    {s.portion || s.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Price & Add Button Row */}
          <div className="pt-1 flex items-center justify-between gap-1.5">
            {hasValidPrice ? (
              <>
                <div className="min-w-0">
                  <span className="text-sm sm:text-base font-extrabold text-[#F5F1E8] leading-none whitespace-nowrap">
                    {currentSize?.price === 0 ? (
                      <span className="text-[#E2C56B]">FREE</span>
                    ) : (
                      formatINR(currentSize!.price)
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-xs shrink-0 active:scale-95 ${
                    isAddedAnimation
                      ? 'bg-[#10B981] text-white scale-95'
                      : 'bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] shadow-[0_2px_8px_rgba(201,162,74,0.25)]'
                  }`}
                  aria-label={`Add ${item.name} to cart`}
                >
                  {isAddedAnimation ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Add</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-[#E2C56B]">On Order</span>
                <button
                  type="button"
                  onClick={handleInquireWhatsApp}
                  className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-[#101F35] border border-[#C9A24A]/40 text-[#E2C56B] hover:bg-[#C9A24A] hover:text-[#07111F] font-bold text-xs transition-all cursor-pointer shrink-0"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span className="text-[11px]">Inquire</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Premium Product Detail Page / Experience */}
      <ProductDetailView
        item={item}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  );
}
