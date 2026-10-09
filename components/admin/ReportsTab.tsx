'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  FileText,
  Search,
  Check,
  Eye,
  PieChart as PieChartIcon,
  Layers,
  Sparkles,
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
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { CustomerOrder, OrderStatus, MenuItem, CategoryItem } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import {
  ORDER_CATEGORIES,
  getOrderCategory,
  generateOrdersCSV,
  downloadCSVFile,
} from '@/lib/adminOrderUtils';
import { useData } from '@/context/DataContext';

interface ReportsTabProps {
  orders: CustomerOrder[];
  onViewOrder: (order: CustomerOrder) => void;
  menuItems?: MenuItem[];
  categories?: CategoryItem[];
}

// Royal palette colors matching VEDIQ brand aesthetic
const CATEGORY_COLORS = [
  '#C9A24A', // Antique Gold
  '#38BDF8', // Sky Blue
  '#34D399', // Emerald Green
  '#F59E0B', // Warm Amber
  '#A78BFA', // Royal Purple
  '#F472B6', // Rose Pink
  '#FB923C', // Tangerine
  '#2DD4BF', // Teal
];

// Helper to determine the canonical category of an item
function resolveItemCategory(
  item: { name: string; product_id?: string },
  menuItems: MenuItem[],
  categories: CategoryItem[]
): string {
  const lowerName = (item.name || '').toLowerCase();

  // 1. Try matching by product_id in menuItems
  if (item.product_id) {
    const matched = menuItems.find((m) => m.id === item.product_id);
    if (matched) {
      if (matched.is_jain && (matched.category === 'biryani' || lowerName.includes('biryani'))) {
        return 'Jain Satvik Biryani';
      }
      const catObj = categories.find((c) => c.id === matched.category);
      if (catObj?.label) return catObj.label;
      if (matched.category === 'order-separately') return 'Sides & Add-ons';
      if (matched.category) {
        return matched.category.charAt(0).toUpperCase() + matched.category.slice(1);
      }
    }
  }

  // 2. Try matching by name in menuItems
  const matchedByName = menuItems.find(
    (m) =>
      m.name.toLowerCase() === lowerName ||
      lowerName.includes(m.name.toLowerCase()) ||
      m.name.toLowerCase().includes(lowerName)
  );

  if (matchedByName) {
    if (matchedByName.is_jain && (matchedByName.category === 'biryani' || lowerName.includes('biryani'))) {
      return 'Jain Satvik Biryani';
    }
    const catObj = categories.find((c) => c.id === matchedByName.category);
    if (catObj?.label) return catObj.label;
    if (matchedByName.category === 'order-separately') return 'Sides & Add-ons';
  }

  // 3. Keyword heuristic
  if (lowerName.includes('jain') && lowerName.includes('biryani')) {
    return 'Jain Satvik Biryani';
  }
  if (lowerName.includes('biryani')) {
    return 'Royal Dum Biryani';
  }
  if (lowerName.includes('raita') || lowerName.includes('patta') || lowerName.includes('leaf') || lowerName.includes('pair')) {
    return 'Sides & Accompaniments';
  }
  if (
    lowerName.includes('shahi') ||
    lowerName.includes('tukda') ||
    lowerName.includes('dessert') ||
    lowerName.includes('sweet') ||
    lowerName.includes('kheer') ||
    lowerName.includes('halwa')
  ) {
    return 'Royal Desserts';
  }
  if (lowerName.includes('chaap') || lowerName.includes('paneer') || lowerName.includes('tikka') || lowerName.includes('kebab')) {
    return 'Starters & Appetizers';
  }
  if (lowerName.includes('drink') || lowerName.includes('beverage') || lowerName.includes('coke') || lowerName.includes('water')) {
    return 'Beverages';
  }

  return 'Special Delicacies';
}

