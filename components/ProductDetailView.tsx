'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Clock,
  Leaf,
  ShieldCheck,
  Sparkles,
  Package,
  UtensilsCrossed,
  Flame,
  X,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { MenuItem } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/storageUpload';
import { useCart } from '@/context/CartContext';
import { useData } from '@/context/DataContext';

interface ProductDetailViewProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Returns authentic dynamic ingredient list based on product data and type
 */
function getProductIngredients(item: MenuItem): Array<{ name: string; detail: string }> {
  const id = (item.id || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const isJain = Boolean(item.is_jain);

  if (item.category === 'order-separately' || id.startsWith('sep-')) {
    if (id === 'sep-mint-raita' || name.includes('raita')) {
      return [
        { name: 'Fresh Churned Dahi', detail: 'Creamy artisanal curd' },
        { name: 'Garden Mint & Roasted Cumin', detail: 'Hand-ground daily' },
        { name: 'Himalayan Pink Salt', detail: 'Balanced royal seasoning' },
        { name: 'Fresh Coriander & Pomegranate', detail: 'Cooling royal garnish' },
      ];
    }
    if (id === 'sep-perfect-pair' || name.includes('pair')) {
      return [
        { name: 'Signature Mint Raita (200ml)', detail: 'Cooling mint curd with roasted jeera' },
        { name: 'Traditional Shahi Tukda (4 pcs)', detail: 'Golden fried brioche in rich saffron rabri' },
        { name: 'Pistachio & Almond Flakes', detail: 'Nutty royal accompaniment' },
      ];
    }
    if (id === 'sep-shahi-tukda' || name.includes('shahi')) {
      return [
        { name: 'Ghee-Toasted Sweet Brioche', detail: 'Golden crisp layers' },
        { name: 'Slow-Simmered Saffron Rabri', detail: 'Thick whole milk infused with kesar' },
        { name: 'Cardamom & Pistachio', detail: 'Aromatic royal finish' },
      ];
    }
  }

  // Jain Satvik Biryanis (Strictly NO onion, NO garlic, NO root vegetables)
  if (isJain) {
    if (name.includes('chaap') || id.includes('chaap')) {
      return [
        { name: 'Tender Soya Chaap', detail: 'Marinated in satvik herbs without onion/garlic' },
        { name: 'Aged Long-Grain Basmati Rice', detail: 'Fragrant 2-year aged grains' },
        { name: 'Kashmiri Saffron Milk', detail: 'Pure slow-infused saffron' },
        { name: 'Satvik Whole Spices', detail: 'Green cardamom, cinnamon, cloves & mace' },
        { name: 'Natural Ghee & Herbs', detail: 'Fresh coriander & mint infusion' },
      ];
    }
    if (name.includes('paneer') || id.includes('paneer')) {
      return [
        { name: 'Fresh Malai Paneer', detail: 'Soft cottage cheese steeped in satvik yogurt marinade' },
        { name: 'Aged Long-Grain Basmati Rice', detail: 'Aromatic long grains' },
        { name: 'Kashmiri Saffron Milk', detail: 'Slow-simmered royal kesar' },
        { name: 'Satvik Royal Spices', detail: 'Pure whole spices without onion or garlic' },
        { name: 'Fresh Herb Blend', detail: 'Garden mint & green chillies' },
      ];
    }
    return [
      { name: 'Farm-Fresh Vegetables', detail: 'French beans, green peas, capsicum & cauliflower' },
      { name: 'Aged Long-Grain Basmati Rice', detail: 'Fragrant aged Basmati' },
      { name: 'Kashmiri Saffron Milk', detail: 'Pure saffron infusion' },
      { name: 'Satvik Dum Spices', detail: 'Hand-pounded cardamom, mace, cinnamon & cloves' },
      { name: 'Natural Herb Garnish', detail: '100% Satvik preparation' },
    ];
  }

  // Regular Dum Biryanis
  if (id === 'biryani-aloo' || name.includes('aloo')) {
    return [
      { name: 'Baby Potatoes', detail: 'Slow-roasted with spices until golden crisp' },
      { name: 'Aged Long-Grain Basmati Rice', detail: 'Slow-steamed on royal dum' },
      { name: 'Kashmiri Saffron Milk', detail: 'Rich aroma and golden hue' },
      { name: 'Golden Fried Birista', detail: 'Crisp caramelized onions' },
      { name: 'Hand-Pounded Dum Masala', detail: 'Star anise, mace, green cardamom & cloves' },
      { name: 'Garden Mint & Coriander', detail: 'Fresh aromatic herb layering' },
    ];
  }

  if (id === 'biryani-veg' || name.includes('veg')) {
    return [
      { name: 'Seasonal Farm Vegetables', detail: 'Carrots, french beans, green peas & florets' },
      { name: 'Aged Long-Grain Basmati Rice', detail: '2-year aged aromatic Basmati' },
      { name: 'Kashmiri Saffron Milk', detail: 'Traditional kesar milk infusion' },
      { name: 'Golden Fried Birista', detail: 'Crispy caramelized onion layers' },
      { name: 'Royal Dum Whole Spices', detail: 'Shahi jeera, cardamom, mace & cloves' },
      { name: 'Fresh Herb Infusion', detail: 'Mint leaves & green chillies' },
    ];
  }

  if (id.includes('chaap-whole') || name.includes('whole')) {
    return [
      { name: 'Whole Soya Chaap', detail: 'Grilled whole on skewer with spicy marinade' },
      { name: 'Aged Long-Grain Basmati Rice', detail: 'Steamed on slow charcoal dum' },
      { name: 'Kashmiri Saffron Milk', detail: 'Slow-infused rich saffron' },
      { name: 'Crispy Birista Onions', detail: 'Sweet caramelized golden onions' },
      { name: 'Signature Dum Spices', detail: 'Cardamom, cinnamon quills, cloves & nutmeg' },
    ];
  }

  if (id.includes('chaap') || name.includes('chaap')) {
    return [
      { name: 'Tender Soya Chaap Chunks', detail: 'Succulent pieces marinated in spiced curd' },
      { name: 'Aged Long-Grain Basmati Rice', detail: 'Fluffy separate grains' },
      { name: 'Kashmiri Saffron Milk', detail: 'Pure saffron infusion' },
      { name: 'Golden Birista Onions', detail: 'Deep caramelized onions' },
      { name: 'Secret Royal Dum Masala', detail: 'Hand-pounded aromatic spices' },
    ];
  }

  if (id.includes('paneer') || name.includes('paneer')) {
    return [
      { name: 'Fresh Malai Paneer Cubes', detail: 'Soft cottage cheese marinated in house blend' },
      { name: 'Aged Long-Grain Basmati Rice', detail: 'Premium aged fragrant grains' },
      { name: 'Kashmiri Saffron Milk', detail: 'Rich aroma and delicate flavor' },
      { name: 'Caramelized Birista', detail: 'Golden fried onions' },
      { name: 'Fragrant Whole Spices', detail: 'Green cardamom, mace, cinnamon & cloves' },
    ];
  }

  if (id.includes('mushroom') || name.includes('mushroom')) {
    const isTiger = id.includes('king') || id.includes('tiger') || name.includes('tiger');
    return [
      {
        name: isTiger ? 'King Oyster / Tiger Mushrooms' : 'Fresh Button Mushrooms',
        detail: 'Pan-seared to lock in rich earthy umami juiciness',
      },
      { name: 'Aged Long-Grain Basmati Rice', detail: '2-year aged Basmati' },
      { name: 'Kashmiri Saffron Milk', detail: 'Slow-steamed saffron infusion' },
      { name: 'Golden Fried Birista', detail: 'Caramelized onion layers' },
      { name: 'Artisanal Dum Masala', detail: 'Mace, star anise, black & green cardamom' },
    ];
  }

  // Fallback default
  return [
    { name: 'Aged Long-Grain Basmati Rice', detail: 'Premium slow-steamed grains' },
    { name: 'Kashmiri Saffron Milk', detail: 'Rich aroma and golden color' },
    { name: 'Hand-Pounded Spices', detail: 'Whole spices roasted and ground in-house' },
    { name: 'Fresh Garden Herbs', detail: 'Mint and coriander layering' },
  ];
}

export default function ProductDetailView({ item, isOpen, onClose }: ProductDetailViewProps) {
  const { addToCart, isCartOpen, setIsCartOpen, totalItemsCount } = useCart();
  const { siteSettings } = useData();

  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddedAnimation, setIsAddedAnimation] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Reset portion and quantity whenever opened with a new item
  useEffect(() => {
    if (isOpen) {
      setSelectedSizeIdx(0);
      setQuantity(1);
      setIsAddedAnimation(false);
      // Lock body scroll on mobile
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0;
  const currentSize = hasSizes ? (item.sizes[selectedSizeIdx] || item.sizes[0]) : null;
  const unitPrice = currentSize && typeof currentSize.price === 'number' ? currentSize.price : 0;
  const totalPrice = unitPrice * quantity;
  const hasValidPrice = currentSize && typeof currentSize.price === 'number';
  const imageUrl = resolveImageUrl(item.image_url, item.images);
  const ingredients = getProductIngredients(item);
  const isBiryaniCategory = item.category === 'biryani';

  const handleIncreaseQty = () => {
    setQuantity((q) => Math.min(q + 1, 20));
  };

  const handleDecreaseQty = () => {
    setQuantity((q) => Math.max(q - 1, 1));
  };

  const handleAddToCart = () => {
    if (!currentSize) return;

    addToCart({
      productId: item.id,
      name: item.name,
      size: currentSize.name,
      price: currentSize.price,
      imageUrl: imageUrl,
      quantity: quantity,
    });

    setIsAddedAnimation(true);
    setTimeout(() => {
      setIsAddedAnimation(false);
      onClose();
    }, 600);
  };

  const handleInquireWhatsApp = () => {
    const rawPhone = (siteSettings.whatsapp || siteSettings.phone || '+918744044994').replace(/[^0-9]/g, '');
    const portionText = currentSize ? ` (${currentSize.name})` : '';
    const text = encodeURIComponent(
      `Hello Vediq Biryani! I would like to order "${item.name}"${portionText} (Qty: ${quantity}). Please share availability.`
    );
    window.open(`https://wa.me/${rawPhone}?text=${text}`, '_blank');
  };

  const handleShareProduct = () => {
    if (navigator?.clipboard?.writeText) {
      const shareUrl = `${window.location.origin}/#menu`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-[#07111F] text-[#F5F1E8] overflow-y-auto overflow-x-hidden selection:bg-[#C9A24A] selection:text-[#07111F] w-full max-w-full">
        {/* ========================================================================= */}
        {/* 1. TOP STICKY NAVIGATION BAR                                             */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-40 bg-[#07111F]/95 backdrop-blur-md border-b border-[#1C2D4A] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 w-full max-w-full">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0A1628] hover:bg-[#101F35] border border-[#1C2D4A] hover:border-[#C9A24A]/40 text-xs sm:text-sm font-bold text-[#F5F1E8] hover:text-[#E2C56B] transition-all cursor-pointer group active:scale-95 shadow-xs"
            aria-label="Back to Menu"
          >
            <ArrowLeft className="w-4 h-4 text-[#C9A24A] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProduct}
              className="p-2 rounded-xl bg-[#0A1628] hover:bg-[#101F35] border border-[#1C2D4A] hover:border-[#C9A24A]/40 text-[#AAB4C2] hover:text-[#E2C56B] transition cursor-pointer"
              title="Copy Menu Link"
              aria-label="Share"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                onClose();
                setIsCartOpen(true);
              }}
              className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#C9A24A]/40 text-[#E2C56B] text-xs font-bold transition cursor-pointer shadow-xs"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#C9A24A]" />
              <span className="hidden sm:inline">Cart</span>
              {totalItemsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C9A24A] text-[#07111F] text-[10px] font-black flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. MAIN PRODUCT DETAIL CONTAINER                                         */}
        {/* ========================================================================= */}
        <motion.main
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-36 md:pb-12 overflow-x-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            {/* ======================================================================= */}
            {/* LEFT COLUMN: LARGE HERO FOOD IMAGE (STICKY ON DESKTOP)                  */}
            {/* ======================================================================= */}
            <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-[#0A1628] border border-[#1C2D4A] shadow-[0_12px_40px_rgba(0,0,0,0.6)] group">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0A1628] via-[#101F35] to-[#07111F] p-8 text-center space-y-2">
                    <UtensilsCrossed className="w-12 h-12 text-[#C9A24A]" />
                    <span className="font-serif text-lg font-bold text-[#E2C56B]">
                      {item.is_jain ? '100% Jain Satvik Feast' : 'Authentic Royal Dum Biryani'}
                    </span>
                  </div>
                )}

                {/* Subtle dark gradient overlay at base for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/80 via-transparent to-black/20 pointer-events-none" />

                {/* Top Overlay Badges */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.is_jain ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-[#07111F]/90 text-[#E2C56B] backdrop-blur-md border border-[#C9A24A]/60 flex items-center gap-1.5 shadow-md">
                        <Leaf className="w-3.5 h-3.5 text-[#C9A24A]" />
                        <span>100% Jain Satvik</span>
                      </span>
                    ) : item.is_veg ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-[#07111F]/90 text-emerald-400 backdrop-blur-md border border-emerald-500/50 flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>100% Pure Veg</span>
                      </span>
                    ) : null}

                    {item.badge && item.badge !== item.tagline && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#101F35]/90 text-[#F5F1E8] backdrop-blur-md border border-[#1C2D4A] shadow-md">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {item.preparation_time_minutes > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#07111F]/90 text-[#F5F1E8] backdrop-blur-md border border-[#1C2D4A] flex items-center gap-1 shadow-md">
                      <Clock className="w-3.5 h-3.5 text-[#C9A24A]" />
                      <span>{item.preparation_time_minutes} mins</span>
                    </span>
                  )}
                </div>

                {/* Bottom Image Tagline */}
                {item.tagline && (
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 pointer-events-none">
                    <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-[#07111F]/90 text-[#E2C56B] backdrop-blur-md border border-[#C9A24A]/40 shadow-md">
                      Royal Heritage: {item.tagline}
                    </span>
                  </div>
                )}
              </div>

              {/* Desktop Quick Highlights under Image */}
              <div className="hidden lg:grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] text-center space-y-1">
                  <Leaf className="w-4 h-4 text-[#C9A24A] mx-auto" />
                  <span className="text-[11px] font-bold text-[#F5F1E8] block">Natural Banana Leaf</span>
                  <span className="text-[10px] text-[#7E8B9B] block">Authentic aroma</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] text-center space-y-1">
                  <Clock className="w-4 h-4 text-[#C9A24A] mx-auto" />
                  <span className="text-[11px] font-bold text-[#F5F1E8] block">Freshly Prepared</span>
                  <span className="text-[10px] text-[#7E8B9B] block">Slow dum-steamed</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] text-center space-y-1">
                  <Sparkles className="w-4 h-4 text-[#C9A24A] mx-auto" />
                  <span className="text-[11px] font-bold text-[#F5F1E8] block">Aged Basmati</span>
                  <span className="text-[10px] text-[#7E8B9B] block">Pure saffron milk</span>
                </div>
              </div>
            </div>

            {/* ======================================================================= */}
            {/* RIGHT COLUMN: PRODUCT DETAILS, PORTION, QUANTITY, ORDERING               */}
            {/* ======================================================================= */}
            <div className="lg:col-span-6 space-y-6">
              {/* Product Header & Title */}
              <div className="space-y-2 border-b border-[#1C2D4A] pb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.tagline && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/40">
                      {item.tagline}
                    </span>
                  )}
                  {item.is_jain && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/40 flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-[#C9A24A]" />
                      <span>No Onion, No Garlic</span>
                    </span>
                  )}
                  {item.spicy_level && item.spicy_level > 0 ? (
                    <span className="text-[11px] text-[#AAB4C2] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Spiciness: {item.spicy_level}/3</span>
                    </span>
                  ) : null}
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F1E8] tracking-tight leading-tight">
                  {item.name}
                </h1>

                {/* Concise, Readable Description */}
                <p className="text-sm sm:text-base text-[#AAB4C2] leading-relaxed pt-1">
                  {item.description ||
                    'Slow-cooked on traditional royal dum with aromatic aged Basmati rice, hand-pounded spices, and pure Kashmiri saffron milk.'}
                </p>
              </div>

              {/* Mobile Compact Highlights */}
              <div className="grid lg:hidden grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-[#0A1628] border border-[#1C2D4A] text-center">
                  <Leaf className="w-3.5 h-3.5 text-[#C9A24A] mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-[#F5F1E8] block">Natural Leaf</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0A1628] border border-[#1C2D4A] text-center">
                  <Clock className="w-3.5 h-3.5 text-[#C9A24A] mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-[#F5F1E8] block">Fresh Dum</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0A1628] border border-[#1C2D4A] text-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A24A] mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-[#F5F1E8] block">Aged Basmati</span>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* PORTION SELECTION (CLEAN 500G / 1KG CARDS)                            */}
              {/* ===================================================================== */}
              {hasSizes && (
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#0A1628] border border-[#1C2D4A]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#AAB4C2] flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-[#C9A24A]" />
                      <span>Select Portion</span>
                    </span>
                    <span className="text-[11px] text-[#7E8B9B]">
                      {item.sizes.length > 1 ? 'Choose your feast size' : 'Standard portion'}
                    </span>
                  </div>

                  <div className={`grid ${item.sizes.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 sm:gap-3`}>
                    {item.sizes.map((size, idx) => {
                      const isSelected = selectedSizeIdx === idx;
                      return (
                        <button
                          key={size.name}
                          type="button"
                          onClick={() => setSelectedSizeIdx(idx)}
                          className={`p-3.5 sm:p-4 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden border ${
                            isSelected
                              ? 'bg-[#101F35] border-[#C9A24A] shadow-[0_0_15px_rgba(201,162,74,0.2)] text-[#F5F1E8]'
                              : 'bg-[#07111F] border-[#1C2D4A] text-[#AAB4C2] hover:bg-[#101F35] hover:border-[#1C2D4A]'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#C9A24A] to-transparent flex items-start justify-end p-1">
                              <Check className="w-3 h-3 text-[#07111F] stroke-[3]" />
                            </div>
                          )}

                          <div className="font-bold text-sm sm:text-base text-[#F5F1E8]">
                            {size.portion || size.name}
                          </div>

                          <div className="text-[11px] text-[#7E8B9B] mt-0.5">
                            {size.serves || (size.name.includes('1kg') ? 'Serves 2-3' : 'Serves 1-2')}
                          </div>

                          <div className="mt-2 text-base sm:text-lg font-black text-[#E2C56B]">
                            {size.price === 0 ? 'FREE' : formatINR(size.price)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* QUANTITY & DESKTOP PURCHASE AREA                                     */}
              {/* ===================================================================== */}
              <div className="hidden md:flex items-center justify-between gap-4 p-5 rounded-2xl bg-[#0A1628] border border-[#1C2D4A]">
                <div>
                  <span className="text-[11px] font-bold text-[#7E8B9B] uppercase tracking-wider block">
                    Total Amount
                  </span>
                  <div className="text-2xl font-black text-[#E2C56B]">
                    {hasValidPrice ? (totalPrice === 0 ? 'FREE' : formatINR(totalPrice)) : 'On Order'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity Stepper */}
                  {hasValidPrice && (
                    <div className="flex items-center bg-[#07111F] border border-[#1C2D4A] rounded-xl p-1">
                      <button
                        type="button"
                        onClick={handleDecreaseQty}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] disabled:opacity-30 cursor-pointer transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-8 text-center font-black text-sm text-[#F5F1E8]">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={handleIncreaseQty}
                        disabled={quantity >= 20}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] disabled:opacity-30 cursor-pointer transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Add to Cart CTA */}
                  {hasValidPrice ? (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                        isAddedAnimation
                          ? 'bg-[#10B981] text-white scale-98'
                          : 'bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] shadow-[0_4px_16px_rgba(201,162,74,0.3)]'
                      }`}
                    >
                      {isAddedAnimation ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Feast!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Add to Cart ({formatINR(totalPrice)})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInquireWhatsApp}
                      className="px-6 py-3.5 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 hover:bg-[#C9A24A] hover:text-[#07111F] text-[#E2C56B] font-bold text-sm transition flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Inquire on WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ===================================================================== */}
              {/* "WHAT'S INSIDE" / INGREDIENTS DEDICATED SECTION                      */}
              {/* ===================================================================== */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#C9A24A]" />
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#F5F1E8]">
                      What&apos;s Inside
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#7E8B9B]">
                    Authentic Recipe
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#07111F] border border-[#1C2D4A]/60 flex items-start gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#C9A24A] mt-1.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-[#F5F1E8]">{ing.name}</h4>
                        <p className="text-[11px] text-[#AAB4C2] leading-tight mt-0.5">{ing.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===================================================================== */}
              {/* PACKAGING & SUSTAINABILITY CONCEPT CARD                                */}
              {/* (STRICTLY NO "HANDI" OR "INDIVIDUALLY COOKED IN HANDI")               */}
              {/* ===================================================================== */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] space-y-3">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#C9A24A]" />
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#F5F1E8]">
                    Royal Packaging &amp; Freshness
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#AAB4C2] leading-relaxed">
                  Wrapped in <strong className="text-[#E2C56B] font-semibold">Natural Banana Leaf</strong> (Kele ka Patta) inside 100% plastic-free containers. Designed to preserve slow-steamed dum moisture, natural aromatic oils, and piping-hot warmth from our royal kitchen straight to your home.
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#E2C56B]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#07111F] border border-[#1C2D4A] flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C9A24A]" />
                    100% Plastic-Free Packaging
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#07111F] border border-[#1C2D4A] flex items-center gap-1.5 font-semibold">
                    <Leaf className="w-3.5 h-3.5 text-[#C9A24A]" />
                    Natural Banana Leaf Wrap
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.main>

        {/* ========================================================================= */}
        {/* 3. MOBILE STICKY BOTTOM PURCHASE BAR                                     */}
        {/* ========================================================================= */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A1628]/95 backdrop-blur-md border-t border-[#1C2D4A] p-3.5 px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] w-full max-w-full overflow-hidden">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3 w-full">
            {/* Price & Current Portion Info */}
            <div className="min-w-0">
              <span className="text-[10px] text-[#7E8B9B] uppercase font-bold block truncate">
                {currentSize?.portion || currentSize?.name || 'Portion'} &bull; Qty {quantity}
              </span>
              <div className="text-xl font-black text-[#E2C56B] leading-tight">
                {hasValidPrice ? (totalPrice === 0 ? 'FREE' : formatINR(totalPrice)) : 'On Order'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quantity Stepper on Mobile */}
              {hasValidPrice && (
                <div className="flex items-center bg-[#07111F] border border-[#1C2D4A] rounded-xl p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDecreaseQty}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#AAB4C2] hover:text-[#F5F1E8] disabled:opacity-30 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-6 text-center font-bold text-xs text-[#F5F1E8]">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={handleIncreaseQty}
                    disabled={quantity >= 20}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#AAB4C2] hover:text-[#F5F1E8] disabled:opacity-30 cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Add to Cart Button on Mobile */}
              {hasValidPrice ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isAddedAnimation
                      ? 'bg-[#10B981] text-white'
                      : 'bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F]'
                  }`}
                >
                  {isAddedAnimation ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleInquireWhatsApp}
                  className="px-3.5 py-2.5 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 text-[#E2C56B] font-bold text-xs shrink-0"
                >
                  Inquire
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
