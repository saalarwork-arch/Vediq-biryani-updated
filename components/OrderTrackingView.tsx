'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  ChefHat,
  Package,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  Printer,
  History,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  FileText,
  CreditCard,
  XCircle,
  Calendar,
  Sparkles,
  Bell,
  Send,
  Sun,
  Moon,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CustomerOrder, OrderStatus } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { buildOrderTimeline, getStatusLabel, normalizeTrackingCode, ORDER_PROGRESS_STEPS, TimelineEvent } from '@/lib/tracking';
import {
  saveNotificationPreference,
  fetchNotificationPreference,
  triggerOrderStatusNotification,
} from '@/lib/notifications';
import { useOrderNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import VediqLogo from './VediqLogo';

interface OrderTrackingViewProps {
  initialCode?: string;
  onBack?: () => void;
  isStandalonePage?: boolean;
}

export default function OrderTrackingView({
  initialCode = '',
  onBack,
  isStandalonePage = false,
}: OrderTrackingViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { isSupported, permission, requestPermission, triggerOrderStatusAlert, trackOrderCode } = useOrderNotifications();
  const queryParamCode = searchParams?.get('code') || searchParams?.get('order_number') || '';

  const [orderQuery, setOrderQuery] = useState<string>(initialCode || queryParamCode || '');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Email Notification Preferences State
  const [notifyByEmail, setNotifyByEmail] = useState<boolean>(false);
  const [notificationEmail, setNotificationEmail] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [isSavingEmailPref, setIsSavingEmailPref] = useState<boolean>(false);
  const [emailToastMsg, setEmailToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isTestingEmailAlert, setIsTestingEmailAlert] = useState<boolean>(false);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load cached user orders from localStorage for quick lookup
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('vediq_user_orders') || '[]');
      if (Array.isArray(stored)) {
        setRecentOrders(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch real order from API or Supabase
  const fetchOrderByCode = useCallback(async (codeToSearch: string, isSilentRefresh = false) => {
    const cleanCode = normalizeTrackingCode(codeToSearch);
    if (!cleanCode) return;

    if (!isSilentRefresh) {
      setIsLoading(true);
      setErrorMsg('');
    } else {
      setIsRefreshing(true);
    }

    try {
      const res = await fetch(`/api/track-order?code=${encodeURIComponent(cleanCode)}`, {
        cache: 'no-store',
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        if (!isSilentRefresh) {
          setErrorMsg(data.error || `No order found matching "${cleanCode}".`);
          setActiveOrder(null);
        }
      } else {
        const orderData = data.order as CustomerOrder;
        setActiveOrder(orderData);
        trackOrderCode(orderData.order_number);
        setErrorMsg('');
        setLastRefreshedAt(new Date());

        // Initialize email notification preferences
        const isEmailOpted =
          orderData.notify_email !== undefined
            ? Boolean(orderData.notify_email)
            : Boolean(orderData.email);
        const emailAddr = orderData.notification_email || orderData.email || '';
        setNotifyByEmail(isEmailOpted);
        setNotificationEmail(emailAddr);
        setEmailInput(emailAddr);

        // Update local cache with latest status
        try {
          const stored: CustomerOrder[] = JSON.parse(localStorage.getItem('vediq_user_orders') || '[]');
          const updated = [
            orderData,
            ...stored.filter((o) => o.order_number !== orderData.order_number),
          ];
          localStorage.setItem('vediq_user_orders', JSON.stringify(updated.slice(0, 10)));
          setRecentOrders(updated.slice(0, 10));
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      if (!isSilentRefresh) {
        setErrorMsg(err?.message || 'Failed to fetch order. Please check network.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [trackOrderCode]);

  // Trigger search on mount if initialCode or queryParamCode is present
  useEffect(() => {
    const targetCode = initialCode || queryParamCode;
    if (targetCode) {
      setOrderQuery(targetCode);
      fetchOrderByCode(targetCode);
    }
  }, [initialCode, queryParamCode, fetchOrderByCode]);

  // Set up Real-time listener & gentle polling fallback
  useEffect(() => {
    if (!activeOrder?.order_number) return;

    const orderNumber = activeOrder.order_number;
    const isTerminal = ['delivered', 'cancelled', 'failed', 'refunded'].includes(activeOrder.order_status);

    // 1. Supabase Realtime Subscription if configured
    let channel: any = null;
    if (isSupabaseConfigured()) {
      try {
        channel = supabase
          .channel(`order-track-${orderNumber}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `order_number=eq.${orderNumber}`,
            },
            (payload) => {
              if (payload.new) {
                setActiveOrder((prev) => (prev ? { ...prev, ...(payload.new as CustomerOrder) } : null));
                setLastRefreshedAt(new Date());
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('[Tracking] Supabase realtime channel error:', e);
      }
    }

    // 2. Gentle polling fallback: poll every 10s only while order is active
    if (!isTerminal) {
      pollingTimerRef.current = setInterval(() => {
        fetchOrderByCode(orderNumber, true);
      }, 10000);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [activeOrder?.order_number, activeOrder?.order_status, fetchOrderByCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) {
      setErrorMsg('Please enter your tracking code or order number.');
      return;
    }
    fetchOrderByCode(orderQuery.trim());
  };

  const handleCopyCode = () => {
    if (!activeOrder) return;
    const code = activeOrder.tracking_code || activeOrder.order_number;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintSlip = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Toggle "Notify me by Email"
  const handleToggleNotifyByEmail = async (checked: boolean) => {
    if (!activeOrder) return;
    const targetEmail = (notificationEmail || emailInput || activeOrder.email || '').trim();

    if (checked && !targetEmail) {
      setIsEditingEmail(true);
      setEmailToastMsg({
        text: 'Please enter your email address to enable delivery alerts.',
        type: 'info',
      });
      return;
    }

    setNotifyByEmail(checked);
    setIsSavingEmailPref(true);
    setEmailToastMsg(null);

    const res = await saveNotificationPreference(
      activeOrder.order_number,
      checked,
      targetEmail,
      activeOrder.customer_name
    );

    setIsSavingEmailPref(false);
    if (res.success) {
      setEmailToastMsg({
        text: checked
          ? `✓ Email alerts active! You'll receive alerts when Ready for Delivery and Out for Delivery.`
          : 'Email alerts turned off for this order.',
        type: 'success',
      });
      setTimeout(() => setEmailToastMsg(null), 5000);
    } else {
      setNotifyByEmail(!checked); // revert on error
      setEmailToastMsg({
        text: res.error || 'Failed to update email preferences.',
        type: 'error',
      });
    }
  };

  // Save updated email address
  const handleSaveEmailInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailToastMsg({
        text: 'Please enter a valid email address (e.g. name@example.com).',
        type: 'error',
      });
      return;
    }

    setIsSavingEmailPref(true);
    setEmailToastMsg(null);

    const res = await saveNotificationPreference(
      activeOrder.order_number,
      true, // enable notifications automatically when saving email
      cleanEmail,
      activeOrder.customer_name
    );

    setIsSavingEmailPref(false);
    if (res.success) {
      setNotificationEmail(cleanEmail);
      setNotifyByEmail(true);
      setIsEditingEmail(false);
      setEmailToastMsg({
        text: `✓ Email updated to ${cleanEmail}. Email alerts active for Ready & Out for Delivery!`,
        type: 'success',
      });
      setTimeout(() => setEmailToastMsg(null), 5000);
    } else {
      setEmailToastMsg({
        text: res.error || 'Failed to save email address.',
        type: 'error',
      });
    }
  };

  // Trigger test email alert via Supabase Edge Function
  const handleTestEmailAlert = async () => {
    if (!activeOrder) return;
    const targetEmail = (notificationEmail || emailInput || activeOrder.email || '').trim();

    if (!targetEmail) {
      setIsEditingEmail(true);
      setEmailToastMsg({
        text: 'Please enter an email address first to test the alert.',
        type: 'info',
      });
      return;
    }

    setIsTestingEmailAlert(true);
    setEmailToastMsg(null);

    try {
      const res = await triggerOrderStatusNotification(activeOrder, 'ready_for_delivery', {
        testMode: true,
        emailOverride: targetEmail,
      });

      if (res.success) {
        setEmailToastMsg({
          text: `✓ Edge Function triggered! Sample alert dispatched for ${targetEmail}.`,
          type: 'success',
        });
      } else {
        setEmailToastMsg({
          text: res.message || 'Error triggering Supabase Edge Function.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setEmailToastMsg({
        text: err?.message || 'Error communicating with Edge Function.',
        type: 'error',
      });
    } finally {
      setIsTestingEmailAlert(false);
      setTimeout(() => setEmailToastMsg(null), 6000);
    }
  };

  // Timeline computation with strictly real timestamps
  const timelineData = activeOrder ? buildOrderTimeline(activeOrder) : null;

  // Format real timestamp nicely
  const formatEventTimestamp = (isoString: string | null) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  const getStepIcon = (iconName: string, isDone: boolean, isCurrent: boolean) => {
    const className = `w-4 h-4 sm:w-5 sm:h-5 ${
      isCurrent ? 'text-[#07111F]' : isDone ? 'text-[#07111F]' : 'text-[#7E8B9B]'
    }`;
    switch (iconName) {
      case 'clock':
        return <Clock className={className} />;
      case 'check':
      case 'check-circle':
        return <CheckCircle2 className={className} />;
      case 'chef':
        return <ChefHat className={className} />;
      case 'package':
        return <Package className={className} />;
      case 'truck':
        return <Truck className={className} />;
      default:
        return <CheckCircle2 className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F5F1E8] flex flex-col selection:bg-[#C9A24A] selection:text-[#07111F] w-full max-w-full overflow-x-hidden">
      {/* Top Royal Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0A1628]/95 backdrop-blur-md border-b border-[#1C2D4A] px-4 sm:px-6 lg:px-8 py-3.5 print:hidden w-full max-w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-[#F5F1E8] hover:text-[#E2C56B] hover:border-[#C9A24A]/40 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                aria-label="Back to menu"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : (
              <Link
                href="/"
                className="p-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-[#F5F1E8] hover:text-[#E2C56B] hover:border-[#C9A24A]/40 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                aria-label="Back to home"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            )}

            <Link href="/" className="flex items-center group">
              <VediqLogo variant="dark" size="header" showTagline={false} />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] hover:border-[#C9A24A]/40 text-[#E2C56B] hover:text-[#F5F1E8] transition-all cursor-pointer shrink-0"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#E2C56B]" />
              ) : (
                <Moon className="w-4 h-4 text-[#8F6413]" />
              )}
            </button>

            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] hover:text-[#E2C56B] hover:border-[#C9A24A]/40 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#C9A24A]" />
              <span className="hidden sm:inline">My Orders</span>
              <span className="sm:hidden">Orders</span>
            </Link>

            <Link
              href="/#menu"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Explore Menu</span>
              <span className="sm:hidden">Menu</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 overflow-x-hidden">
        {/* Title & Search Section */}
        <section className="text-center space-y-4 print:hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#101F35] border border-[#C9A24A]/30 text-[#E2C56B] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span>Royal Kitchen Fulfillment</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F5F1E8] tracking-tight">
              Track Your Order
            </h1>
            <p className="text-xs sm:text-sm text-[#AAB4C2] max-w-xl mx-auto leading-relaxed">
              Enter your unique tracking code or order number to inspect real-time slow-dum cooking, packing, and doorstep delivery.
            </p>
          </div>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2.5 pt-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Enter Tracking Code (e.g. VEDIQ-8K4M9X or VB-317364)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] text-sm font-semibold text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-sm font-extrabold transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Track Order</span>
              )}
            </button>
          </form>

          {/* Error Message */}
          {errorMsg && (
            <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Recent Orders Quick Bar */}
          {recentOrders.length > 0 && !activeOrder && (
            <div className="max-w-xl mx-auto pt-3 text-left">
              <p className="text-[11px] font-bold text-[#7E8B9B] uppercase tracking-wider mb-2">
                Recent orders in this browser:
              </p>
              <div className="flex flex-wrap gap-2">
                {recentOrders.slice(0, 3).map((ord) => (
                  <button
                    key={ord.order_number}
                    type="button"
                    onClick={() => {
                      setOrderQuery(ord.order_number);
                      fetchOrderByCode(ord.order_number);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#0A1628] hover:bg-[#101F35] border border-[#1C2D4A] hover:border-[#C9A24A]/40 text-xs font-mono font-bold text-[#E2C56B] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{ord.order_number}</span>
                    <span className="text-[10px] text-[#7E8B9B] font-sans">({getStatusLabel(ord.order_status)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Real Order Details Section */}
        {activeOrder && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* Top Order Information Bar */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2D4A] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7E8B9B]">
                      Order Tracking Code
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Kitchen Sync
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-[#E2C56B] tracking-wide select-all">
                      {activeOrder.tracking_code || activeOrder.order_number}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-[#E2C56B] transition cursor-pointer"
                      title="Copy Tracking Code"
                      aria-label="Copy tracking code"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchOrderByCode(activeOrder.order_number, true)}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] hover:text-[#E2C56B] transition cursor-pointer disabled:opacity-50"
                    title="Refresh current status from database"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C9A24A]' : ''}`} />
                    <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                  </button>

                  <button
                    onClick={handlePrintSlip}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#AAB4C2] hover:text-[#F5F1E8] transition cursor-pointer print:hidden"
                    title="Print receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>

              {/* Order Metadata Quick Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#AAB4C2]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7E8B9B] block">Order Placed</span>
                  <span className="font-semibold text-[#F5F1E8]">
                    {formatEventTimestamp(activeOrder.created_at) || 'Just now'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7E8B9B] block">Estimated Slot</span>
                  <span className="font-semibold text-[#F5F1E8]">
                    {activeOrder.delivery_time || 'Standard (45-60 mins)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7E8B9B] block">Payment Method</span>
                  <span className="font-semibold text-[#F5F1E8]">{activeOrder.payment_method}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7E8B9B] block">Total Amount</span>
                  <span className="font-bold text-[#E2C56B] text-sm">{formatINR(activeOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* 1. Real-Time Web Push & Browser Toast Notifications Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] hover:border-[#C9A24A]/40 shadow-xl space-y-4 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C2D4A] pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#101F35] border border-[#C9A24A]/30 flex items-center justify-center text-[#E2C56B]">
                    <Bell className="w-4 h-4 text-[#C9A24A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-base font-bold text-[#F5F1E8]">
                        Web Push & Browser Toast Alerts
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#101F35] text-emerald-400 border border-emerald-500/30 uppercase font-bold">
                        Web Notifications API
                      </span>
                    </div>
                    <p className="text-xs text-[#AAB4C2]">
                      Real-time client-side alerts trigger instantly when your order status changes to Out for Delivery or Delivered.
                    </p>
                  </div>
                </div>

                {/* Permission Toggle / Status */}
                <div className="flex items-center gap-2 shrink-0">
                  {permission === 'granted' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Push Enabled</span>
                    </span>
                  ) : permission === 'denied' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Blocked in Browser</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => requestPermission()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Enable Browser Push</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Status Trigger Test Actions */}
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-[#AAB4C2] space-y-1">
                  <p className="font-semibold text-[#F5F1E8]">Test Client-Side Status Transition Alerts:</p>
                  <p className="text-[11px] text-[#7E8B9B]">Simulate live status events with native browser notification & floating toast alerts.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      triggerOrderStatusAlert({
                        orderNumber: activeOrder.order_number,
                        previousStatus: 'pending',
                        newStatus: 'out_for_delivery',
                        customerName: activeOrder.customer_name,
                        total: activeOrder.total,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer active:scale-95"
                  >
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test &quot;Out for Delivery&quot;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerOrderStatusAlert({
                        orderNumber: activeOrder.order_number,
                        previousStatus: 'out_for_delivery',
                        newStatus: 'delivered',
                        customerName: activeOrder.customer_name,
                        total: activeOrder.total,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-emerald-500/40 text-emerald-300 text-xs font-bold transition cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test &quot;Delivered&quot;</span>
                  </button>
                </div>
              </div>
            </div>

            {/* "Notify me by Email" Notification Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] hover:border-[#C9A24A]/40 shadow-xl space-y-4 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C2D4A] pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#101F35] border border-[#C9A24A]/30 flex items-center justify-center text-[#E2C56B]">
                    <Bell className="w-4 h-4 text-[#C9A24A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-base font-bold text-[#F5F1E8]">
                        Order Notification Alerts
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/30 uppercase font-bold">
                        Supabase Edge Function
                      </span>
                    </div>
                    <p className="text-xs text-[#AAB4C2]">
                      Automated email alerts for Ready for Delivery and Out for Delivery milestones.
                    </p>
                  </div>
                </div>

                {/* Test Edge Alert Button */}
                <button
                  type="button"
                  onClick={handleTestEmailAlert}
                  disabled={isTestingEmailAlert}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#C9A24A]/40 text-xs font-bold text-[#E2C56B] transition cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto shadow-xs"
                  title="Test the Supabase Edge Function email alert for this order"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingEmailAlert ? 'animate-pulse text-[#C9A24A]' : ''}`} />
                  <span>{isTestingEmailAlert ? 'Triggering...' : 'Test Email Alert'}</span>
                </button>
              </div>

              {/* Checkbox Section */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3.5">
                  <label className="relative flex items-center cursor-pointer pt-0.5" htmlFor="notify-email-checkbox">
                    <input
                      type="checkbox"
                      id="notify-email-checkbox"
                      checked={notifyByEmail}
                      onChange={(e) => handleToggleNotifyByEmail(e.target.checked)}
                      disabled={isSavingEmailPref}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded-lg bg-[#07111F] border-2 border-[#1C2D4A] peer-checked:border-[#C9A24A] peer-checked:bg-[#C9A24A] peer-focus:ring-2 peer-focus:ring-[#C9A24A]/30 transition-all flex items-center justify-center">
                      {notifyByEmail && <Check className="w-3.5 h-3.5 text-[#07111F] stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="notify-email-checkbox"
                        className="text-sm font-bold text-[#F5F1E8] hover:text-[#E2C56B] cursor-pointer select-none transition"
                      >
                        Notify me by Email
                      </label>
                      {notifyByEmail ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Alerts Enabled
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#7E8B9B] bg-[#07111F] px-2 py-0.5 rounded-full border border-[#1C2D4A]">
                          Optional
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#AAB4C2] leading-relaxed">
                      Receive real-time email notifications powered by Supabase Edge Function as soon as your order status changes to{' '}
                      <strong className="text-[#E2C56B] font-semibold">Packed / Ready for Delivery</strong> or{' '}
                      <strong className="text-[#E2C56B] font-semibold">Out for Delivery</strong>.
                    </p>

                    {/* Email Recipient Preview & Change */}
                    {notifyByEmail && !isEditingEmail && (
                      <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[#7E8B9B]">Notification address:</span>
                        <span className="font-mono font-bold text-[#E2C56B] bg-[#07111F] px-2.5 py-1 rounded-xl border border-[#1C2D4A]">
                          {notificationEmail || activeOrder.email || 'No email specified'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailInput(notificationEmail || activeOrder.email || '');
                            setIsEditingEmail(true);
                          }}
                          className="text-[#C9A24A] hover:text-[#E2C56B] underline text-xs font-semibold cursor-pointer ml-1"
                        >
                          Change Email
                        </button>
                      </div>
                    )}

                    {/* Inline Email Input Form */}
                    {(isEditingEmail || (notifyByEmail && !notificationEmail && !activeOrder.email)) && (
                      <form onSubmit={handleSaveEmailInput} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
                          <input
                            type="email"
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="Enter your email address (e.g. name@example.com)"
                            className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs font-semibold text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] transition"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={isSavingEmailPref}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            {isSavingEmailPref ? 'Saving...' : 'Save & Enable'}
                          </button>
                          {(notificationEmail || activeOrder.email) && (
                            <button
                              type="button"
                              onClick={() => setIsEditingEmail(false)}
                              className="px-3 py-2 rounded-xl bg-[#07111F] hover:bg-[#101F35] border border-[#1C2D4A] text-[#AAB4C2] hover:text-[#F5F1E8] text-xs font-medium cursor-pointer transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Email Feedback Toast Banner */}
                {emailToastMsg && (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in ${
                      emailToastMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : emailToastMsg.type === 'error'
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                        : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />
                    <span className="leading-relaxed">{emailToastMsg.text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Order Status Timeline */}
            <div className="p-5 sm:p-7 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C2D4A] pb-3">
                <div className="space-y-0.5">
                  <h2 className="font-serif text-lg font-bold text-[#F5F1E8]">Order Status Timeline</h2>
                  <p className="text-xs text-[#AAB4C2]">
                    Authentic kitchen log. Timestamps appear only after that status occurs.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7E8B9B]">Current State:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/40 shadow-xs">
                    {getStatusLabel(activeOrder.order_status)}
                  </span>
                </div>
              </div>

              {/* Exception/Terminal State Banner */}
              {timelineData?.isTerminal && timelineData.terminalStatus && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-sm text-rose-200">
                      {timelineData.terminalStatus.label}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed">{timelineData.terminalStatus.description}</p>
                  {timelineData.terminalStatus.timestamp && (
                    <p className="text-[11px] text-rose-400/80 font-mono">
                      Recorded on: {formatEventTimestamp(timelineData.terminalStatus.timestamp)}
                    </p>
                  )}
                </div>
              )}

              {/* Standard Active Timeline Progression */}
              {!timelineData?.isTerminal && timelineData?.steps && (
                <div className="py-2">
                  {/* Desktop Horizontal Stepper */}
                  <div className="hidden md:block relative">
                    <div className="absolute left-6 right-6 top-5 h-1 bg-[#1C2D4A] -z-0" />
                    <div
                      className="absolute left-6 top-5 h-1 bg-gradient-to-r from-[#C9A24A] to-[#E2C56B] transition-all duration-700 -z-0"
                      style={{
                        width: `calc(${
                          (timelineData.currentStepIndex / (ORDER_PROGRESS_STEPS.length - 1)) * 100
                        }% - 24px)`,
                      }}
                    />

                    <div className="flex justify-between items-start relative z-10">
                      {timelineData.steps.map((step, idx) => {
                        const stepInfo = ORDER_PROGRESS_STEPS[idx];
                        return (
                          <div key={step.key} className="flex flex-col items-center text-center max-w-[130px] space-y-2">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                                step.isCurrent
                                  ? 'bg-[#C9A24A] border-2 border-[#F5F1E8] shadow-[0_0_15px_rgba(201,162,74,0.6)] scale-110'
                                  : step.isCompleted
                                  ? 'bg-[#C9A24A] border border-[#C9A24A]'
                                  : 'bg-[#07111F] border border-[#1C2D4A]'
                              }`}
                            >
                              {getStepIcon(stepInfo.iconName, step.isCompleted, step.isCurrent)}
                            </div>

                            <div className="space-y-0.5">
                              <span
                                className={`text-xs font-bold block ${
                                  step.isCurrent
                                  ? 'text-[#E2C56B]'
                                  : step.isCompleted
                                  ? 'text-[#F5F1E8]'
                                  : 'text-[#7E8B9B]'
                                }`}
                              >
                                {step.label}
                              </span>

                              {/* Authentic timestamp display */}
                              {step.timestamp ? (
                                <span className="text-[10px] font-mono text-[#AAB4C2] block leading-tight">
                                  {formatEventTimestamp(step.timestamp)}
                                </span>
                              ) : step.isUpcoming ? (
                                <span className="text-[10px] text-[#4E5B6E] block font-mono">Pending</span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile & Tablet Vertical Stepper */}
                  <div className="md:hidden space-y-4">
                    {timelineData.steps.map((step, idx) => {
                      const stepInfo = ORDER_PROGRESS_STEPS[idx];
                      return (
                        <div key={step.key} className="flex items-start gap-3.5 relative">
                          {/* Connecting line */}
                          {idx < timelineData.steps.length - 1 && (
                            <div
                              className={`absolute left-4 top-8 bottom-0 w-0.5 -translate-x-1/2 ${
                                step.isCompleted ? 'bg-[#C9A24A]' : 'bg-[#1C2D4A]'
                              }`}
                            />
                          )}

                          <div
                            className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition-all relative z-10 ${
                              step.isCurrent
                                ? 'bg-[#C9A24A] border-2 border-[#F5F1E8] shadow-[0_0_12px_rgba(201,162,74,0.5)]'
                                : step.isCompleted
                                ? 'bg-[#C9A24A] border border-[#C9A24A]'
                                : 'bg-[#07111F] border border-[#1C2D4A]'
                            }`}
                          >
                            {getStepIcon(stepInfo.iconName, step.isCompleted, step.isCurrent)}
                          </div>

                          <div className="flex-1 pb-4 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs sm:text-sm font-bold ${
                                  step.isCurrent
                                    ? 'text-[#E2C56B]'
                                    : step.isCompleted
                                    ? 'text-[#F5F1E8]'
                                    : 'text-[#7E8B9B]'
                                }`}
                              >
                                {step.label}
                              </span>
                              {step.isCurrent && (
                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/40">
                                  Current
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-[#AAB4C2]">{step.description}</p>

                            {step.timestamp && (
                              <p className="text-[10px] font-mono text-[#E2C56B]/90 pt-0.5">
                                ✓ Completed: {formatEventTimestamp(step.timestamp)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Two-Column Responsive Layout: Items vs Delivery & Bill */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Ordered Items (Span 2) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-5 sm:p-6 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-3">
                    <h3 className="font-serif text-base font-bold text-[#F5F1E8] flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-[#C9A24A]" />
                      <span>Items Ordered &amp; Layered on Royal Dum</span>
                    </h3>
                    <span className="text-xs text-[#AAB4C2]">
                      {activeOrder.items?.length || 0} {(activeOrder.items?.length || 0) === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-[#1C2D4A]">
                    {activeOrder.items?.map((item, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-[#F5F1E8] leading-tight">
                            {item.quantity}x {item.name}
                          </p>
                          <p className="text-xs text-[#AAB4C2]">
                            Portion: <span className="text-[#E2C56B] font-medium">{item.size || 'Standard'}</span> · {formatINR(item.price)} each
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm text-[#F5F1E8]">
                            {formatINR(item.total || item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Extras */}
                    {activeOrder.extras?.map((extra, idx) => (
                      <div key={`extra-${idx}`} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="text-[#AAB4C2] font-medium">
                            + {extra.quantity}x {extra.name}
                          </p>
                          <span className="text-[10px] text-[#7E8B9B]">Royal Accompaniment</span>
                        </div>
                        <span className="font-semibold text-[#AAB4C2]">
                          {formatINR(extra.price * (extra.quantity || 1))}
                        </span>
                      </div>
                    ))}

                    {/* Complimentary Treats */}
                    {activeOrder.complimentary_items?.map((comp, idx) => (
                      <div key={`comp-${idx}`} className="py-3 flex items-center justify-between gap-3 text-xs bg-[#101F35]/40 px-3 rounded-xl my-1 border border-[#C9A24A]/20">
                        <div>
                          <p className="font-semibold text-[#E2C56B] flex items-center gap-1.5">
                            <span>🎁 {comp.name}</span>
                          </p>
                          <span className="text-[10px] text-[#AAB4C2]">
                            Quantity: {comp.quantityText} · Complimentary with Dum Order
                          </span>
                        </div>
                        <span className="font-bold text-xs text-[#E2C56B]">FREE</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Notes if present */}
                  {activeOrder.customer_notes && (
                    <div className="p-3.5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-1">
                      <span className="text-[10px] font-bold text-[#E2C56B] uppercase tracking-wider block">
                        Special Instructions:
                      </span>
                      <p className="text-xs text-[#F5F1E8] italic">{activeOrder.customer_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Bill Breakdown & Delivery Details */}
              <div className="space-y-6">
                {/* Bill Breakdown */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-3.5">
                  <h3 className="font-serif text-base font-bold text-[#F5F1E8] border-b border-[#1C2D4A] pb-3">
                    Bill Summary
                  </h3>

                  <div className="space-y-2 text-xs text-[#AAB4C2]">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span className="text-[#F5F1E8] font-semibold">{formatINR(activeOrder.subtotal)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Delivery Valet Fee:</span>
                      <span className="text-[#F5F1E8] font-semibold">
                        {activeOrder.delivery_charge === 0 ? 'FREE' : formatINR(activeOrder.delivery_charge)}
                      </span>
                    </div>

                    {activeOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Royal Discount:</span>
                        <span>- {formatINR(activeOrder.discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-[#1C2D4A] text-sm">
                      <span className="font-serif font-bold text-[#F5F1E8]">Total Payable:</span>
                      <span className="font-bold text-base text-[#E2C56B]">{formatINR(activeOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-3.5">
                  <h3 className="font-serif text-base font-bold text-[#F5F1E8] border-b border-[#1C2D4A] pb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C9A24A]" />
                    <span>Delivery Address</span>
                  </h3>

                  <div className="space-y-2.5 text-xs text-[#AAB4C2]">
                    <div>
                      <p className="font-bold text-sm text-[#F5F1E8]">{activeOrder.customer_name}</p>
                      <p className="flex items-center gap-1.5 text-[#E2C56B] font-mono mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-[#7E8B9B]" />
                        <span>{activeOrder.phone}</span>
                      </p>
                      {activeOrder.email && (
                        <p className="flex items-center gap-1.5 text-[#AAB4C2] mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-[#7E8B9B]" />
                          <span>{activeOrder.email}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#1C2D4A]">
                      <p className="text-[#F5F1E8] leading-relaxed">{activeOrder.full_address}</p>
                      <p className="text-[#7E8B9B] mt-0.5">
                        {activeOrder.city || 'Ghaziabad'}, {activeOrder.state || 'Uttar Pradesh'} {activeOrder.pincode ? `– ${activeOrder.pincode}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#E2C56B] transition cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={handlePrintSlip}
                  className="px-4 py-2.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#AAB4C2] hover:text-[#F5F1E8] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/orders"
                  className="px-4 py-2.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] hover:text-[#E2C56B] transition flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-[#C9A24A]" />
                  <span>View Order History</span>
                </Link>

                <Link
                  href="/#menu"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-extrabold transition shadow-xs flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order More</span>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
