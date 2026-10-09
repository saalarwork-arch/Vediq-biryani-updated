'use client';

import React from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

interface AdminUpdateToastProps {
  hasUpdate: boolean;
  onUpdate: () => void;
}

export default function AdminUpdateToast({
  hasUpdate,
  onUpdate,
}: AdminUpdateToastProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (!hasUpdate || dismissed) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm rounded-2xl bg-[#0A1628] border border-[#C9A24A]/60 p-4 shadow-2xl text-[#F5F1E8] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C9A24A] to-[#B89033] flex items-center justify-center text-[#07111F] shrink-0 shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold text-[#F5F1E8]">
            App Update Ready
          </h4>
          <p className="text-[11px] text-[#AAB4C2] leading-tight">
            A new version of VEDIQ BIRYANI ADMIN is available.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onUpdate}
              className="px-3 py-1.5 rounded-lg bg-[#C9A24A] hover:bg-[#D4AF37] text-[#07111F] text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Update Now</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-2.5 py-1.5 rounded-lg text-[#7E8B9B] hover:text-[#F5F1E8] text-[11px] transition cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[#7E8B9B] hover:text-[#F5F1E8] p-1 rounded-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
