'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { CustomerOrder } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { getOrderCategory } from '@/lib/adminOrderUtils';

interface DailySalesTickerProps {
  orders: CustomerOrder[];
  onViewTodayOrders?: () => void;
  className?: string;
}

export default function DailySalesTicker({
  orders,
  onViewTodayOrders,
  className = '',
}: DailySalesTickerProps) {
  // Compute Today's and Yesterday's metrics
  const tickerData = useMemo(() => {
    const now = new Date();

    // Get today's local year, month, date
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    // Yesterday's date
    const yesterdayDateObj = new Date(todayYear, todayMonth, todayDate - 1);
    const yesterdayYear = yesterdayDateObj.getFullYear();
    const yesterdayMonth = yesterdayDateObj.getMonth();
    const yesterdayDate = yesterdayDateObj.getDate();

    // Format YYYY-MM-DD for fast string comparisons as well
    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayKey = `${todayYear}-${pad(todayMonth + 1)}-${pad(todayDate)}`;
    const yesterdayKey = `${yesterdayYear}-${pad(yesterdayMonth + 1)}-${pad(yesterdayDate)}`;

    // Order counters
    let todayOrdersCount = 0;
    let yesterdayOrdersCount = 0;

    let todayRevenue = 0; // Excludes cancelled
    let yesterdayRevenue = 0;

    let todayDeliveredCount = 0;
    let todayCancelledCount = 0;
    let todayActivePendingCount = 0;

    orders.forEach((order) => {
      if (!order.created_at) return;

      const orderTime = new Date(order.created_at);
      const oYear = orderTime.getFullYear();
      const oMonth = orderTime.getMonth();
      const oDate = orderTime.getDate();
      const oKey = `${oYear}-${pad(oMonth + 1)}-${pad(oDate)}`;

      const cat = getOrderCategory(order);
      const isCancelled = cat === 'cancelled';
      const orderTotal = Number(order.total) || 0;

      if (oKey === todayKey) {
        todayOrdersCount++;
        if (!isCancelled) {
          todayRevenue += orderTotal;
        } else {
          todayCancelledCount++;
        }

        if (cat === 'delivered') {
          todayDeliveredCount++;
        } else if (!isCancelled) {
          todayActivePendingCount++;
        }
      } else if (oKey === yesterdayKey) {
        yesterdayOrdersCount++;
        if (!isCancelled) {
          yesterdayRevenue += orderTotal;
        }
      }
    });

    // Calculate Growth Percentage compared to yesterday
    // If yesterday had 0 orders:
    //   - if today > 0: +100% (or new influx)
    //   - if today === 0: 0%
    let orderGrowthPercent: number | null = 0;
    let isNewBaseline = false;

    if (yesterdayOrdersCount > 0) {
      orderGrowthPercent = ((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 100;
    } else if (todayOrdersCount > 0) {
      orderGrowthPercent = 100;
      isNewBaseline = true;
    } else {
      orderGrowthPercent = 0;
    }

    // Revenue growth
    let revenueGrowthPercent: number | null = 0;
    if (yesterdayRevenue > 0) {
      revenueGrowthPercent = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    } else if (todayRevenue > 0) {
      revenueGrowthPercent = 100;
    } else {
      revenueGrowthPercent = 0;
    }

    // Friendly date label
    const todayFormatted = now.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    return {
      todayKey,
      yesterdayKey,
      todayFormatted,
      todayOrdersCount,
      yesterdayOrdersCount,
      orderGrowthPercent,
      isNewBaseline,
      todayRevenue,
      yesterdayRevenue,
      revenueGrowthPercent,
      todayDeliveredCount,
      todayCancelledCount,
      todayActivePendingCount,
      ordersDifference: todayOrdersCount - yesterdayOrdersCount,
    };
  }, [orders]);

  const {
    todayFormatted,
    todayOrdersCount,
    yesterdayOrdersCount,
    orderGrowthPercent,
    isNewBaseline,
    todayRevenue,
    yesterdayRevenue,
    revenueGrowthPercent,
    todayDeliveredCount,
    todayActivePendingCount,
    ordersDifference,
  } = tickerData;

  const isGrowthPositive = (orderGrowthPercent ?? 0) > 0;
  const isGrowthNegative = (orderGrowthPercent ?? 0) < 0;
  const isGrowthNeutral = (orderGrowthPercent ?? 0) === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#07111F] via-[#0E1C30] to-[#081324] border border-[#C9A24A]/40 shadow-xl p-4 sm:p-5 ${className}`}
      data-testid="daily-sales-ticker"
    >
      {/* Decorative ambient subtle background glows */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-[#C9A24A]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        {/* Left Segment: Headline & Live Badge */}
        <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1C2D4A] to-[#0A1628] border border-[#C9A24A]/30 flex items-center justify-center text-[#E2C56B] shadow-inner shrink-0">
            <Activity className="w-6 h-6 animate-pulse text-[#E2C56B]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E2C56B]/15 border border-[#E2C56B]/30 text-[10px] font-extrabold uppercase tracking-widest text-[#E2C56B]">
                <Flame className="w-3 h-3 text-[#E2C56B]" />
                Daily Sales Ticker
              </span>
              <span className="text-[11px] font-medium text-[#7E8B9B] hidden sm:inline">
                · {todayFormatted}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-black text-[#F5F1E8] tracking-wide mt-0.5">
              Today&apos;s Order Velocity &amp; Momentum
            </h2>
          </div>
        </div>

        {/* Center/Right Metrics Grid */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          {/* Metric 1: Today's Orders Count & Growth Chip */}
          <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-[#0A1628]/90 border border-[#1C2D4A] flex items-center gap-3.5 shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#AAB4C2] tracking-wider block">
                Orders Today
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-mono text-2xl sm:text-3xl font-black text-[#F5F1E8]">
                  {todayOrdersCount}
                </span>
                <span className="text-[11px] text-[#7E8B9B]">
                  vs {yesterdayOrdersCount} yesterday
                </span>
              </div>
            </div>

            {/* Growth Percentage Pill */}
            <div
              className={`flex flex-col items-end px-2.5 py-1 rounded-xl border text-xs font-bold ${
                isGrowthPositive
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : isGrowthNegative
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-[#1C2D4A]/50 border-[#1C2D4A] text-[#AAB4C2]'
              }`}
              title={`Compared to ${yesterdayOrdersCount} orders yesterday (${ordersDifference >= 0 ? `+${ordersDifference}` : ordersDifference} orders)`}
            >
              <div className="flex items-center gap-0.5">
                {isGrowthPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : isGrowthNegative ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                <span className="font-mono font-black text-sm">
                  {isGrowthPositive ? '+' : ''}
                  {Math.round(orderGrowthPercent ?? 0)}%
                </span>
              </div>
              <span className="text-[9px] font-semibold opacity-80 uppercase tracking-tight">
                {isGrowthPositive
                  ? isNewBaseline && yesterdayOrdersCount === 0
                    ? 'First orders'
                    : 'vs Yesterday'
                  : isGrowthNegative
                  ? 'vs Yesterday'
                  : 'Even'}
              </span>
            </div>
          </div>

          {/* Metric 2: Today's Revenue */}
          <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-[#0A1628]/90 border border-[#1C2D4A] flex items-center gap-3.5 shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#AAB4C2] tracking-wider block">
                Today&apos;s Sales Value
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
                  {formatINR(todayRevenue)}
                </span>
              </div>
            </div>

            <div
              className={`flex flex-col items-end px-2 py-1 rounded-xl text-[11px] font-bold ${
                (revenueGrowthPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
              title={`Yesterday sales: ${formatINR(yesterdayRevenue)}`}
            >
              <span className="font-mono">
                {(revenueGrowthPercent ?? 0) > 0 ? '+' : ''}
                {Math.round(revenueGrowthPercent ?? 0)}%
              </span>
              <span className="text-[9px] text-[#7E8B9B] uppercase font-normal">Revenue</span>
            </div>
          </div>

          {/* Metric 3: Quick Action / Status breakdown */}
          {onViewTodayOrders && (
            <button
              type="button"
              onClick={onViewTodayOrders}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#E2C56B] hover:brightness-110 text-[#07111F] text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
            >
              <span>Inspect Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mini Performance Context Ticker Footer */}
      <div className="mt-3 pt-3 border-t border-[#1C2D4A]/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#AAB4C2]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Delivered today:</span>
            <strong className="text-[#F5F1E8] font-mono">{todayDeliveredCount}</strong>
          </span>
          <span className="text-[#1C2D4A]">|</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>In progress:</span>
            <strong className="text-[#F5F1E8] font-mono">{todayActivePendingCount}</strong>
          </span>
          {tickerData.todayCancelledCount > 0 && (
            <>
              <span className="text-[#1C2D4A]">|</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Cancelled:</span>
                <strong className="text-rose-400 font-mono">{tickerData.todayCancelledCount}</strong>
              </span>
            </>
          )}
        </div>

        <div className="text-[10px] text-[#7E8B9B] italic">
          {ordersDifference > 0
            ? `Pacing ahead of yesterday by +${ordersDifference} order${ordersDifference === 1 ? '' : 's'}`
            : ordersDifference < 0
            ? `Pacing ${Math.abs(ordersDifference)} order${Math.abs(ordersDifference) === 1 ? '' : 's'} behind yesterday`
            : yesterdayOrdersCount === 0 && todayOrdersCount === 0
            ? 'Waiting for first order of the day'
            : 'Pacing on par with yesterday'}
        </div>
      </div>
    </div>
  );
}
