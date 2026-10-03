'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, CheckCircle2, ChefHat, Package, X, ArrowRight, Bell, Sparkles } from 'lucide-react';
import { useOrderNotifications, OrderToastItem } from '@/context/NotificationContext';
import { useData } from '@/context/DataContext';
import { formatINR } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function OrderNotificationToasts() {
  const { toasts, dismissToast } = useOrderNotifications();
  const { setTrackOrderModalOpen, setActiveTrackingOrderNumber } = useData();
  const router = useRouter();

  if (!toasts || toasts.length === 0) return null;

  const handleOpenTracking = (orderNumber: string) => {
    setActiveTrackingOrderNumber(orderNumber);
    setTrackOrderModalOpen(true);
  };

  return (
    <aside
      aria-label="Order notifications"
      className="fixed top-20 sm:top-24 right-3 sm:right-6 z-50 flex flex-col gap-3 max-w-[360px] sm:max-w-md w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const statusLower = (toast.newStatus || '').toLowerCase();
          const isOutForDelivery = statusLower === 'out_for_delivery' || statusLower === 'dispatched';
          const isDelivered = statusLower === 'delivered';
          const isPreparing = statusLower === 'preparing';

          const IconComponent = isOutForDelivery
            ? Truck
            : isDelivered
            ? CheckCircle2
            : isPreparing
            ? ChefHat
            : Package;

          const badgeColor = isOutForDelivery
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : isDelivered
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : 'bg-[#C9A24A]/20 text-[#E2C56B] border-[#C9A24A]/40';

          const accentGlow = isOutForDelivery
            ? 'shadow-[0_8px_30px_rgba(245,158,11,0.25)] border-amber-500/50'
            : isDelivered
            ? 'shadow-[0_8px_30px_rgba(16,185,129,0.25)] border-emerald-500/50'
            : 'shadow-[0_8px_30px_rgba(201,162,74,0.25)] border-[#C9A24A]/50';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`pointer-events-auto w-full rounded-2xl bg-[#0A1628]/95 backdrop-blur-md p-4 sm:p-5 border text-[#F5F1E8] ${accentGlow} relative overflow-hidden`}
            >
              {/* Top Accent Gradient Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isOutForDelivery
                    ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500'
                    : isDelivered
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
                    : 'bg-gradient-to-r from-[#C9A24A] via-[#E2C56B] to-[#C9A24A]'
                }`}
              />

              <div className="flex items-start gap-3.5">
                {/* Status Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badgeColor}`}
                >
                  <IconComponent className="w-5 h-5 animate-pulse" />
                </div>

                {/* Body Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border bg-[#101F35] text-[#E2C56B]">
                      Order #{toast.orderNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {toast.newStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="font-serif text-sm font-bold text-[#F5F1E8] leading-snug">
                    {toast.title}
                  </h4>

                  <p className="text-xs text-[#AAB4C2] mt-1 leading-relaxed">
                    {toast.message}
                  </p>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#1C2D4A]">
                    <button
                      onClick={() => handleOpenTracking(toast.orderNumber)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>Track Live Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => dismissToast(toast.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#101F35] hover:bg-[#1C2D4A] text-xs font-semibold text-[#AAB4C2] hover:text-[#F5F1E8] transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="absolute top-3 right-3 p-1 rounded-lg text-[#7E8B9B] hover:text-[#F5F1E8] hover:bg-[#101F35] transition cursor-pointer"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
}
