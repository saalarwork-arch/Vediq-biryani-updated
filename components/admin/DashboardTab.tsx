'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  ChefHat,
  Truck,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  Eye,
  Plus,
  BarChart3,
  Calendar,
  Sparkles,
  PieChart,
  Activity,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { CustomerOrder, MenuItem } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { AdminTab } from './AdminSidebar';

interface DashboardTabProps {
  orders: CustomerOrder[];
  menuItems: MenuItem[];
  categoriesCount: number;
  onNavigateTab: (tab: AdminTab) => void;
  onViewOrder: (order: CustomerOrder) => void;
  onAddNewProduct: () => void;
}

// Custom Tooltip for Recharts Bar Chart
const CustomAnalyticsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A1628] border border-[#1C2D4A] p-3.5 rounded-xl shadow-xl text-[#F5F1E8] text-xs space-y-2">
        <p className="font-bold text-[#E2C56B] text-sm border-b border-[#1C2D4A] pb-1">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs text-[#AAB4C2]">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-[#F5F1E8]">{entry.value} orders</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardTab({
  orders,
  menuItems,
  categoriesCount,
  onNavigateTab,
  onViewOrder,
  onAddNewProduct,
}: DashboardTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'analytics'>('overview');

  // Compute key lifetime order stats
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.order_status === 'pending').length;
  const confirmedOrders = orders.filter((o) => o.order_status === 'confirmed').length;
  const preparingOrders = orders.filter((o) => o.order_status === 'preparing').length;
  const outForDeliveryOrders = orders.filter((o) => o.order_status === 'out_for_delivery').length;
  const deliveredOrders = orders.filter((o) => o.order_status === 'delivered').length;
  const cancelledOrders = orders.filter((o) => o.order_status === 'cancelled').length;

  const totalRevenue = orders
    .filter((o) => o.order_status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const activeProducts = menuItems.filter((m) => m.is_active !== false).length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // --------------------------------------------------------------------------
  // CURRENT WEEK ANALYTICS COMPUTATION
  // --------------------------------------------------------------------------
  const currentWeekData = useMemo(() => {
    const now = new Date();
    // Calculate current week Monday to Sunday
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Initialize 7 days data structure
    const dailyMap = daysLabels.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      return {
        dayKey: d.toISOString().split('T')[0],
        day: dayName,
        dateLabel: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        pending: 0,
        prepared: 0,
        delivered: 0,
        total: 0,
      };
    });

    let weekTotalOrders = 0;
    let weekPending = 0;
    let weekPrepared = 0;
    let weekDelivered = 0;
    let weekRevenue = 0;

    orders.forEach((order) => {
      if (!order.created_at) return;
      const orderDate = new Date(order.created_at);

      if (orderDate >= monday && orderDate <= sunday) {
        weekTotalOrders++;
        const status = (order.order_status || '').toLowerCase();
        const orderDateKey = orderDate.toISOString().split('T')[0];

        const targetDay = dailyMap.find((d) => d.dayKey === orderDateKey);

        if (status === 'pending') {
          weekPending++;
          if (targetDay) targetDay.pending++;
        } else if (
          status === 'preparing' ||
          status === 'ready_for_delivery' ||
          status === 'prepared' ||
          status === 'confirmed'
        ) {
          weekPrepared++;
          if (targetDay) targetDay.prepared++;
        } else if (status === 'delivered') {
          weekDelivered++;
          if (targetDay) targetDay.delivered++;
        }

        if (status !== 'cancelled') {
          weekRevenue += Number(order.total) || 0;
        }

        if (targetDay) {
          targetDay.total++;
        }
      }
    });

    // Summary frequency data for overall status chart
    const summaryFrequencyData = [
      {
        status: 'Pending',
        count: weekPending,
        fill: '#D97706',
        description: 'Orders awaiting kitchen confirmation',
      },
      {
        status: 'Prepared / In-Kitchen',
        count: weekPrepared,
        fill: '#2563EB',
        description: 'Confirmed, preparing on dum, or ready',
      },
      {
        status: 'Delivered',
        count: weekDelivered,
        fill: '#059669',
        description: 'Successfully delivered to customer',
      },
    ];

    const weekFulfillmentRate =
      weekTotalOrders > 0 ? Math.round((weekDelivered / weekTotalOrders) * 100) : 0;

    return {
      mondayLabel: monday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      sundayLabel: sunday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      dailyMap,
      summaryFrequencyData,
      weekTotalOrders,
      weekPending,
      weekPrepared,
      weekDelivered,
      weekRevenue,
      weekFulfillmentRate,
    };
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>New Pending</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
            <span>Confirmed</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <ChefHat className="w-3 h-3 text-amber-600" />
            <span>Dum Preparing</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-500" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">
            Restaurant Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Real-time operations, revenue metrics, orders queue, and active catalog overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-Tabs Nav: Overview vs Analytics */}
          <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#DDD8CE]">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-white text-[#1A1814] shadow-xs border border-[#DDD8CE]'
                  : 'text-[#6B665E] hover:text-[#1A1814]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#9E7422]" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'analytics'
                  ? 'bg-gradient-to-r from-[#C59A3F] to-[#9E7422] text-white shadow-xs'
                  : 'text-[#6B665E] hover:text-[#1A1814]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          <button
            onClick={onAddNewProduct}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] hover:to-[#8C6418] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW SUB-TAB                                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Revenue & Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B665E] uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-xl sm:text-2xl font-black text-[#1A1814] mt-0.5">{formatINR(totalRevenue)}</h3>
                <p className="text-[10px] text-[#059669] font-medium flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> Excludes cancelled
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5E8] text-[#9E7422] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B665E] uppercase tracking-wider">Total Orders</p>
                <h3 className="text-xl sm:text-2xl font-black text-[#1A1814] mt-0.5">{totalOrders}</h3>
                <p className="text-[10px] text-[#6B665E] font-medium mt-0.5">Lifetime orders placed</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B665E] uppercase tracking-wider">New Pending</p>
                <h3 className="text-xl sm:text-2xl font-black text-[#D97706] mt-0.5">{newOrders}</h3>
                <p className="text-[10px] text-[#D97706] font-medium mt-0.5">Requires confirmation</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B665E] uppercase tracking-wider">Active Products</p>
                <h3 className="text-xl sm:text-2xl font-black text-[#1A1814] mt-0.5">{activeProducts}</h3>
                <p className="text-[10px] text-[#6B665E] font-medium mt-0.5">In {categoriesCount} categories</p>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown Pipeline */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1A1814]">Live Order Pipeline</h3>
                <p className="text-xs text-[#6B665E]">Current distribution of orders by kitchen fulfillment stage</p>
              </div>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-bold text-[#9E7422] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div
                onClick={() => onNavigateTab('orders')}
                className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] hover:bg-[#FEF3C7] transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800">New Pending</span>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-xl font-black text-amber-900 mt-1">{newOrders}</p>
              </div>

              <div
                onClick={() => onNavigateTab('orders')}
                className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE] transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-800">Confirmed</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-xl font-black text-blue-900 mt-1">{confirmedOrders}</p>
              </div>

              <div
                onClick={() => onNavigateTab('orders')}
                className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] hover:bg-[#FFEDD5] transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-orange-800">Dum Preparing</span>
                  <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <p className="text-xl font-black text-orange-900 mt-1">{preparingOrders}</p>
              </div>

              <div
                onClick={() => onNavigateTab('orders')}
                className="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] hover:bg-[#F3E8FF] transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-800">Out for Delivery</span>
                  <Truck className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <p className="text-xl font-black text-purple-900 mt-1">{outForDeliveryOrders}</p>
              </div>

              <div
                onClick={() => onNavigateTab('orders')}
                className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] hover:bg-[#D1FAE5] transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800">Delivered</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xl font-black text-emerald-900 mt-1">{deliveredOrders}</p>
              </div>

              <div
                onClick={() => onNavigateTab('orders')}
                className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] hover:bg-[#FFE4E6] transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-800">Cancelled</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <p className="text-xl font-black text-rose-900 mt-1">{cancelledOrders}</p>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1A1814]">Recent Customer Orders</h3>
                <p className="text-xs text-[#6B665E]">Latest incoming orders from the public website</p>
              </div>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-bold text-[#9E7422] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>All Orders ({orders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-10 bg-[#FAF8F5] rounded-xl border border-dashed border-[#DDD8CE]">
                <ShoppingBag className="w-8 h-8 text-[#9E7422] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-[#1A1814]">No customer orders recorded yet</p>
                <p className="text-[11px] text-[#6B665E] mt-0.5">Orders placed on the website will instantly appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAE6DF] text-[#6B665E] uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Order #</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Items</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EFE8]">
                    {recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FAF8F5] transition">
                        <td className="py-3 px-3 font-mono font-bold text-[#1A1814]">{ord.order_number}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#1A1814]">{ord.customer_name}</p>
                          <p className="text-[11px] text-[#6B665E]">{ord.phone}</p>
                        </td>
                        <td className="py-3 px-3 text-[#5A564F]">
                          <span className="font-semibold text-[#1A1814]">{ord.items?.length || 0} items</span>
                          <span className="text-[11px] block text-[#8C877E] truncate max-w-[160px]">
                            {ord.items?.map((i) => `${i.name} (${i.size})`).join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#1A1814]">{formatINR(ord.total)}</td>
                        <td className="py-3 px-3">{getStatusBadge(ord.order_status)}</td>
                        <td className="py-3 px-3 text-[#6B665E]">
                          {new Date(ord.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onViewOrder(ord)}
                            className="p-1.5 rounded-lg bg-[#FAF5E8] hover:bg-[#F2EFE8] text-[#9E7422] font-bold text-xs transition cursor-pointer"
                            title="View Full Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ANALYTICS SUB-TAB (Visualizing Orders by Status with Recharts)          */}
      {/* ========================================================================= */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Current Week Header Badge */}
          <div className="p-5 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] text-[#F5F1E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B]">
                <Calendar className="w-5 h-5 text-[#C9A24A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-[#F5F1E8]">
                    Current Week Performance Analytics
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#101F35] text-[#E2C56B] border border-[#C9A24A]/40 font-bold uppercase">
                    Live Data
                  </span>
                </div>
                <p className="text-xs text-[#AAB4C2] mt-0.5">
                  Week of <strong className="text-[#E2C56B]">{currentWeekData.mondayLabel}</strong> &mdash;{' '}
                  <strong className="text-[#E2C56B]">{currentWeekData.sundayLabel}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#7E8B9B] block">Weekly Fulfillment</span>
                <span className="font-bold text-emerald-400 text-base">{currentWeekData.weekFulfillmentRate}%</span>
              </div>
              <div className="w-px h-8 bg-[#1C2D4A]" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#7E8B9B] block">Weekly Revenue</span>
                <span className="font-bold text-[#E2C56B] text-base">{formatINR(currentWeekData.weekRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Weekly Status Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[#6B665E] block">Total Orders (This Week)</span>
              <p className="text-2xl font-black text-[#1A1814] mt-1">{currentWeekData.weekTotalOrders}</p>
              <p className="text-[10px] text-[#6B665E] mt-0.5">Active weekly volume</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Pending Frequency</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{currentWeekData.weekPending}</p>
              <p className="text-[10px] text-amber-700 mt-0.5">Awaiting preparation</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">Prepared Frequency</span>
              <p className="text-2xl font-black text-blue-900 mt-1">{currentWeekData.weekPrepared}</p>
              <p className="text-[10px] text-blue-700 mt-0.5">In kitchen / Dum steaming</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Delivered Frequency</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{currentWeekData.weekDelivered}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Fulfilled & completed</p>
            </div>
          </div>

          {/* MAIN BAR CHART: Daily Frequency of Orders by Status for Current Week */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE6DF] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1A1814] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#9E7422]" />
                  <span>Order Frequency by Status (Current Week)</span>
                </h3>
                <p className="text-xs text-[#6B665E] mt-0.5">
                  Daily breakdown of Pending, Prepared (In-Kitchen), and Delivered orders from Monday to Sunday.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-amber-700">
                  <span className="w-3 h-3 rounded-xs bg-[#D97706] inline-block" />
                  Pending
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                  <span className="w-3 h-3 rounded-xs bg-[#2563EB] inline-block" />
                  Prepared
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="w-3 h-3 rounded-xs bg-[#059669] inline-block" />
                  Delivered
                </span>
              </div>
            </div>

            {/* Recharts Responsive Bar Chart */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currentWeekData.dailyMap}
                  margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2EFE8" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#6B665E"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#EAE6DF' }}
                  />
                  <YAxis
                    stroke="#6B665E"
                    fontSize={12}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={{ stroke: '#EAE6DF' }}
                  />
                  <Tooltip content={<CustomAnalyticsTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill="#D97706"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="prepared"
                    name="Prepared (In-Kitchen)"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="delivered"
                    name="Delivered"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECONDARY BREAKDOWN: Status Distribution Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Status Distribution Chart */}
            <div className="p-6 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#1A1814] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#9E7422]" />
                  <span>Status Volume Comparison (This Week)</span>
                </h4>
                <p className="text-xs text-[#6B665E] mt-0.5">
                  Aggregate frequency totals across all 3 key status stages.
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={currentWeekData.summaryFrequencyData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F2EFE8" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="#6B665E" fontSize={11} />
                    <YAxis
                      dataKey="status"
                      type="category"
                      stroke="#1A1814"
                      fontSize={11}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} orders`, 'Frequency']}
                      contentStyle={{
                        backgroundColor: '#0A1628',
                        borderColor: '#1C2D4A',
                        borderRadius: '12px',
                        color: '#F5F1E8',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                      {currentWeekData.summaryFrequencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Kitchen Operations Summary Insights */}
            <div className="p-6 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] shadow-xs space-y-4 text-[#F5F1E8]">
              <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-3">
                <h4 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E2C56B]" />
                  <span>Kitchen Operations Summary</span>
                </h4>
                <span className="text-[10px] text-[#E2C56B] bg-[#101F35] px-2.5 py-0.5 rounded-full border border-[#C9A24A]/30">
                  Weekly Insights
                </span>
              </div>

              <div className="space-y-3 text-xs text-[#AAB4C2]">
                <div className="p-3 rounded-xl bg-[#07111F] border border-[#1C2D4A] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#F5F1E8] block">Pending Fulfillment Queue</span>
                    <span className="text-[11px] text-[#7E8B9B]">Orders requiring immediate kitchen action</span>
                  </div>
                  <span className="text-base font-bold text-amber-400 font-mono">{currentWeekData.weekPending}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#07111F] border border-[#1C2D4A] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#F5F1E8] block">In-Kitchen Cooking & Dum Steaming</span>
                    <span className="text-[11px] text-[#7E8B9B]">Active royal hand-pounded spice pots</span>
                  </div>
                  <span className="text-base font-bold text-blue-400 font-mono">{currentWeekData.weekPrepared}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#07111F] border border-[#1C2D4A] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#F5F1E8] block">Completed & Delivered Feasts</span>
                    <span className="text-[11px] text-[#7E8B9B]">Dispatched in fresh banana leaf packaging</span>
                  </div>
                  <span className="text-base font-bold text-emerald-400 font-mono">{currentWeekData.weekDelivered}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
