'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  Archive,
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { CustomerOrder } from '@/types/supabase';
import { formatINR } from '@/lib/utils';

interface AdminDeleteOrderModalProps {
  order: CustomerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onMoveToTrash: (order: CustomerOrder) => Promise<void>;
  onPermanentDelete: (order: CustomerOrder) => Promise<void>;
  onRestoreFromTrash?: (order: CustomerOrder) => Promise<void>;
  isProcessing?: boolean;
}

export default function AdminDeleteOrderModal({
  order,
  isOpen,
  onClose,
  onMoveToTrash,
  onPermanentDelete,
  onRestoreFromTrash,
  isProcessing = false,
}: AdminDeleteOrderModalProps) {
  const [confirmPermanent, setConfirmPermanent] = useState(false);

  if (!isOpen || !order) return null;

  const isAlreadyInTrash = Boolean(order.is_trashed);
  const totalItems = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

  const handleClose = () => {
    setConfirmPermanent(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-order-dialog-title"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isAlreadyInTrash
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-order-dialog-title" className="text-base font-bold text-gray-900">
                {isAlreadyInTrash ? 'Permanently Delete Order' : 'Delete Order'}
              </h3>
              <p className="text-xs text-gray-500">
                Order #{order.order_number || order.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Main Confirmation Message */}
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-gray-900">
              Are you sure you want to delete this order?
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {isAlreadyInTrash
                ? 'This order is currently in the trash. Permanently deleting it will remove this order record completely.'
                : 'You can move this order to Trash (recoverable anytime) or permanently delete it.'}
            </p>
          </div>

          {/* Order Details Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-mono font-bold text-gray-900">
                #{order.order_number || order.id}
              </span>
              <span className="font-extrabold text-[#B8860B]">
                {formatINR(order.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <span className="text-gray-500 block text-[11px]">Customer</span>
                <span className="font-bold text-gray-900">{order.customer_name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Phone</span>
                <span className="font-mono font-semibold">{order.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block text-[11px]">Items</span>
                <span className="font-medium text-gray-800">
                  {totalItems} dishes &bull;{' '}
                  {(order.items || []).map((i) => `${i.quantity}x ${i.name}`).slice(0, 3).join(', ')}
                  {(order.items || []).length > 3 ? '...' : ''}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block text-[11px]">Delivery Address</span>
                <span className="text-gray-700 line-clamp-1">{order.full_address}</span>
              </div>
            </div>
          </div>

          {/* Safety & Permanent Warning Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Safety &amp; Audit Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              <strong>Move to Trash</strong> is safely recoverable at any time from the Trash tab.
              <strong> Permanent deletion</strong> is irreversible. Customer profiles and product data will <strong>never</strong> be affected.
            </p>
          </div>

          {/* Permanent Confirmation Toggle */}
          {confirmPermanent && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-xs text-red-900 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-black text-red-700">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>Permanent Deletion Confirmation</span>
              </div>
              <p className="text-[11px] text-red-800">
                Warning: This will permanently purge order #{order.order_number || order.id} from Supabase. Are you absolutely certain?
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end">
            {isAlreadyInTrash && onRestoreFromTrash && (
              <button
                type="button"
                onClick={() => onRestoreFromTrash(order)}
                disabled={isProcessing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Order</span>
              </button>
            )}

            {!isAlreadyInTrash && (
              <button
                type="button"
                onClick={() => onMoveToTrash(order)}
                disabled={isProcessing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Move to Trash (Recoverable)</span>
              </button>
            )}

            {!confirmPermanent ? (
              <button
                type="button"
                onClick={() => setConfirmPermanent(true)}
                disabled={isProcessing}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Permanently Delete</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onPermanentDelete(order)}
                disabled={isProcessing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer animate-pulse"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Permanently Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