export default function ReportsTab({
  orders,
  onViewOrder,
  menuItems: propMenuItems,
  categories: propCategories,
}: ReportsTabProps) {
  const dataCtx = useData();
  const ctxMenuItems = dataCtx?.menuItems;
  const ctxCategories = dataCtx?.categories;
  const menuItems = useMemo(
    () => propMenuItems || ctxMenuItems || [],
    [propMenuItems, ctxMenuItems]
  );
  const categories = useMemo(
    () => propCategories || ctxCategories || [],
    [propCategories, ctxCategories]
  );

  // Mounted check to avoid SSR/hydration mismatch with Recharts
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Date Range Filter
  const [rangePreset, setRangePreset] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Category Chart Controls
  const [chartScope, setChartScope] = useState<'all_valid' | 'delivered_only'>('all_valid');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Status Filter in Table
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected orders for CSV batch export
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Date Range Boundaries
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (rangePreset === 'today') {
      return { start: todayStart, end: todayEnd, label: "Today's Orders" };
    }

    if (rangePreset === 'yesterday') {
      const yStart = new Date(todayStart);
      yStart.setDate(todayStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(todayEnd.getDate() - 1);
      return { start: yStart, end: yEnd, label: "Yesterday's Orders" };
    }

    if (rangePreset === '7days') {
      const start = new Date(todayStart);
      start.setDate(todayStart.getDate() - 6);
      return { start, end: todayEnd, label: 'Last 7 Days' };
    }

    if (rangePreset === '30days') {
      const start = new Date(todayStart);
      start.setDate(todayStart.getDate() - 29);
      return { start, end: todayEnd, label: 'Last 30 Days' };
    }

    if (rangePreset === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: `${customStartDate} to ${customEndDate}` };
    }

    return { start: new Date(2020, 0, 1), end: new Date(2099, 11, 31), label: 'All Time' };
  }, [rangePreset, customStartDate, customEndDate]);

  // Orders Filtered by Selected Date Range
  const rangeOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.created_at) return true;
      const orderDate = new Date(o.created_at);
      return orderDate >= dateRangeBounds.start && orderDate <= dateRangeBounds.end;
    });
  }, [orders, dateRangeBounds]);

  // Accurate Financial & KPI Metrics
  const metrics = useMemo(() => {
    let totalOrders = rangeOrders.length;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let activeInProgressOrders = 0;

    let deliveredRevenue = 0; // Revenue from successfully delivered orders
    let totalGrossVolume = 0; // All non-cancelled orders total volume

    let codPaidAmount = 0; // Total COD marked as paid
    let codPendingAmount = 0; // Total COD pending doorstep collection

    rangeOrders.forEach((o) => {
      const status = (o.order_status || 'pending').toLowerCase();
      const amount = Number(o.total) || 0;
      const pStatus = (o.payment_status || 'pending').toLowerCase();

      if (status === 'cancelled' || status === 'failed') {
        cancelledOrders++;
        return; // NEVER count cancelled orders as revenue!
      }

      totalGrossVolume += amount;

      if (status === 'delivered') {
        deliveredOrders++;
        deliveredRevenue += amount;
      } else {
        activeInProgressOrders++;
      }

      if (pStatus === 'paid') {
        codPaidAmount += amount;
      } else {
        codPendingAmount += amount;
      }
    });

    const averageOrderValue =
      deliveredOrders > 0
        ? Math.round(deliveredRevenue / deliveredOrders)
        : totalOrders > 0
        ? Math.round(totalGrossVolume / (totalOrders - cancelledOrders || 1))
        : 0;

    const completionRate =
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    return {
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      activeInProgressOrders,
      deliveredRevenue,
      totalGrossVolume,
      codPaidAmount,
      codPendingAmount,
      averageOrderValue,
      completionRate,
    };
  }, [rangeOrders]);

  // Category-level revenue decomposition & business insights
  const categoryRevenueData = useMemo(() => {
    // Filter by selected chart scope
    const targetOrders = rangeOrders.filter((o) => {
      const status = (o.order_status || 'pending').toLowerCase();
      if (status === 'cancelled' || status === 'failed') return false; // Strictly never include cancelled in revenue!
      if (chartScope === 'delivered_only' && status !== 'delivered') return false;
      return true;
    });

    const categoryMap: Record<
      string,
      { revenue: number; quantity: number; orderCount: number }
    > = {};

    targetOrders.forEach((order) => {
      const categoriesInThisOrder = new Set<string>();

      // 1. Process regular items
      (order.items || []).forEach((item) => {
        const cat = resolveItemCategory(item, menuItems, categories);
        categoriesInThisOrder.add(cat);

        const qty = item.quantity || 1;
        const total =
          typeof item.total === 'number' && item.total > 0
            ? item.total
            : (Number(item.price) || 0) * qty;

        if (!categoryMap[cat]) {
          categoryMap[cat] = { revenue: 0, quantity: 0, orderCount: 0 };
        }
        categoryMap[cat].revenue += total;
        categoryMap[cat].quantity += qty;
      });

      // 2. Process paid add-on extras
      (order.extras || []).forEach((extra) => {
        const extraNameLower = (extra.name || '').toLowerCase();
        let cat = 'Sides & Add-ons';
        if (
          extraNameLower.includes('tukda') ||
          extraNameLower.includes('sweet') ||
          extraNameLower.includes('dessert')
        ) {
          cat = 'Royal Desserts';
        } else if (
          extraNameLower.includes('raita') ||
          extraNameLower.includes('patta') ||
          extraNameLower.includes('leaf')
        ) {
          cat = 'Sides & Accompaniments';
        }
        categoriesInThisOrder.add(cat);

        const qty = extra.quantity || 1;
        const total =
          typeof extra.total === 'number' && extra.total > 0
            ? extra.total
            : (Number(extra.price) || 0) * qty;

        if (!categoryMap[cat]) {
          categoryMap[cat] = { revenue: 0, quantity: 0, orderCount: 0 };
        }
        categoryMap[cat].revenue += total;
        categoryMap[cat].quantity += qty;
      });

      // Register order appearance
      categoriesInThisOrder.forEach((cat) => {
        if (categoryMap[cat]) {
          categoryMap[cat].orderCount += 1;
        }
      });
    });

    const totalCatRevenue = Object.values(categoryMap).reduce((sum, c) => sum + c.revenue, 0);
    const totalItemsSold = Object.values(categoryMap).reduce((sum, c) => sum + c.quantity, 0);

    const sortedItems = Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        quantity: data.quantity,
        orderCount: data.orderCount,
        percentage: totalCatRevenue > 0 ? (data.revenue / totalCatRevenue) * 100 : 0,
        avgPricePerItem: data.quantity > 0 ? Math.round(data.revenue / data.quantity) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Re-assign distinct colors in sorted order for consistent aesthetics
    const rankedItems = sortedItems.map((item, idx) => ({
      ...item,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

    const topCategory = rankedItems[0] || null;
    const topVolumeCategory =
      [...rankedItems].sort((a, b) => b.quantity - a.quantity)[0] || null;

    return {
      items: rankedItems,
      totalRevenue: totalCatRevenue,
      totalItemsSold,
      topCategory,
      topVolumeCategory,
      contributingCategoriesCount: rankedItems.length,
      avgItemRevenue: totalItemsSold > 0 ? Math.round(totalCatRevenue / totalItemsSold) : 0,
    };
  }, [rangeOrders, chartScope, menuItems, categories]);

  // Table Filtered Orders
  const tableOrders = useMemo(() => {
    return rangeOrders.filter((order) => {
      if (statusFilter !== 'all') {
        const cat = getOrderCategory(order);
        if (cat !== statusFilter && order.order_status !== statusFilter) return false;
      }

      if (paymentFilter !== 'all') {
        const pStatus = (order.payment_status || 'pending').toLowerCase();
        if (pStatus !== paymentFilter) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (order.order_number || order.id || '').toLowerCase().includes(q);
        const matchName = (order.customer_name || '').toLowerCase().includes(q);
        const matchPhone = (order.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        if (!matchId && !matchName && !matchPhone) return false;
      }

      return true;
    });
  }, [rangeOrders, statusFilter, paymentFilter, searchQuery]);

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.size === tableOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(tableOrders.map((o) => o.id)));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Export handlers
  const handleExportRange = () => {
    const csvContent = generateOrdersCSV(tableOrders);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csvContent, `Vediq_Report_${rangePreset}_${dateStr}.csv`);
  };

  const handleExportSelected = () => {
    const selectedList = tableOrders.filter((o) => selectedOrderIds.has(o.id));
    if (selectedList.length === 0) return;
    const csvContent = generateOrdersCSV(selectedList);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csvContent, `Vediq_Selected_${selectedList.length}_Orders_${dateStr}.csv`);
  };

  return (
    <div className="space-y-6 text-[#F5F1E8]">
      {/* 1. HEADER & DATE RANGE FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1C2D4A]">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F1E8] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#C9A24A]" />
            <span>Reports, Revenue &amp; Order Export</span>
          </h1>
          <p className="text-xs text-[#AAB4C2] mt-0.5">
            Accurate sales summaries, COD collections tracking, and full order ledger export.
          </p>
        </div>

        {/* Date Range Selector Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['today', 'yesterday', '7days', '30days', 'all'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRangePreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                rangePreset === preset
                  ? 'bg-gradient-to-r from-[#C9A24A] to-[#B89033] text-[#07111F] font-black'
                  : 'bg-[#101F35] text-[#AAB4C2] hover:text-[#F5F1E8] border border-[#1C2D4A]'
              }`}
            >
              {preset === 'today'
                ? 'Today'
                : preset === 'yesterday'
                ? 'Yesterday'
                : preset === '7days'
                ? '7 Days'
                : preset === '30days'
                ? '30 Days'
                : 'All Time'}
            </button>
          ))}

          <button
            type="button"
            onClick={handleExportRange}
            disabled={tableOrders.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#C9A24A]/40 text-[#E2C56B] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Delivered Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0A1628] border border-emerald-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span className="font-extrabold uppercase tracking-wider text-[10px]">Delivered Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-mono text-xl sm:text-2xl font-black text-emerald-300">
            {formatINR(metrics.deliveredRevenue)}
          </p>
          <p className="text-[11px] text-[#AAB4C2]">
            From {metrics.deliveredOrders} delivered orders
          </p>
        </div>

        {/* Total Orders Placed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-[#AAB4C2]">
            <span className="font-extrabold uppercase tracking-wider text-[10px]">Total Orders Placed</span>
            <ShoppingBag className="w-4 h-4 text-[#C9A24A]" />
          </div>
          <p className="font-mono text-xl sm:text-2xl font-black text-[#F5F1E8]">
            {metrics.totalOrders}
          </p>
          <p className="text-[11px] text-[#E2C56B]">
            {metrics.activeInProgressOrders} active in kitchen / transit
          </p>
        </div>

        {/* COD Collection Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0A1628] border border-amber-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span className="font-extrabold uppercase tracking-wider text-[10px]">COD Collections</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg sm:text-xl font-black text-amber-300">
              {formatINR(metrics.codPaidAmount)}
            </span>
            <span className="text-[10px] text-[#AAB4C2]">paid</span>
          </div>
          <p className="text-[11px] text-[#AAB4C2]">
            Pending collection: <strong className="text-amber-400">{formatINR(metrics.codPendingAmount)}</strong>
          </p>
        </div>

        {/* Cancelled Orders & AOV */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0A1628] border border-rose-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-400">
            <span className="font-extrabold uppercase tracking-wider text-[10px]">Cancelled Orders</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="font-mono text-xl sm:text-2xl font-black text-rose-300">
            {metrics.cancelledOrders}
          </p>
          <p className="text-[11px] text-[#AAB4C2]">
            Avg Order Value: <strong className="text-[#E2C56B]">{formatINR(metrics.averageOrderValue)}</strong>
          </p>
        </div>
      </div>

      {/* 3. RECHARTS VISUALIZATION: TOTAL REVENUE PER CATEGORY */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] shadow-xl space-y-5">
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1C2D4A]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#101F35] border border-[#C9A24A]/40 text-[#E2C56B]">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F5F1E8]">
                Total Revenue per Category
              </h2>
            </div>
            <p className="text-xs text-[#AAB4C2] mt-1">
              Sales decomposition, customer demand, and item revenue distribution across menu categories.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Scope Filter: All Non-Cancelled vs Delivered Only */}
            <div className="flex items-center bg-[#07111F] p-1 rounded-xl border border-[#1C2D4A] text-xs">
              <button
                type="button"
                onClick={() => setChartScope('all_valid')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  chartScope === 'all_valid'
                    ? 'bg-[#1C2D4A] text-[#F5F1E8] shadow-xs'
                    : 'text-[#7E8B9B] hover:text-[#F5F1E8]'
                }`}
              >
                All Orders
              </button>
              <button
                type="button"
                onClick={() => setChartScope('delivered_only')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  chartScope === 'delivered_only'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shadow-xs'
                    : 'text-[#7E8B9B] hover:text-[#F5F1E8]'
                }`}
              >
                Delivered Only
              </button>
            </div>

            {/* Chart Type Toggle: Bar vs Donut */}
            <div className="flex items-center bg-[#07111F] p-1 rounded-xl border border-[#1C2D4A] text-xs">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-gradient-to-r from-[#C9A24A] to-[#B89033] text-[#07111F] font-black'
                    : 'text-[#7E8B9B] hover:text-[#F5F1E8]'
                }`}
                title="Bar Chart View"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bar Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer ${
                  chartType === 'pie'
                    ? 'bg-gradient-to-r from-[#C9A24A] to-[#B89033] text-[#07111F] font-black'
                    : 'text-[#7E8B9B] hover:text-[#F5F1E8]'
                }`}
                title="Donut Distribution View"
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Donut</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Mini Insight KPI Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Top Grossing Category */}
          <div className="p-3.5 rounded-xl bg-[#07111F] border border-[#C9A24A]/30">
            <div className="flex items-center justify-between text-[10px] text-[#AAB4C2] uppercase font-bold tracking-wider">
              <span>Top Category</span>
              <Award className="w-3.5 h-3.5 text-[#C9A24A]" />
            </div>
            <p className="mt-1 font-bold text-sm text-[#E2C56B] truncate">
              {categoryRevenueData.topCategory?.name || 'No sales yet'}
            </p>
            <p className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
              {categoryRevenueData.topCategory
                ? `${formatINR(categoryRevenueData.topCategory.revenue)} (${categoryRevenueData.topCategory.percentage.toFixed(0)}%)`
                : '—'}
            </p>
          </div>

          {/* Total Units Sold */}
          <div className="p-3.5 rounded-xl bg-[#07111F] border border-[#1C2D4A]">
            <div className="flex items-center justify-between text-[10px] text-[#AAB4C2] uppercase font-bold tracking-wider">
              <span>Units Ordered</span>
              <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="mt-1 font-mono font-bold text-lg text-[#F5F1E8]">
              {categoryRevenueData.totalItemsSold} items
            </p>
            <p className="text-[11px] text-[#AAB4C2]">across all categories</p>
          </div>

          {/* Highest Volume Category */}
          <div className="p-3.5 rounded-xl bg-[#07111F] border border-[#1C2D4A]">
            <div className="flex items-center justify-between text-[10px] text-[#AAB4C2] uppercase font-bold tracking-wider">
              <span>Volume Leader</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="mt-1 font-bold text-sm text-[#F5F1E8] truncate">
              {categoryRevenueData.topVolumeCategory?.name || '—'}
            </p>
            <p className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">
              {categoryRevenueData.topVolumeCategory
                ? `${categoryRevenueData.topVolumeCategory.quantity} units sold`
                : '—'}
            </p>
          </div>

          {/* Category Diversity & Avg Revenue */}
          <div className="p-3.5 rounded-xl bg-[#07111F] border border-[#1C2D4A]">
            <div className="flex items-center justify-between text-[10px] text-[#AAB4C2] uppercase font-bold tracking-wider">
              <span>Avg Item Value</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="mt-1 font-mono font-bold text-lg text-purple-300">
              {formatINR(categoryRevenueData.avgItemRevenue)}
            </p>
            <p className="text-[11px] text-[#AAB4C2]">
              {categoryRevenueData.contributingCategoriesCount} active menu categories
            </p>
          </div>
        </div>

        {/* Chart Body & Detailed Breakdown Grid */}
        {!isMounted ? (
          <div className="h-[320px] rounded-xl bg-[#07111F] animate-pulse flex items-center justify-center border border-[#1C2D4A] text-xs text-[#7E8B9B]">
            Loading business visualization...
          </div>
        ) : categoryRevenueData.items.length === 0 ? (
          <div className="h-[280px] rounded-xl bg-[#07111F] border border-[#1C2D4A] flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Layers className="w-10 h-10 text-[#7E8B9B] opacity-50" />
            <p className="font-bold text-sm text-[#F5F1E8]">No Category Revenue in this Period</p>
            <p className="text-xs text-[#AAB4C2] max-w-sm">
              No non-cancelled orders match the current date filter ({dateRangeBounds.label}). Select a wider date range or place a test order to visualize revenue distribution.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Recharts Canvas */}
            <div className="lg:col-span-7 w-full h-[320px]">
              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'bar' ? (
                  <BarChart
                    data={categoryRevenueData.items}
                    margin={{ top: 15, right: 15, left: 5, bottom: 20 }}
                  >
                    <CartesianGrid stroke="#1C2D4A" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#7E8B9B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1C2D4A' }}
                      interval={0}
                      tick={({ x, y, payload }) => (
                        <text
                          x={x}
                          y={Number(y) + 12}
                          textAnchor="middle"
                          fill="#AAB4C2"
                          fontSize={11}
                          fontWeight={600}
                        >
                          {payload && payload.value && String(payload.value).length > 14
                            ? `${String(payload.value).slice(0, 12)}...`
                            : payload?.value ?? ''}
                        </text>
                      )}
                    />
                    <YAxis
                      stroke="#7E8B9B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1C2D4A' }}
                      tickFormatter={(val) =>
                        val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                      }
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(201, 162, 74, 0.08)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#07111F]/95 backdrop-blur-md border border-[#C9A24A]/50 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
                              <div className="flex items-center justify-between gap-3 border-b border-[#1C2D4A] pb-1.5">
                                <span className="font-bold text-[#F5F1E8]">{d.name}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#C9A24A]/20 text-[#E2C56B]">
                                  {d.percentage.toFixed(1)}% Share
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between gap-4 pt-0.5">
                                <span className="text-[#AAB4C2]">Total Revenue:</span>
                                <span className="font-mono font-black text-emerald-300 text-sm">
                                  {formatINR(d.revenue)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-[11px] text-[#AAB4C2]">
                                <span>Units Ordered:</span>
                                <span className="font-mono font-bold text-[#F5F1E8]">{d.quantity} units</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-[11px] text-[#AAB4C2]">
                                <span>Avg Dish Price:</span>
                                <span className="font-mono text-[#E2C56B]">{formatINR(d.avgPricePerItem)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={52}
                      animationDuration={800}
                    >
                      {categoryRevenueData.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#07111F]/95 backdrop-blur-md border border-[#C9A24A]/50 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[170px]">
                              <div className="flex items-center justify-between gap-3 border-b border-[#1C2D4A] pb-1.5">
                                <span className="font-bold text-[#F5F1E8]">{d.name}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#C9A24A]/20 text-[#E2C56B]">
                                  {d.percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between gap-4 pt-0.5">
                                <span className="text-[#AAB4C2]">Revenue:</span>
                                <span className="font-mono font-black text-emerald-300 text-sm">
                                  {formatINR(d.revenue)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-[11px] text-[#AAB4C2]">
                                <span>Units:</span>
                                <span className="font-mono font-bold text-[#F5F1E8]">{d.quantity} units</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={categoryRevenueData.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={108}
                      paddingAngle={4}
                      dataKey="revenue"
                      nameKey="name"
                      animationDuration={800}
                    >
                      {categoryRevenueData.items.map((entry, index) => (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={entry.color}
                          stroke="#0A1628"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Right: Category Performance Ranked Breakdown */}
            <div className="lg:col-span-5 bg-[#07111F] rounded-xl p-4 border border-[#1C2D4A] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C2D4A]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F1E8]">
                  Category Breakdown
                </h3>
                <span className="text-[11px] font-mono text-[#AAB4C2]">
                  Total: <strong className="text-emerald-400">{formatINR(categoryRevenueData.totalRevenue)}</strong>
                </span>
              </div>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {categoryRevenueData.items.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[180px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-[#F5F1E8] truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-[#F5F1E8]">{formatINR(cat.revenue)}</span>
                        <span className="text-[10px] text-[#AAB4C2] w-10 text-right">
                          {cat.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#101F35] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(cat.percentage, 2)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#7E8B9B]">
                      <span>{cat.quantity} items sold</span>
                      <span>Avg {formatINR(cat.avgPricePerItem)}/item</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. FILTERABLE ORDER TABLE WITH BATCH EXPORT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] space-y-4 shadow-xl">
        {/* Table Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, name, phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New / Received</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none"
            >
              <option value="all">All COD Statuses</option>
              <option value="pending">Pending Payment</option>
              <option value="paid">Paid / Collected</option>
            </select>

            {/* Selected Batch Export Button */}
            {selectedOrderIds.size > 0 && (
              <button
                type="button"
                onClick={handleExportSelected}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] text-[#07111F] font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Selected ({selectedOrderIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-xl border border-[#1C2D4A]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07111F] text-[#7E8B9B] uppercase text-[10px] font-bold border-b border-[#1C2D4A]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={tableOrders.length > 0 && selectedOrderIds.size === tableOrders.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-[#1C2D4A] text-[#C9A24A] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Date &amp; Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items Summary</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D4A] bg-[#0A1628]">
              {tableOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-[#7E8B9B]">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                tableOrders.map((order) => {
                  const isSelected = selectedOrderIds.has(order.id);
                  const cat = getOrderCategory(order);
                  const catConfig = ORDER_CATEGORIES.find((c) => c.key === cat) || ORDER_CATEGORIES[0];

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-[#101F35]/70 transition ${
                        isSelected ? 'bg-[#101F35]/50' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(order.id)}
                          className="rounded border-[#1C2D4A] text-[#C9A24A] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-[#E2C56B]">
                        #{order.order_number || order.id}
                      </td>

                      <td className="p-3 text-[#AAB4C2]">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-[#F5F1E8]">{order.customer_name}</p>
                        <p className="text-[11px] text-[#AAB4C2] font-mono">{order.phone}</p>
                      </td>

                      <td className="p-3 max-w-[200px]">
                        <p className="truncate text-[#AAB4C2]">
                          {(order.items || [])
                            .map((it) => `${it.quantity}x ${it.name}`)
                            .join(', ')}
                        </p>
                        <span className="text-[10px] text-[#7E8B9B]">
                          {(order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0)} items
                        </span>
                      </td>

                      <td className="p-3 font-mono font-bold text-[#F5F1E8]">
                        {formatINR(order.total)}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.badgeBg} ${catConfig.badgeText} ${catConfig.badgeBorder}`}
                        >
                          {catConfig.shortLabel}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onViewOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-[#E2C56B] text-[11px] font-bold transition cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
