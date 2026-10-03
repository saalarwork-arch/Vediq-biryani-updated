'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Copy, Check, X, Compass, History, ShoppingBag, ArrowRight, Bell } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useOrderNotifications } from '@/context/NotificationContext';
import { formatINR } from '@/lib/utils';
import { getStatusLabel } from '@/lib/tracking';

export default function OrderSuccessModal() {
  const { orderSuccessData, setOrderSuccessData, setTrackOrderModalOpen, setActiveTrackingOrderNumber } = useData();
  const { permission, requestPermission, trackOrderCode } = useOrderNotifications();
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const trackingCode = orderSuccessData?.tracking_code || orderSuccessData?.order_number || '';

  useEffect(() => {
    if (trackingCode) {
      trackOrderCode(trackingCode);
    }
  }, [trackingCode, trackOrderCode]);

  if (!orderSuccessData) return null;

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTrackMyOrder = () => {
    setActiveTrackingOrderNumber(trackingCode);
    setOrderSuccessData(null);
    router.push(`/track?code=${encodeURIComponent(trackingCode)}`);
  };

  const handleViewMyOrders = () => {
    setOrderSuccessData(null);
    router.push('/orders');
  };

  const handleContinueShopping = () => {
    setOrderSuccessData(null);
  };

  const handleEnablePush = async () => {
    await requestPermission();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 w-full max-w-full overflow-x-hidden overflow-y-auto">
      <div
        className="w-full max-w-lg bg-[#0A1628] border border-[#1C2D4A] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto overflow-x-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Close icon */}
        <button
          onClick={handleContinueShopping}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#7E8B9B] hover:text-[#F5F1E8] hover:bg-[#101F35] transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-[#101F35] border border-[#C9A24A]/40 text-[#E2C56B] flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-9 h-9 text-[#C9A24A]" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#F5F1E8]">
            Order Placed Successfully
          </h2>
          <p className="text-xs text-[#AAB4C2] max-w-sm mx-auto leading-relaxed">
            Your royal dum biryani has been recorded. Our khansamas will begin layering aromatic basmati rice & hand-pounded spices on slow charcoal dum.
          </p>
        </div>

        {/* Tracking Code Highlight Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#07111F] border border-[#C9A24A]/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AAB4C2]">
              Order Tracking Code
            </span>
            <span className="text-[10px] font-bold text-[#E2C56B] bg-[#101F35] px-2 py-0.5 rounded-md border border-[#C9A24A]/30">
              Save for live tracking
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 bg-[#0A1628] p-3 rounded-xl border border-[#1C2D4A]">
            <span className="font-mono text-lg sm:text-xl font-black text-[#E2C56B] tracking-wider select-all">
              {trackingCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-bold text-[#07111F] bg-[#C9A24A] hover:bg-[#E2C56B] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="Copy tracking code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#07111F]" /> : <Copy className="w-3.5 h-3.5 text-[#07111F]" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#7E8B9B]">
            You can use this code anytime to track real-time kitchen preparation and delivery progress.
          </p>
        </div>

        {/* Web Push Notification Quick Enable Banner */}
        {permission !== 'granted' && (
          <div className="p-3.5 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#E2C56B] shrink-0" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold text-[#F5F1E8]">Enable Real-Time Delivery Alerts</p>
                <p className="text-[#AAB4C2] text-[10px]">Get notified when Out for Delivery & Delivered</p>
              </div>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-3 py-1.5 rounded-lg bg-[#C9A24A] hover:bg-[#E2C56B] text-[#07111F] text-[11px] font-bold transition shrink-0 cursor-pointer shadow-xs"
            >
              Enable Alerts
            </button>
          </div>
        )}

        {/* Order Details Summary */}
        <div className="space-y-2 text-xs border-t border-b border-[#1C2D4A] py-3.5 text-[#AAB4C2]">
          <div className="flex justify-between items-center">
            <span>Current Order Status:</span>
            <span className="font-bold text-[#E2C56B] bg-[#101F35] px-2.5 py-0.5 rounded-full border border-[#C9A24A]/40 text-[11px]">
              {getStatusLabel(orderSuccessData.order_status)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Customer Name:</span>
            <span className="font-semibold text-[#F5F1E8]">{orderSuccessData.customer_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Payment Method:</span>
            <span className="font-semibold text-[#F5F1E8]">{orderSuccessData.payment_method}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Total Payable Amount:</span>
            <span className="font-bold text-[#E2C56B] text-sm">{formatINR(orderSuccessData.total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Estimated Delivery:</span>
            <span className="font-semibold text-[#F5F1E8]">{orderSuccessData.delivery_time || 'Standard (45-60 mins)'}</span>
          </div>

          {orderSuccessData.complimentary_items && orderSuccessData.complimentary_items.length > 0 && (
            <div className="pt-2 mt-2 border-t border-[#1C2D4A]/60 space-y-1">
              <span className="font-bold text-[#E2C56B] text-[11px] block">🎁 Unlocked Royal Accompaniments:</span>
              <ul className="space-y-0.5 text-[11px] text-[#F5F1E8]/90 pl-1">
                {orderSuccessData.complimentary_items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>• {item.name} ({item.quantityText})</span>
                    <span className="font-bold text-[#E2C56B]">FREE</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Three Required Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleTrackMyOrder}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
          >
            <Compass className="w-4 h-4" />
            <span>Track My Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleViewMyOrders}
              className="w-full py-2.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] hover:text-[#E2C56B] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#C9A24A]" />
              <span>View My Orders</span>
            </button>

            <button
              onClick={handleContinueShopping}
              className="w-full py-2.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#7E8B9B]" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
