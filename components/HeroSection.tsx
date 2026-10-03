'use client';

import React from 'react';
import { Clock, ShieldCheck, ArrowRight, Leaf } from 'lucide-react';
import { useData } from '@/context/DataContext';

export default function HeroSection() {
  const { setActiveCategory, heroContent } = useData();

  return (
    <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 md:pt-36 md:pb-20 bg-gradient-to-b from-[#07111F] via-[#0A1628] to-[#07111F] border-b border-[#1C2D4A] transition-colors duration-200 overflow-visible">
      {/* 100% CSS-based ambient radial glows (NO images, zero assets) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C9A24A]/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[320px] h-[260px] bg-[#101F35]/30 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
        {/* TOP: Small Feature / Trust Badges in Clean Row */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full bg-[#101F35]/80 border border-[#C9A24A]/35 text-[11px] sm:text-xs font-semibold text-[#F5F1E8] shadow-xs">
          <span className="inline-flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
            <span>Natural Banana Leaf</span>
          </span>
          <span className="hidden sm:inline text-[#C9A24A]/50" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
            <span>100% Plastic-Free</span>
          </span>
          <span className="hidden sm:inline text-[#C9A24A]/50" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
            <span>Fresh Hot Delivery</span>
          </span>
        </div>

        {/* MAIN: Hero Heading */}
        <h1 className="mt-6 sm:mt-7 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#F5F1E8] tracking-tight leading-[1.15] max-w-3xl">
          {heroContent.heading_line1 || heroContent.headline_line1 || 'Slow-Cooked on Royal Dum.'} <br className="hidden sm:inline" />
          <span className="text-[#E2C56B] italic font-serif block sm:inline mt-1 sm:mt-0">
            {' '}{heroContent.heading_line2 || heroContent.headline_line2 || 'Sealed with Pure Heritage.'}
          </span>
        </h1>

        {/* Supporting Description */}
        <p className="mt-3.5 sm:mt-4 text-[#AAB4C2] text-sm sm:text-base md:text-lg max-w-xl sm:max-w-2xl mx-auto leading-relaxed font-normal">
          {heroContent.description ||
            heroContent.subheading ||
            'Experience aged long-grain Basmati rice, slow-simmered Kashmiri saffron milk, and farm-fresh ingredients packed in natural banana leaf (Kele ka Patta) for an unmistakable aroma.'}
        </p>

        {/* CTAs: Primary & Secondary */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          {/* PRIMARY CTA: Explore Full Menu */}
          <a
            href={heroContent.primary_btn_link || heroContent.cta_primary_link || '#menu'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] font-bold text-sm transition-all shadow-[0_4px_16px_rgba(201,162,74,0.3)] active:scale-95 cursor-pointer text-center"
          >
            <span>{heroContent.primary_btn_text || heroContent.cta_primary_text || 'Explore Full Menu'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </a>

          {/* SECONDARY CTA / LINK: 100% Jain Satvik Menu */}
          <a
            href={heroContent.secondary_btn_link || heroContent.cta_secondary_link || '#jain-specials'}
            onClick={() => setActiveCategory('biryani')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] hover:border-[#C9A24A]/40 text-[#F5F1E8] hover:text-[#E2C56B] font-bold text-sm transition-all shadow-xs active:scale-95 cursor-pointer text-center"
          >
            <span>{heroContent.secondary_btn_text || heroContent.cta_secondary_text || '100% Jain Satvik Menu'}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
