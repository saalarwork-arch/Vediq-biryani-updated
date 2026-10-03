'use client';

import React from 'react';

interface VediqLogoProps {
  variant?: 'light' | 'dark' | 'emblem';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'header';
  showTagline?: boolean;
  className?: string;
  glow?: boolean;
}

export default function VediqLogo({
  variant = 'dark',
  size = 'md',
  showTagline = true,
  className = '',
  glow = true,
}: VediqLogoProps) {
  // Sizing height classes: maximum practical height for header and containers
  const heightClass = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-16 sm:h-18',
    xl: 'h-20 sm:h-24',
    header: 'h-[52px] xs:h-[58px] sm:h-[66px] md:h-[74px] lg:h-[82px] w-auto max-h-[95%] max-w-[min(100%,clamp(120px,38vw,380px))]',
  }[size] || 'h-[52px] xs:h-[58px] sm:h-[66px] md:h-[74px] lg:h-[82px] w-auto max-h-[95%] max-w-[min(100%,clamp(120px,38vw,380px))]';

  return (
    <div className={`inline-flex items-center justify-center select-none max-w-full ${className}`}>
      {/* Official Transparent Gold Vediq Biryani Logo Asset with Subtle Warm Gold Glow */}
      <img
        src="/images/vediq-logo-transparent.png"
        alt="Vediq Biryani - The Heritage of Aromas"
        className={`${heightClass} w-auto max-w-full object-contain transition-all duration-300 hover:scale-[1.03] ${
          glow
            ? '[filter:drop-shadow(0_0_6px_rgba(201,162,74,0.45))_drop-shadow(0_0_14px_rgba(226,197,107,0.22))] hover:[filter:drop-shadow(0_0_9px_rgba(201,162,74,0.65))_drop-shadow(0_0_20px_rgba(226,197,107,0.35))]'
            : 'drop-shadow-sm'
        }`}
      />
    </div>
  );
}

