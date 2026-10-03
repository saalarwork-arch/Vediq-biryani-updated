'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  ArrowLeft,
  ShoppingBag,
  Compass,
  Copy,
  Check,
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  Truck,
  XCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CustomerOrder, OrderStatus } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { buildOrderTimeline, getStatusLabel } from '@/lib/tracking';
import { useOrderNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import VediqLogo from '@/components/VediqLogo';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isSupported, permission, requestPermission, trackOrderCode, triggerOrderStatusAlert } = useOrderNotifications();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [activeUserEmail, setActiveUserEmail] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch orders for customer
  const loadOrders = useCallback(async (searchQuery?: string) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      let targetEmail = activeUserEmail;
      let targetPhone = '';

      if (searchQuery) {
        const clean = searchQuery.trim();
        if (clean.includes('@')) {
          targetEmail = clean.toLowerCase();
        } else {
          targetPhone = clean.replace(/\D/g, '');
        }
      }

      // Check Supabase Auth if no query provided
      if (!targetEmail && !targetPhone && isSupabaseConfigured()) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            targetEmail = user.email || '';
            setActiveUserEmail(user.email || '');
          }
        } catch {
          // ignore
        }
      }

      // 1. Fetch from backend API
      let remoteOrders: CustomerOrder[] = [];
      if (targetEmail || targetPhone) {
        try {
          const params = new URLSearchParams();
          if (targetEmail) params.append('email', targetEmail);
          if (targetPhone) params.append('phone', targetPhone);

          const res = await fetch(`/api/orders/user?${params.toString()}`);
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.orders)) {
            remoteOrders = data.orders;
          }
        } catch (e) {
          console.warn('[OrderHistory] Remote orders query error:', e);
        }
      }

      // 2. Combine with local guest orders from localStorage
      let localOrders: CustomerOrder[] = [];
      try {
        const stored = JSON.parse(localStorage.getItem('vediq_user_orders') || '[]');
        if (Array.isArray(stored)) {
          localOrders = stored;
        }
      } catch {
        // ignore
      }

      // Merge and deduplicate by order_number
      const orderMap = new Map<string, CustomerOrder>();
      remoteOrders.forEach((o) => {
        if (o.order_number) orderMap.set(o.order_number, o);
      });
      localOrders.forEach((o) => {
        if (o.order_number && !orderMap.has(o.order_number)) {
          orderMap.set(o.order_number, o);
        }
      });

      // Sort newest first
      const merged = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      merged.forEach((o) => {
        if (o.order_number) trackOrderCode(o.order_number);
      });

      setOrders(merged);
    } catch (err: any) {
      console.error('[OrderHistory] Exception:', err);
      setErrorMsg(err.message || 'Failed to load order history.');
    } finally {
      setIsLoading(false);
    }
  }, [activeUserEmail, trackOrderCode]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      loadOrders();
      return;
    }
    loadOrders(lookupQuery.trim());
  };

  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const formatOrderDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/40">
            <ChefHat className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span>Dum Cooking</span>
          </span>
        );
      case 'ready_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Package className="w-3.5 h-3.5" />
            <span>Packed in Banana Leaf</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <Truck className="w-3.5 h-3.5" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed</span>
          </span>
        );
      case 'cancelled':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>{status === 'cancelled' ? 'Cancelled' : 'Failed'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/30">
            <Clock className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span>Order Placed</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F5F1E8] flex flex-col selection:bg-[#C9A24A] selection:text-[#07111F] w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A1628]/95 backdrop-blur-md border-b border-[#1C2D4A] px-4 sm:px-6 lg:px-8 py-3.5 w-full max-w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-[#F5F1E8] hover:text-[#E2C56B] hover:border-[#C9A24A]/40 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>

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
              href="/track"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] hover:text-[#E2C56B] hover:border-[#C9A24A]/40 transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#C9A24A]" />
              <span className="hidden sm:inline">Track by Code</span>
              <span className="sm:hidden">Track</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 overflow-x-hidden">
        {/* Page Title */}
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#101F35] border border-[#C9A24A]/30 text-[#E2C56B] text-[11px] font-bold uppercase tracking-wider">
            <History className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span>Order History & Past Feasts</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#F5F1E8] tracking-tight">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-[#AAB4C2] max-w-md mx-auto">
            Inspect your genuine previous royal dum biryani orders, live statuses, and receipts.
          </p>

          {/* Quick Lookup by Phone / Email for Guests */}
          <form
            onSubmit={handleLookupSubmit}
            className="max-w-md mx-auto flex gap-2 pt-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Find orders by phone or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A1628] border border-[#1C2D4A] text-xs font-semibold text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] hover:border-[#C9A24A]/40 text-xs font-bold text-[#E2C56B] transition cursor-pointer"
            >
              Lookup
            </button>
          </form>

          {errorMsg && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Web Notifications Quick Status Banner */}
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 text-[#E2C56B] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-[#C9A24A]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#F5F1E8] block">Live Status Notifications</span>
                <span className="text-[#AAB4C2] text-[11px]">Real-time browser push alerts when orders go Out for Delivery or Delivered.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {permission === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Push Active</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => requestPermission()}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                >
                  Enable Push Alerts
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Orders List / Empty State */}
        {isLoading ? (
          <div className="text-center py-16 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C9A24A] mx-auto" />
            <p className="text-xs font-bold text-[#AAB4C2] uppercase tracking-wider">
              Retrieving your orders from database...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#101F35] border border-[#1C2D4A] text-[#7E8B9B] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold text-[#F5F1E8]">No orders yet.</h2>
              <p className="text-xs text-[#AAB4C2] max-w-sm mx-auto leading-relaxed">
                You have not placed any orders yet. Explore our royal dum biryanis and handcrafted accompaniments.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/#menu"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-extrabold transition shadow-md cursor-pointer"
              >
                <span>Explore Full Menu</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#7E8B9B] px-1">
              <span>Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'} (newest first)</span>
              <button
                onClick={() => loadOrders()}
                className="hover:text-[#E2C56B] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {orders.map((order) => {
              const trackingCode = order.tracking_code || order.order_number;
              const isExpanded = expandedOrderId === order.order_number;
              const timeline = buildOrderTimeline(order);

              return (
                <div
                  key={order.order_number}
                  className="rounded-3xl bg-[#0A1628] border border-[#1C2D4A] hover:border-[#C9A24A]/40 transition shadow-lg overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C2D4A] pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base sm:text-lg font-bold text-[#E2C56B]">
                            {trackingCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(trackingCode)}
                            className="p-1 rounded-md text-[#7E8B9B] hover:text-[#E2C56B] hover:bg-[#101F35] transition cursor-pointer"
                            title="Copy tracking code"
                          >
                            {copiedCode === trackingCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-[#7E8B9B] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatOrderDate(order.created_at)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.order_status)}
                        <span className="font-mono text-base font-extrabold text-[#F5F1E8]">
                          {formatINR(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="space-y-1.5 text-xs text-[#AAB4C2]">
                      <div className="font-medium text-[#F5F1E8]">
                        {order.items?.map((it, idx) => (
                          <span key={idx}>
                            {idx > 0 && ' · '}
                            {it.quantity}x {it.name} ({it.size || 'Standard'})
                          </span>
                        ))}
                      </div>

                      {order.extras && order.extras.length > 0 && (
                        <p className="text-[#7E8B9B]">
                          + {order.extras.map((e) => `${e.quantity}x ${e.name}`).join(', ')}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-[#7E8B9B] pt-1">
                        <MapPin className="w-3 h-3 text-[#C9A24A] shrink-0" />
                        <span className="truncate">{order.full_address}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.order_number)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#AAB4C2] hover:text-[#F5F1E8] transition cursor-pointer py-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 text-[#C9A24A]" />
                            <span>Hide Details</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 text-[#C9A24A]" />
                            <span>View Order Details</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/track?code=${encodeURIComponent(trackingCode)}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Track Live Status</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order Details Panel */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-[#07111F] border-t border-[#1C2D4A] space-y-5 animate-in slide-in-from-top-2 duration-200">
                      {/* Timeline Preview */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7E8B9B]">
                          Timeline History
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                          {timeline.steps.map((st) => (
                            <div
                              key={st.key}
                              className={`p-2 rounded-xl border ${
                                st.isCurrent
                                  ? 'bg-[#101F35] border-[#C9A24A] text-[#E2C56B]'
                                  : st.isCompleted
                                  ? 'bg-[#0A1628] border-[#1C2D4A] text-[#F5F1E8]'
                                  : 'bg-[#07111F] border-[#1C2D4A]/50 text-[#7E8B9B]'
                              }`}
                            >
                              <span className="font-bold text-[11px] block">{st.label}</span>
                              {st.timestamp ? (
                                <span className="text-[9px] font-mono text-[#AAB4C2] block mt-0.5">
                                  {formatOrderDate(st.timestamp)}
                                </span>
                              ) : (
                                <span className="text-[9px] text-[#4E5B6E] block mt-0.5">—</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Itemized List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7E8B9B]">
                          Itemized Bill
                        </span>
                        <div className="divide-y divide-[#1C2D4A] border border-[#1C2D4A] rounded-2xl overflow-hidden bg-[#0A1628]">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="p-3 flex justify-between text-xs text-[#F5F1E8]">
                              <span>
                                {it.quantity}x {it.name} ({it.size || 'Standard'})
                              </span>
                              <span className="font-semibold">{formatINR(it.total || it.price * it.quantity)}</span>
                            </div>
                          ))}

                          {order.extras?.map((ex, idx) => (
                            <div key={`ex-${idx}`} className="p-3 flex justify-between text-xs text-[#AAB4C2]">
                              <span>+ {ex.quantity}x {ex.name}</span>
                              <span>{formatINR(ex.price * (ex.quantity || 1))}</span>
                            </div>
                          ))}

                          {order.complimentary_items?.map((comp, idx) => (
                            <div key={`comp-${idx}`} className="p-3 flex justify-between text-xs text-[#E2C56B]">
                              <span>🎁 {comp.name} ({comp.quantityText})</span>
                              <span className="font-bold">FREE</span>
                            </div>
                          ))}

                          <div className="p-3 bg-[#101F35] flex justify-between text-xs font-bold text-[#F5F1E8]">
                            <span>Grand Total:</span>
                            <span className="text-[#E2C56B] text-sm">{formatINR(order.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Contact Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#AAB4C2]">
                        <div className="p-3 rounded-xl bg-[#0A1628] border border-[#1C2D4A]">
                          <span className="text-[10px] uppercase font-bold text-[#7E8B9B] block">Delivery To</span>
                          <p className="font-bold text-[#F5F1E8] mt-0.5">{order.customer_name}</p>
                          <p className="text-[#AAB4C2] mt-0.5">{order.full_address}</p>
                          <p className="text-[#7E8B9B] mt-0.5">Phone: {order.phone}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0A1628] border border-[#1C2D4A]">
                          <span className="text-[10px] uppercase font-bold text-[#7E8B9B] block">Payment & Slot</span>
                          <p className="font-bold text-[#F5F1E8] mt-0.5">Method: {order.payment_method}</p>
                          <p className="text-[#AAB4C2] mt-0.5">Status: {order.payment_status || 'Pending'}</p>
                          <p className="text-[#7E8B9B] mt-0.5">Slot: {order.delivery_time || 'Standard'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
