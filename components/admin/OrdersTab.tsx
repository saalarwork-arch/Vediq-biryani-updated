'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  XCircle,
  Phone,
  MapPin,
  FileText,
  Printer,
  ChevronDown,
  X,
  CreditCard,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Bell,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Sparkles,
  Package,
} from 'lucide-react';
import { CustomerOrder, OrderStatus } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import {
  ORDER_CATEGORIES,
  OrderCategoryConfig,
  AdminOrderCategory,
  getOrderCategory,
  getValidTransitions,
  generateOrdersCSV,
  downloadCSVFile,
} from '@/lib/adminOrderUtils';
import OrderDetailModal from './OrderDetailModal';
import OrderReceiptModal from './OrderReceiptModal';

interface OrdersTabProps {
  orders: CustomerOrder[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, reason?: string) => Promise<void>;
  onTogglePaymentStatus?: (orderId: string, newPaymentStatus: 'pending' | 'paid') => Promise<void>;
  onRefresh: () => void;
  isLoading: boolean;
  selectedOrder: CustomerOrder | null;
  setSelectedOrder: (order: CustomerOrder | null) => void;
  initialCategory?: AdminOrderCategory | 'all';
}

export default function OrdersTab({
  orders,
  onUpdateStatus,
  onTogglePaymentStatus,
  onRefresh,
  isLoading,
  selectedOrder,
  setSelectedOrder,
  initialCategory = 'new',
}: OrdersTabProps) {
  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState<AdminOrderCategory | 'all'>(initialCategory);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | 'month'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<CustomerOrder | null>(null);

  // Status advance loading state
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);

  // Quick Action Confirmation Dialog
  const [quickConfirm, setQuickConfirm] = useState<{
    order: CustomerOrder;
    nextStatus: OrderStatus;
    label: string;
  } | null>(null);

  // Compute category counts for all 7 required categories
  const categoryCounts = useMemo(() => {
    const counts: Record<AdminOrderCategory | 'all', number> = {
      all: orders.length,
      new: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((ord) => {
      const cat = getOrderCategory(ord);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });

    return counts;
  }, [orders]);

  // Filtered & Sorted Orders (Newest First)
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return orders
      .filter((order) => {
        // 1. Category Tab Filter
        if (activeCategory !== 'all') {
          const cat = getOrderCategory(order);
          if (cat !== activeCategory) return false;
        }

        // 2. Search Filter (by Order ID, Customer Name, Phone, Address)
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const matchId = (order.order_number || order.id || '').toLowerCase().includes(q);
          const matchName = (order.customer_name || '').toLowerCase().includes(q);
          const matchPhone = (order.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
          const matchAddress = (order.full_address || '').toLowerCase().includes(q);
          if (!matchId && !matchName && !matchPhone && !matchAddress) {
            return false;
          }
        }

        // 3. Date Filter
        if (dateFilter !== 'all' && order.created_at) {
          const ordDate = new Date(order.created_at);
          const ordDateStr = ordDate.toISOString().split('T')[0];

          if (dateFilter === 'today' && ordDateStr !== todayStr) return false;
          if (dateFilter === 'yesterday' && ordDateStr !== yesterdayStr) return false;
          if (dateFilter === '7days' && ordDate < sevenDaysAgo) return false;
          if (dateFilter === 'month' && ordDate < thirtyDaysAgo) return false;
        }

        // 4. Payment Status Filter (Pending vs Paid COD)
        if (paymentFilter !== 'all') {
          const pStatus = (order.payment_status || 'pending').toLowerCase();
          if (pStatus !== paymentFilter) return false;
        }

        return true;
      })
      // Newest Orders First
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
  }, [orders, activeCategory, searchQuery, dateFilter, paymentFilter]);

  // Handle Quick Advance of Status
  const handleQuickAdvance = async (order: CustomerOrder, nextStatus: OrderStatus) => {
    setAdvancingOrderId(order.id);
    try {
      await onUpdateStatus(order.id, nextStatus);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, order_status: nextStatus });
      }
      setQuickConfirm(null);
    } finally {
      setAdvancingOrderId(null);
    }
  };

  // Export current filtered orders to CSV
  const handleExportCSV = () => {
    const csvData = generateOrdersCSV(filteredOrders);
    const dateStr = new Date().toISOString().split('T')[0];
    const categoryName = activeCategory === 'all' ? 'All' : activeCategory;
    downloadCSVFile(csvData, `Vediq_Orders_${categoryName}_${dateStr}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & SUMMARY BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1C2D4A]">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F1E8] flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#C9A24A]" />
            <span>Order Management</span>
          </h1>
          <p className="text-xs text-[#AAB4C2] mt-0.5">
            Manage live orders, monitor slow-dum preparation, dispatch delivery valets, and verify COD collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-[#F5F1E8] hover:text-[#E2C56B] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title="Export filtered orders to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. ORDER STATUS CATEGORY TABS (7 REQUIRED CATEGORIES + ALL) */}
      <div className="bg-[#0A1628] p-2 rounded-2xl border border-[#1C2D4A] shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 sm:pb-0">
          {/* All Tab */}
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[#C9A24A] text-[#07111F] shadow-md'
                : 'bg-[#07111F] text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] border border-[#1C2D4A]'
            }`}
          >
            <span>All Orders</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeCategory === 'all' ? 'bg-[#07111F] text-[#E2C56B]' : 'bg-[#101F35] text-[#AAB4C2]'
              }`}
            >
              {categoryCounts.all}
            </span>
          </button>

          {/* 7 Required Categories */}
          {ORDER_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            const count = categoryCounts[cat.key] || 0;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-[#C9A24A] text-[#07111F] shadow-md'
                    : 'bg-[#07111F] text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] border border-[#1C2D4A]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-[#07111F] text-[#E2C56B]'
                      : count > 0 && cat.key === 'new'
                      ? 'bg-amber-500 text-black animate-pulse'
                      : count > 0
                      ? 'bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/30'
                      : 'bg-[#101F35] text-[#7E8B9B]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="bg-[#0A1628] p-4 rounded-2xl border border-[#1C2D4A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID (#VB-...), customer name, phone number, address..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] transition shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E8B9B] hover:text-[#F5F1E8]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-[#07111F] px-3 py-1.5 rounded-xl border border-[#1C2D4A]">
            <Calendar className="w-3.5 h-3.5 text-[#C9A24A]" />
            <select
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="bg-transparent text-[#F5F1E8] focus:outline-none text-xs cursor-pointer"
            >
              <option value="all" className="bg-[#0A1628]">All Dates</option>
              <option value="today" className="bg-[#0A1628]">Today Only</option>
              <option value="yesterday" className="bg-[#0A1628]">Yesterday</option>
              <option value="7days" className="bg-[#0A1628]">Last 7 Days</option>
              <option value="month" className="bg-[#0A1628]">This Month</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#07111F] px-3 py-1.5 rounded-xl border border-[#1C2D4A]">
            <CreditCard className="w-3.5 h-3.5 text-[#C9A24A]" />
            <select
              value={paymentFilter}
              onChange={(e: any) => setPaymentFilter(e.target.value)}
              className="bg-transparent text-[#F5F1E8] focus:outline-none text-xs cursor-pointer"
            >
              <option value="all" className="bg-[#0A1628]">All COD Statuses</option>
              <option value="pending" className="bg-[#0A1628]">Pending Collection</option>
              <option value="paid" className="bg-[#0A1628]">Paid / Collected</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || dateFilter !== 'all' || paymentFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('all');
                setPaymentFilter('all');
              }}
              className="px-2.5 py-1.5 text-xs text-[#E2C56B] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. ORDERS LISTING (NEWEST FIRST) */}
      <div className="space-y-4">
        {/* Results Info Counter */}
        <div className="flex items-center justify-between text-xs text-[#7E8B9B] px-1">
          <span>
            Showing <strong className="text-[#F5F1E8]">{filteredOrders.length}</strong>{' '}
            {filteredOrders.length === 1 ? 'order' : 'orders'} in{' '}
            <strong className="text-[#E2C56B]">
              {activeCategory === 'all'
                ? 'All Categories'
                : ORDER_CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </strong>
          </span>
          <span>Sorted by: Newest Placed First</span>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0A1628] border border-[#1C2D4A] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#101F35] border border-[#C9A24A]/30 flex items-center justify-center mx-auto text-[#E2C56B]">
              <ShoppingBag className="w-7 h-7 text-[#C9A24A]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#F5F1E8]">No Orders Found</h3>
              <p className="text-xs text-[#AAB4C2] max-w-sm mx-auto leading-relaxed">
                {searchQuery || dateFilter !== 'all' || paymentFilter !== 'all'
                  ? 'No orders match your current search and filter criteria. Try clearing filters.'
                  : `There are currently no orders in "${
                      ORDER_CATEGORIES.find((c) => c.key === activeCategory)?.label || 'this category'
                    }". When a customer places an order, it will appear here immediately.`}
              </p>
            </div>
            {(searchQuery || dateFilter !== 'all' || paymentFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('all');
                  setPaymentFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#101F35] text-[#E2C56B] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold transition cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          /* Orders Cards Grid */
          <div className="space-y-3.5">
            {filteredOrders.map((order) => {
              const currentCat = getOrderCategory(order);
              const catConfig = ORDER_CATEGORIES.find((c) => c.key === currentCat) || ORDER_CATEGORIES[0];
              const validTransitions = getValidTransitions(order.order_status);
              const primaryTransition = validTransitions.find((t) => t.nextStatus !== 'cancelled') || validTransitions[0];

              const totalItems = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
              const itemsSummary = (order.items || [])
                .map((it) => `${it.quantity}x ${it.name} (${it.size || 'Standard'})`)
                .join(', ');

              const formattedOrderTime = order.created_at
                ? new Date(order.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'Just now';

              return (
                <div
                  key={order.id || order.order_number}
                  className="rounded-3xl bg-[#0A1628] border border-[#1C2D4A] hover:border-[#C9A24A]/40 transition shadow-lg overflow-hidden group"
                >
                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Top Row: Order ID, Category Badge, Timestamp, Total */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C2D4A] pb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-base sm:text-lg font-black text-[#E2C56B]">
                          #{order.order_number || order.id}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${catConfig.badgeBg} ${catConfig.badgeText} ${catConfig.badgeBorder}`}
                        >
                          {catConfig.label}
                        </span>

                        {/* COD Payment Status Pill */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          COD: {order.payment_status === 'paid' ? 'Paid / Collected' : 'Pending Payment'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                        <span className="text-[#AAB4C2] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#C9A24A]" />
                          <span>{formattedOrderTime}</span>
                        </span>
                        <span className="font-mono text-base font-black text-[#F5F1E8]">
                          {formatINR(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Customer Info & Items Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                      {/* Customer Info (Col 5) */}
                      <div className="md:col-span-5 space-y-1">
                        <p className="font-bold text-sm text-[#F5F1E8]">{order.customer_name}</p>
                        <p className="text-[#E2C56B] font-mono flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#7E8B9B]" />
                          <span>{order.phone}</span>
                        </p>
                        <p className="text-[#AAB4C2] line-clamp-1 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#7E8B9B] shrink-0 mt-0.5" />
                          <span>
                            {order.full_address}, {order.city || 'Ghaziabad'}
                          </span>
                        </p>
                      </div>

                      {/* Items Summary (Col 7) */}
                      <div className="md:col-span-7 space-y-1 bg-[#07111F] p-3 rounded-2xl border border-[#1C2D4A]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#AAB4C2]">
                            Ordered Dishes ({totalItems} items):
                          </span>
                          <span className="text-[#E2C56B] font-semibold">
                            Slot: {order.delivery_time || 'Standard'}
                          </span>
                        </div>
                        <p className="text-[#F5F1E8] line-clamp-2 leading-relaxed">
                          {itemsSummary}
                        </p>
                        {order.customer_notes && (
                          <p className="text-[11px] text-amber-300 italic pt-1 border-t border-[#1C2D4A] line-clamp-1">
                            Note: &ldquo;{order.customer_notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#1C2D4A]">
                      {/* View Details / Print Receipt */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#E2C56B] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C9A24A]" />
                          <span>View Full Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReceiptOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#AAB4C2] hover:text-[#F5F1E8] transition cursor-pointer flex items-center gap-1.5"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#C9A24A]" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>

                        <a
                          href={`tel:${order.phone}`}
                          className="p-1.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-emerald-400 transition cursor-pointer"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Status Transition Action Buttons */}
                      <div className="flex items-center gap-2">
                        {primaryTransition && (
                          <button
                            type="button"
                            disabled={advancingOrderId === order.id}
                            onClick={() => {
                              setQuickConfirm({
                                order,
                                nextStatus: primaryTransition.nextStatus,
                                label: primaryTransition.label,
                              });
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50 ${primaryTransition.buttonClass}`}
                          >
                            <span>{primaryTransition.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {validTransitions.length === 0 && (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Fulfilled</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Status Advance Confirmation Dialog */}
      {quickConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-3xl bg-[#0A1628] border border-[#C9A24A]/40 p-6 space-y-4 shadow-2xl text-[#F5F1E8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B]">
                <ChefHat className="w-5 h-5 text-[#C9A24A]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F5F1E8]">Update Order Status</h3>
                <p className="text-xs text-[#AAB4C2]">Order #{quickConfirm.order.order_number || quickConfirm.order.id}</p>
              </div>
            </div>

            <p className="text-xs text-[#AAB4C2] leading-relaxed">
              Are you sure you want to advance this order to{' '}
              <strong className="text-[#E2C56B] uppercase">{quickConfirm.nextStatus.replace(/_/g, ' ')}</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickConfirm(null)}
                className="px-4 py-2 rounded-xl bg-[#101F35] text-[#AAB4C2] hover:text-[#F5F1E8] text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={advancingOrderId === quickConfirm.order.id}
                onClick={() => handleQuickAdvance(quickConfirm.order, quickConfirm.nextStatus)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition cursor-pointer"
              >
                {advancingOrderId === quickConfirm.order.id ? 'Updating...' : `Yes, ${quickConfirm.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Order Full Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={onUpdateStatus}
          onTogglePaymentStatus={onTogglePaymentStatus}
        />
      )}

      {/* Standalone Receipt Print Modal */}
      {receiptOrder && (
        <OrderReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
    </div>
  );
}
