'use client';

import React from 'react';
import {
  Smartphone,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  Download,
  Laptop,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';

interface AdminPWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
}

export default function AdminPWAInstallModal({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
}: AdminPWAInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#0A1628] border border-[#C9A24A]/40 text-[#F5F1E8] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A24A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 border-b border-[#1C2D4A] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C9A24A] to-[#B89033] p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#07111F] rounded-[14px] flex items-center justify-center">
                <Image
                  src="/admin-icon-192.png"
                  alt="Vediq Admin Logo"
                  width={28}
                  height={28}
                  className="rounded-lg object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#F5F1E8]">
                Install VEDIQ ADMIN
              </h3>
              <p className="text-[11px] text-[#E2C56B] font-semibold tracking-wider uppercase">
                Progressive Web App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#7E8B9B] hover:text-[#F5F1E8] hover:bg-[#101F35] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin relative z-10">
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-300">
                Admin App is Installed!
              </h4>
              <p className="text-xs text-[#AAB4C2] leading-relaxed">
                You are currently running the VEDIQ BIRYANI ADMIN app in standalone mode from your home screen or desktop launcher.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#AAB4C2] leading-relaxed">
                Add the dedicated <strong className="text-[#F5F1E8]">VEDIQ BIRYANI ADMIN</strong> app to your home screen or dock for instant one-tap access, real-time kitchen order dispatch, and a distraction-free fullscreen operating experience.
              </p>

              {/* Native Prompt Trigger Button if supported */}
              {isInstallable && (
                <button
                  onClick={async () => {
                    const success = await onInstall();
                    if (success) onClose();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] font-black text-xs transition shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Click Here to Install Admin App Now</span>
                </button>
              )}

              {/* Platform Instructions */}
              <div className="space-y-3 pt-1">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#E2C56B]">
                  Installation Instructions:
                </h4>

                {/* iOS Safari Guide */}
                <div className="p-3.5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F5F1E8]">
                    <Smartphone className="w-4 h-4 text-[#C9A24A]" />
                    <span>Apple iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="text-xs text-[#AAB4C2] space-y-2 pl-1 list-decimal list-inside">
                    <li>
                      Tap the <strong className="text-[#F5F1E8]">Share button</strong> (<Share2 className="w-3.5 h-3.5 inline mx-1 text-[#C9A24A]" />) in Safari&apos;s bottom toolbar.
                    </li>
                    <li>
                      Scroll down and tap <strong className="text-[#F5F1E8]">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#C9A24A]" />).
                    </li>
                    <li>
                      Tap <strong className="text-[#E2C56B]">Add</strong> in the top-right corner. The VEDIQ ADMIN app will appear on your home screen.
                    </li>
                  </ol>
                </div>

                {/* Android Chrome Guide */}
                <div className="p-3.5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F5F1E8]">
                    <Smartphone className="w-4 h-4 text-[#C9A24A]" />
                    <span>Android (Google Chrome / Edge)</span>
                  </div>
                  <ol className="text-xs text-[#AAB4C2] space-y-2 pl-1 list-decimal list-inside">
                    <li>
                      Tap the <strong className="text-[#F5F1E8]">three dots menu (⋮)</strong> in Chrome&apos;s top-right corner.
                    </li>
                    <li>
                      Tap <strong className="text-[#F5F1E8]">Install app</strong> or <strong className="text-[#F5F1E8]">Add to Home screen</strong>.
                    </li>
                    <li>
                      Confirm <strong className="text-[#E2C56B]">Install</strong>.
                    </li>
                  </ol>
                </div>

                {/* Desktop Chrome / Edge Guide */}
                <div className="p-3.5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F5F1E8]">
                    <Laptop className="w-4 h-4 text-[#C9A24A]" />
                    <span>Mac / Windows / Chromebook (Desktop)</span>
                  </div>
                  <p className="text-xs text-[#AAB4C2]">
                    Look for the <strong className="text-[#F5F1E8]">Install</strong> icon (<Download className="w-3.5 h-3.5 inline mx-1 text-[#C9A24A]" />) on the right side of the browser address bar, and click <strong className="text-[#E2C56B]">Install</strong>.
                  </p>
                </div>
              </div>

              {/* Admin App Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-[#AAB4C2]">
                <div className="p-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Secure Kitchen Ops</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C9A24A] shrink-0" />
                  <span>Real-Time Chimes</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1C2D4A] bg-[#050B14]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
