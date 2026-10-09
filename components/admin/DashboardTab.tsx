'use client';

import React, { useMemo } from 'react';
import {
  ShoppingBag,
  Clock,
  ChefHat,
  Truck,
  CheckCircle2,
  XCircle,
  Package,
  TrendingUp,
  DollarSign,
  UtensilsCrossed,
  ArrowRight,
  Eye,
  Plus,
  BarChart3,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CustomerOrder, MenuItem } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import {
  ORDER_CATEGORIES,
  getOrderCategory,
  AdminOrderCategory,
} from '@/lib/adminOrderUtils';
import { AdminTab } from './AdminSidebar';
import DailySalesTicker from './DailySalesTicker';

interface DashboardTabProps {
  orders: CustomerOrder[];
  menuItems: MenuItem[];
  categoriesCount: number;
  onNavigateTab: (tab: AdminTab) => void;
  onViewOrder: (order: CustomerOrder) => void;
  onAddNewProduct: () => void;
  onSelectCategoryFilter?: (category: AdminOrderCategory) => void;
}

export default function DashboardTab({
  orders,
  menuItems,
  categoriesCount,
  onNavigateTab,
  onViewOrder,
  onAddNewProduct,
  onSelectCategoryFilter,
}: DashboardTabProps) {
  // Compute Key Lifetime & Category Metrics
  const stats = useMemo(() => {
    const totalOrders = orders.length;

    let newOrders = 0;
    let confirmedOrders = 0;
    let preparingOrders = 0;
    let readyOrders = 0;
    let outForDeliveryOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    let deliveredRevenue = 0;
    let totalGrossRevenue = 0;

    // Today's boundaries
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let todayOrdersCount = 0;
    let todayDeliveredOrdersCount = 0;
    let todayRevenue = 0; // Strictly excludes cancelled orders!

    orders.forEach((o) => {
      const cat = getOrderCategory(o);
      const amount = Number(o.total) || 0;
      const isCancelled = cat === 'cancelled';

      if (cat === 'new') newOrders++;
      else if (cat === 'confirmed') confirmedOrders++;
      else if (cat === 'preparing') preparingOrders++;
      else if (cat === 'ready') readyOrders++;
      else if (cat === 'out_for_delivery') outForDeliveryOrders++;
      else if (cat === 'delivered') deliveredOrders++;
      else if (cat === 'cancelled') cancelledOrders++;

      if (!isCancelled) {
        totalGrossRevenue += amount;
        if (cat === 'delivered') {
          deliveredRevenue += amount;
        }
      }

      // Check if placed today
      if (o.created_at) {
        const ordDateStr = new Date(o.created_at).toISOString().split('T')[0];
        if (ordDateStr === todayStr) {
          todayOrdersCount++;
          if (!isCancelled) {
            todayRevenue += amount;
          }
          if (cat === 'delivered') {
            todayDeliveredOrdersCount++;
          }
        }
      }
    });

    const activeProducts = menuItems.filter((m) => m.is_active !== false).length;

    return {
      totalOrders,
      newOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      deliveredRevenue,
      totalGrossRevenue,
      todayOrdersCount,
      todayDeliveredOrdersCount,
      todayRevenue,
      activeProducts,
    };
  }, [orders, menuItems]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [orders]);

  const handleOpenCategory = (cat: AdminOrderCategory) => {
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(cat);
    }
    onNavigateTab('orders');
  };

  return (
    <div className="space-y-6 text-[#F5F1E8]">
      {/* 1. WELCOME HERO & TODAY SUMMARY */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0A1628] via-[#101F35] to-[#0A1628] border border-[#1C2D4A] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E2C56B]">
              Royal Dum Kitchen Live
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#F5F1E8] tracking-wide">
            Vediq Biryani Control Centre
          </h1>
          <p className="text-xs text-[#AAB4C2] leading-relaxed">
            Real-time management for slow-dum basmati pots, doorstep delivery dispatches, and Cash on Delivery collections.
          </p>
        </div>

        {/* Today's KPI Callout Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#07111F]/80 border border-[#C9A24A]/30 flex items-center gap-5 sm:gap-6 shrink-0 shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-[#AAB4C2] uppercase tracking-wider block">
              Today&apos;s Orders
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-2xl font-black text-[#E2C56B]">
                {stats.todayOrdersCount}
              </span>
              <span className="text-[10px] text-[#AAB4C2]">orders</span>
            </div>
          </div>

          <div className="w-px h-10 bg-[#1C2D4A]" />

          <div>
            <span className="text-[10px] font-bold text-[#AAB4C2] uppercase tracking-wider block">
              Today&apos;s Revenue
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-2xl font-black text-emerald-400">
                {formatINR(stats.todayRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAILY SALES TICKER (TODAY'S ORDERS & GROWTH COMPARISON TO YESTERDAY) */}
      <DailySalesTicker
        orders={orders}
        onViewTodayOrders={() => onNavigateTab('orders')}
      />

      {/* 3. ORDER STATUS OVERVIEW CARDS (ALL 7 REQUIRED CATEGORIES + TOTAL) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#AAB4C2]">
            Order Status Lifecycle Overview
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#E2C56B] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: New / Received Orders */}
          <div
            onClick={() => handleOpenCategory('new')}
            className="p-4 rounded-2xl bg-[#0A1628] hover:bg-[#101F35] border border-amber-500/30 hover:border-amber-400 transition cursor-pointer shadow-md group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                New / Received
              </span>
              <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-2xl sm:text-3xl font-black text-amber-300">
                {stats.newOrders}
              </span>
              {stats.newOrders > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-black animate-pulse">
                  Action Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#AAB4C2] mt-1">Awaiting kitchen acceptance</p>
          </div>

          {/* Card 2: Confirmed Orders */}
          <div
            onClick={() => handleOpenCategory('confirmed')}
            className="p-4 rounded-2xl bg-[#0A1628] hover:bg-[#101F35] border border-blue-500/30 hover:border-blue-400 transition cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300">
                Confirmed
              </span>
              <CheckCircle2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-black text-blue-300">
              {stats.confirmedOrders}
            </span>
            <p className="text-[11px] text-[#AAB4C2] mt-1">Accepted &amp; queued</p>
          </div>

          {/* Card 3: Orders Being Prepared */}
          <div
            onClick={() => handleOpenCategory('preparing')}
            className="p-4 rounded-2xl bg-[#0A1628] hover:bg-[#101F35] border border-purple-500/30 hover:border-purple-400 transition cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                Being Prepared
              </span>
              <ChefHat className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-black text-purple-300">
              {stats.preparingOrders}
            </span>
            <p className="text-[11px] text-[#AAB4C2] mt-1">Slow dum simmering</p>
          </div>

          {/* Card 4: Ready Orders */}
          <div
            onClick={() => handleOpenCategory('ready')}
            className="p-4 rounded-2xl bg-[#0A1628] hover:bg-[#101F35] border border-teal-500/30 hover:border-teal-400 transition cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300">
                Ready for Dispatch
              </span>
              <Package className="w-4 h-4 text-teal-400 group-hover:scale-110 transition" />
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-black text-teal-300">
              {stats.readyOrders}
            </span>
            <p className="text-[11px] text-[#AAB4C2] mt-1">Sealed in banana leaf</p>
          </div>

          {/* Card 5: Out for Delivery Orders */}
          <div
            onClick={() => handleOpenCategory('out_for_delivery')}
            className="p-4 rounded-2xl bg-[#0A1628] hover:bg-[#101F35] border border-orange-500/30 hover:border-orange-400 transition cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-300">
                Out for Delivery
              </span>
              <Truck className="w-4 h-4 text-orange-400 group-hover:scale-110 transition" />
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-black text-orange-300">
              {stats.outForDeliveryOrders}
            </span>
            <p className="text-[11px] text-[#AAB4C2] mt-1">With valet in transit</p>
          </div>

          {/* Card 6: Delivered Orders */}
          <div
            onClick={() => handleOpenCategory('delivered')}
            className="p-4 rounded-2xl bg-[#0A1628] hover:bg-[#101F35] border border-emerald-500/30 hover:border-emerald-400 transition cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                Delivered
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-300">
              {stats.deliveredOrders}
            </span>
            <p className="text-[11px] text-[#AAB4C2] mt-1">Fulfilled successfully</p>
          </div>

          {/* Card 7: Cancelled Orders */}
          <div
            onClick={() => handleOpenCategory('cancelled')}
            className="p-4 rounded-2xl bg-[#0A1628] hover:bg-[#101F35] border border-rose-500/30 hover:border-rose-400 transition cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
                Cancelled
              </span>
              <XCircle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-black text-rose-300">
              {stats.cancelledOrders}
            </span>
            <p className="text-[11px] text-[#AAB4C2] mt-1">Rejected or cancelled</p>
          </div>

          {/* Card 8: Total Orders & Delivered Revenue */}
          <div
            onClick={() => onNavigateTab('reports')}
            className="p-4 rounded-2xl bg-gradient-to-br from-[#101F35] to-[#0A1628] border border-[#C9A24A]/40 hover:border-[#E2C56B] transition cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E2C56B]">
                Total Orders (All Time)
              </span>
              <DollarSign className="w-4 h-4 text-[#C9A24A] group-hover:scale-110 transition" />
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-black text-[#F5F1E8]">
              {stats.totalOrders}
            </span>
            <p className="text-[11px] text-emerald-400 mt-1 font-semibold truncate">
              Rev: {formatINR(stats.deliveredRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS & RECENT ORDERS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders Table (Span 2) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-3">
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#F5F1E8] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C9A24A]" />
                <span>Recent Live Orders</span>
              </h2>
              <p className="text-[11px] text-[#AAB4C2]">Newest customer orders placed online</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#E2C56B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#7E8B9B]">
              No orders have been placed yet.
            </div>
          ) : (
            <div className="divide-y divide-[#1C2D4A]">
              {recentOrders.map((order) => {
                const cat = getOrderCategory(order);
                const catConfig = ORDER_CATEGORIES.find((c) => c.key === cat) || ORDER_CATEGORIES[0];

                return (
                  <div
                    key={order.id}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#101F35]/40 px-2 rounded-xl transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[#E2C56B]">
                          #{order.order_number || order.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.badgeBg} ${catConfig.badgeText} ${catConfig.badgeBorder}`}
                        >
                          {catConfig.shortLabel}
                        </span>
                        <span className="text-[#AAB4C2] font-semibold">· {order.customer_name}</span>
                      </div>
                      <p className="text-[11px] text-[#7E8B9B] line-clamp-1">
                        {(order.items || []).map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-[#F5F1E8]">
                          {formatINR(order.total)}
                        </span>
                        <span className="text-[10px] text-[#7E8B9B] block">
                          COD: {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#E2C56B] transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick Shortcuts & Menu Summary */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <div className="p-5 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-3">
            <h3 className="font-serif text-base font-bold text-[#F5F1E8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C9A24A]" />
              <span>Admin Shortcuts</span>
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="w-full p-3 rounded-2xl bg-[#07111F] hover:bg-[#101F35] border border-[#1C2D4A] flex items-center justify-between text-xs font-bold text-[#F5F1E8] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-[#C9A24A]" />
                  <span>Manage Active Orders</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#7E8B9B]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="w-full p-3 rounded-2xl bg-[#07111F] hover:bg-[#101F35] border border-[#1C2D4A] flex items-center justify-between text-xs font-bold text-[#F5F1E8] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-[#C9A24A]" />
                  <span>View Revenue &amp; Export CSV</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#7E8B9B]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddNewProduct();
                  onNavigateTab('products');
                }}
                className="w-full p-3 rounded-2xl bg-[#07111F] hover:bg-[#101F35] border border-[#1C2D4A] flex items-center justify-between text-xs font-bold text-[#F5F1E8] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-[#C9A24A]" />
                  <span>Add New Dish to Menu</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#7E8B9B]" />
              </button>
            </div>
          </div>

          {/* Menu Catalog Snapshot */}
          <div className="p-5 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-3">
            <h3 className="font-serif text-base font-bold text-[#F5F1E8] flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[#C9A24A]" />
              <span>Menu Status</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#07111F] rounded-xl border border-[#1C2D4A]">
                <span className="text-[#7E8B9B] text-[10px] uppercase font-bold block">Active Dishes</span>
                <span className="font-mono text-lg font-black text-[#E2C56B]">{stats.activeProducts}</span>
              </div>

              <div className="p-3 bg-[#07111F] rounded-xl border border-[#1C2D4A]">
                <span className="text-[#7E8B9B] text-[10px] uppercase font-bold block">Categories</span>
                <span className="font-mono text-lg font-black text-[#F5F1E8]">{categoriesCount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="w-full py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#E2C56B] transition cursor-pointer text-center block"
            >
              Open Products &amp; Portions Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
