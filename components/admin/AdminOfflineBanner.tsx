'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';

interface AdminOfflineBannerProps {
  isOnline: boolean;
}

export default function AdminOfflineBanner({ isOnline }: AdminOfflineBannerProps) {
  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-amber-950/90 border-b border-amber-500/50 text-amber-200 px-4 py-2 text-xs flex items-center justify-between shadow-lg sticky top-0 z-50 backdrop-blur-md animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span className="font-bold text-amber-300">Offline Mode:</span>
        <span className="text-[11px] text-amber-200/90 truncate sm:overflow-visible">
          No internet connection. Order updates and status changes are paused until reconnection.
        </span>
      </div>
    </div>
  );
}
