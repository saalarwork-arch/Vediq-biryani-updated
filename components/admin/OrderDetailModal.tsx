'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Printer,
  Copy,
  Check,
  MapPin,
  Clock,
  Calendar,
  ChefHat,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  FileText,
  User,
  Mail,
  DollarSign,
  ArrowRight,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { CustomerOrder, OrderStatus } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import {
  ORDER_CATEGORIES,
  getOrderCategory,
  getValidTransitions,
  StatusTransition,
} from '@/lib/adminOrderUtils';
import OrderReceiptModal from './OrderReceiptModal';

interface OrderDetailModalProps {
  order: CustomerOrder;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, reason?: string) => Promise<void>;
  onTogglePaymentStatus?: (orderId: string, newPaymentStatus: 'pending' | 'paid') => Promise<void>;
}

export default function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  onTogglePaymentStatus,
}: OrderDetailModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Cancellation Confirmation Dialog
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');

  // Generic Transition Confirmation Dialog
  const [confirmTransition, setConfirmTransition] = useState<StatusTransition | null>(null);

  // Payment Toggle Confirmation
  const [confirmPaymentChange, setConfirmPaymentChange] = useState<boolean>(false);

  const currentCategory = getOrderCategory(order);
  const categoryConfig = ORDER_CATEGORIES.find((c) => c.key === currentCategory) || ORDER_CATEGORIES[0];
  const validTransitions = getValidTransitions(order.order_status);

  const cleanPhone = (order.phone || '').replace(/\D/g, '');
  const whatsAppPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;

  // WhatsApp text template: prepares greeting and order reference without sending automatically
  const whatsAppGreeting = encodeURIComponent(
    `Namaste ${order.customer_name || 'Guest'}! This is regarding your Vediq Biryani order #${order.order_number || order.id}.`
  );
  const whatsAppUrl = `https://wa.me/${whatsAppPhone}?text=${whatsAppGreeting}`;

  const handleCopyId = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(order.order_number || order.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyAddress = () => {
    const fullText = `${order.full_address}, ${order.city || 'Ghaziabad'}, ${order.state || 'UP'} ${order.pincode || ''}`.trim();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullText);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const executeStatusChange = async (nextStatus: OrderStatus, reason?: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, nextStatus, reason);
      setConfirmTransition(null);
      setCancelModalOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePayment = async () => {
    if (!onTogglePaymentStatus) return;
    const nextPaymentStatus = order.payment_status === 'paid' ? 'pending' : 'paid';
    setIsUpdating(true);
    try {
      await onTogglePaymentStatus(order.id, nextPaymentStatus);
      setConfirmPaymentChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'N/A';

  // Build timeline steps
  const stepsConfig = [
    { key: 'new', label: 'Order Received', dbStatus: 'pending' },
    { key: 'confirmed', label: 'Confirmed', dbStatus: 'confirmed' },
    { key: 'preparing', label: 'Dum Cooking', dbStatus: 'preparing' },
    { key: 'ready', label: 'Packed & Ready', dbStatus: 'ready_for_delivery' },
    { key: 'out_for_delivery', label: 'Out for Delivery', dbStatus: 'out_for_delivery' },
    { key: 'delivered', label: 'Delivered', dbStatus: 'delivered' },
  ];

  const currentIdx = stepsConfig.findIndex((s) => s.key === currentCategory);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div className="relative w-full max-w-4xl bg-[#0A1628] border border-[#1C2D4A] rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 text-[#F5F1E8] flex flex-col max-h-[92vh]">
          {/* Top Header */}
          <div className="p-4 sm:p-6 bg-[#07111F] border-b border-[#1C2D4A] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-lg sm:text-2xl font-black text-[#E2C56B] tracking-wide">
                  #{order.order_number || order.id}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryConfig.badgeBg} ${categoryConfig.badgeText} ${categoryConfig.badgeBorder}`}
                >
                  {categoryConfig.label}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    order.payment_status === 'paid'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  COD: {order.payment_status === 'paid' ? 'Paid / Collected' : 'Pending Payment'}
                </span>
              </div>
              <p className="text-xs text-[#AAB4C2] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C9A24A]" />
                <span>Placed on {formattedDate}</span>
                {order.delivery_time && (
                  <>
                    <span>·</span>
                    <span className="text-[#E2C56B]">Slot: {order.delivery_time}</span>
                  </>
                )}
              </p>
            </div>

            {/* Quick Utility Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyId}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#E2C56B] transition cursor-pointer flex items-center gap-1.5"
                title="Copy Order ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReceiptOpen(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] hover:text-[#E2C56B] transition cursor-pointer flex items-center gap-1.5"
                title="Print Receipt"
              >
                <Printer className="w-3.5 h-3.5 text-[#C9A24A]" />
                <span className="hidden sm:inline">Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-[#101F35] hover:bg-rose-950/40 text-[#AAB4C2] hover:text-white border border-[#1C2D4A] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* 1. STATUS PROGRESS TIMELINE */}
            {order.order_status !== 'cancelled' ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#AAB4C2] uppercase tracking-wider text-[10px]">
                    Order Progression Lifecycle
                  </span>
                  <span className="text-[11px] font-semibold text-[#E2C56B]">
                    Step {currentIdx + 1} of {stepsConfig.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {stepsConfig.map((st, idx) => {
                    const isCompleted = currentIdx > idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <div
                        key={st.key}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-[#101F35] border-[#C9A24A] text-[#E2C56B] shadow-[0_0_12px_rgba(201,162,74,0.2)]'
                            : isCompleted
                            ? 'bg-[#0A1628] border-emerald-500/30 text-emerald-300'
                            : 'bg-[#07111F] border-[#1C2D4A]/50 text-[#7E8B9B]'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-[#E2C56B] animate-pulse" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7E8B9B]" />
                          )}
                          <span className="text-[10px] font-bold uppercase">{st.key}</span>
                        </div>
                        <p className="text-xs font-bold leading-tight truncate">{st.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center gap-3 text-rose-300">
                <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <div className="text-xs">
                  <p className="font-bold text-sm">Order Has Been Cancelled</p>
                  <p className="text-rose-300/80">
                    This order is marked as cancelled. No further kitchen or dispatch actions are active.
                  </p>
                </div>
              </div>
            )}

            {/* 2. CUSTOMER & DELIVERY ADDRESS INFORMATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Contact Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AAB4C2] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C9A24A]" />
                    <span>Customer Details</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#E2C56B]">
                    {order.customer_name || 'Guest'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#7E8B9B] text-[11px] block">Full Name:</span>
                    <p className="font-bold text-sm text-[#F5F1E8]">{order.customer_name}</p>
                  </div>

                  <div>
                    <span className="text-[#7E8B9B] text-[11px] block">Phone Number:</span>
                    <p className="font-mono font-bold text-sm text-[#E2C56B]">{order.phone}</p>
                  </div>

                  {order.email && (
                    <div>
                      <span className="text-[#7E8B9B] text-[11px] block">Email Address:</span>
                      <p className="text-[#AAB4C2]">{order.email}</p>
                    </div>
                  )}

                  {/* Contact Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={`tel:${order.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-[#101F35] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-xs font-bold text-[#F5F1E8] hover:text-[#E2C56B] transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Customer</span>
                    </a>

                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      title="Open WhatsApp chat window (does not send automatically)"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp Chat</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AAB4C2] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C9A24A]" />
                    <span>Delivery Address</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="text-[11px] font-bold text-[#E2C56B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAddress ? 'Copied' : 'Copy Address'}</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#7E8B9B] text-[11px] block">Complete Street Address:</span>
                    <p className="font-semibold text-sm text-[#F5F1E8] leading-relaxed">
                      {order.full_address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[#AAB4C2]">
                    <div>
                      <span className="text-[#7E8B9B] text-[10px] block uppercase">City & State</span>
                      <p className="font-semibold text-[#F5F1E8]">
                        {order.city || 'Ghaziabad'}, {order.state || 'Uttar Pradesh'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#7E8B9B] text-[10px] block uppercase">Pincode</span>
                      <p className="font-mono font-bold text-[#E2C56B]">{order.pincode || '201012'}</p>
                    </div>
                  </div>

                  {order.customer_notes && (
                    <div className="p-2.5 rounded-xl bg-[#101F35] border border-amber-500/20 text-xs text-[#E2C56B]">
                      <span className="font-bold text-[10px] uppercase text-[#C9A24A] block">Customer Note</span>
                      <p className="italic text-[#F5F1E8] mt-0.5">&ldquo;{order.customer_notes}&rdquo;</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. ORDERED ITEMS & FINANCIAL BREAKDOWN */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AAB4C2] flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-[#C9A24A]" />
                  <span>Items Ordered</span>
                </span>
                <span className="text-xs text-[#AAB4C2]">
                  {(order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0)} items total
                </span>
              </div>

              {/* Items Table */}
              <div className="divide-y divide-[#1C2D4A]">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-[#F5F1E8]">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="text-[#AAB4C2]">
                        Portion: <span className="text-[#E2C56B] font-semibold">{item.size || 'Standard'}</span> ·{' '}
                        {formatINR(item.price)} each
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[#F5F1E8]">
                        {formatINR(item.total || item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Extras */}
                {(order.extras || []).map((extra, idx) => (
                  <div key={`extra-${idx}`} className="py-2.5 flex items-center justify-between text-xs text-[#AAB4C2]">
                    <div>
                      <p className="font-medium text-[#F5F1E8]">
                        + {extra.quantity}x {extra.name}
                      </p>
                      <span className="text-[10px] text-[#7E8B9B]">Accompaniment</span>
                    </div>
                    <span className="font-semibold text-[#F5F1E8]">
                      {formatINR(extra.price * (extra.quantity || 1))}
                    </span>
                  </div>
                ))}

                {/* Complimentary items */}
                {(order.complimentary_items || []).map((comp, idx) => (
                  <div
                    key={`comp-${idx}`}
                    className="py-2 px-3 my-1 rounded-xl bg-[#101F35]/50 border border-[#C9A24A]/20 flex items-center justify-between text-xs text-[#E2C56B]"
                  >
                    <span>🎁 {comp.name} ({comp.quantityText})</span>
                    <span className="font-bold text-emerald-400">FREE</span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="pt-3 border-t border-[#1C2D4A] space-y-1.5 text-xs text-[#AAB4C2]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#F5F1E8]">{formatINR(order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span className="font-semibold text-[#F5F1E8]">
                    {order.delivery_charge === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : formatINR(order.delivery_charge || 0)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount:</span>
                    <span>- {formatINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-[#1C2D4A] text-[#F5F1E8]">
                  <span className="font-bold">Total Bill:</span>
                  <span className="font-extrabold text-base text-[#E2C56B]">{formatINR(order.total || 0)}</span>
                </div>
              </div>

              {/* COD & Payment Status Bar */}
              <div className="p-3.5 rounded-xl bg-[#101F35] border border-[#C9A24A]/30 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#F5F1E8]">Payment Method:</span>
                    <span className="text-xs font-extrabold text-[#E2C56B]">{order.payment_method || 'Cash on Delivery (COD)'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#AAB4C2]">Collection Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        order.payment_status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {order.payment_status === 'paid' ? 'Paid / Cash Collected' : 'Pending Doorstep Collection'}
                    </span>
                  </div>
                </div>

                {onTogglePaymentStatus && (
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentChange(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 ${
                      order.payment_status === 'paid'
                        ? 'bg-[#07111F] hover:bg-[#1C2D4A] border border-[#1C2D4A] text-[#AAB4C2]'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                    }`}
                  >
                    {order.payment_status === 'paid' ? 'Mark as Unpaid (Pending)' : 'Mark COD as Collected / Paid'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Workflow Actions */}
          <div className="p-4 sm:p-5 bg-[#07111F] border-t border-[#1C2D4A] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#AAB4C2]">Current Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryConfig.badgeBg} ${categoryConfig.badgeText} ${categoryConfig.badgeBorder}`}
              >
                {categoryConfig.label}
              </span>
            </div>

            {/* Action buttons based on current state */}
            <div className="flex items-center gap-2 flex-wrap">
              {validTransitions.map((tr) => (
                <button
                  key={tr.nextStatus}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    if (tr.requiresReason || tr.nextStatus === 'cancelled') {
                      setCancelModalOpen(true);
                    } else {
                      setConfirmTransition(tr);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50 ${tr.buttonClass}`}
                >
                  <span>{tr.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ))}

              {validTransitions.length === 0 && (
                <span className="text-xs text-[#7E8B9B] italic">No further actions needed (terminal state).</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Next Status Transition */}
      {confirmTransition && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-3xl bg-[#0A1628] border border-[#C9A24A]/40 p-6 space-y-4 shadow-2xl text-[#F5F1E8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B]">
                <ChefHat className="w-5 h-5 text-[#C9A24A]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F5F1E8]">Confirm Status Transition</h3>
                <p className="text-xs text-[#AAB4C2]">Order #{order.order_number || order.id}</p>
              </div>
            </div>

            <p className="text-xs text-[#AAB4C2] leading-relaxed">
              Are you sure you want to transition this order to{' '}
              <strong className="text-[#E2C56B] uppercase">{confirmTransition.nextStatus.replace(/_/g, ' ')}</strong>?
            </p>

            <p className="text-[11px] text-[#7E8B9B] bg-[#07111F] p-2.5 rounded-xl border border-[#1C2D4A]">
              {confirmTransition.description}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTransition(null)}
                className="px-4 py-2 rounded-xl bg-[#101F35] text-[#AAB4C2] hover:text-[#F5F1E8] text-xs font-bold transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => executeStatusChange(confirmTransition.nextStatus)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${confirmTransition.buttonClass}`}
              >
                {isUpdating ? 'Updating...' : `Yes, ${confirmTransition.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-3xl bg-[#0A1628] border border-rose-500/40 p-6 space-y-4 shadow-2xl text-[#F5F1E8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-200">Cancel Order #{order.order_number || order.id}</h3>
                <p className="text-xs text-rose-300/70">This action will stop all preparation & delivery.</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-[#F5F1E8] block">Reason for Cancellation:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] focus:outline-none focus:border-rose-500"
              >
                <option value="Customer requested cancellation">Customer requested cancellation</option>
                <option value="Kitchen out of stock for selected handi">Kitchen out of stock for selected handi</option>
                <option value="Delivery address out of delivery radius">Delivery address out of delivery radius</option>
                <option value="Customer phone unreachable">Customer phone unreachable</option>
                <option value="Duplicate order placed">Duplicate order placed</option>
                <option value="Other administrative reason">Other administrative reason</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#101F35] text-[#AAB4C2] hover:text-[#F5F1E8] text-xs font-bold transition cursor-pointer"
              >
                Keep Order Active
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => executeStatusChange('cancelled', cancelReason)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
              >
                {isUpdating ? 'Cancelling...' : 'Confirm Order Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Toggle Confirmation */}
      {confirmPaymentChange && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-3xl bg-[#0A1628] border border-[#C9A24A]/40 p-6 space-y-4 shadow-2xl text-[#F5F1E8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B]">
                <DollarSign className="w-5 h-5 text-[#C9A24A]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F5F1E8]">Update COD Collection Status</h3>
                <p className="text-xs text-[#AAB4C2]">Order #{order.order_number || order.id}</p>
              </div>
            </div>

            <p className="text-xs text-[#AAB4C2] leading-relaxed">
              Do you confirm that{' '}
              <strong className="text-[#E2C56B]">{formatINR(order.total)}</strong> for this Cash on Delivery order has been{' '}
              {order.payment_status === 'paid' ? 'marked as Unpaid' : 'physically collected / received via cash or UPI'}?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPaymentChange(false)}
                className="px-4 py-2 rounded-xl bg-[#101F35] text-[#AAB4C2] hover:text-[#F5F1E8] text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleTogglePayment}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition cursor-pointer"
              >
                {isUpdating ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {isReceiptOpen && <OrderReceiptModal order={order} onClose={() => setIsReceiptOpen(false)} />}
    </>
  );
}
