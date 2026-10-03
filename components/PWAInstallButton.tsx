'use client';

import React, { useState } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed, user dismissed it, or not installable and not iOS
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show when the browser/device supports installation
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <>
      {/* Floating Small Web App Install Trigger in Bottom-Left */}
      <div className="fixed bottom-5 left-4 sm:left-6 z-30 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center bg-[#0A1628]/95 backdrop-blur-md border border-[#C9A24A]/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-1 text-[#F5F1E8]">
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="flex items-center gap-2 pl-3 pr-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-75"
            aria-label="Install Vediq Biryani Web App"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Install App</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-full text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] transition cursor-pointer"
            title="Dismiss"
            aria-label="Dismiss app install prompt"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guided Install Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-[#0A1628] border border-[#C9A24A]/50 p-6 text-[#F5F1E8] shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] transition"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B] mb-4">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-lg font-bold text-[#F5F1E8]">
              Install Vediq Biryani
            </h3>
            <p className="text-xs text-[#AAB4C2] mt-1 leading-relaxed">
              Add the royal web app to your iPhone or iPad home screen for instant 1-tap ordering.
            </p>

            <div className="my-5 space-y-3 bg-[#07111F] p-4 rounded-2xl border border-[#1C2D4A] text-xs">
              <div className="flex items-center gap-3 text-[#F5F1E8]">
                <div className="w-7 h-7 rounded-lg bg-[#101F35] text-[#C9A24A] flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <span>1. Tap the <strong>Share</strong> button in Safari</span>
              </div>
              <div className="flex items-center gap-3 text-[#F5F1E8]">
                <div className="w-7 h-7 rounded-lg bg-[#101F35] text-[#C9A24A] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <span>2. Scroll down &amp; tap <strong>Add to Home Screen</strong></span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
