'use client';

import React from 'react';
import { X, Printer, Download, Check, MapPin, Phone, Mail, Clock, ShoppingBag } from 'lucide-react';
import { CustomerOrder } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import VediqLogo from '@/components/VediqLogo';

interface OrderReceiptModalProps {
  order: CustomerOrder;
  onClose: () => void;
}

export default function OrderReceiptModal({ order, onClose }: OrderReceiptModalProps) {
  const handlePrint = () => {
    window.print();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      {/* Receipt Dialog */}
      <div className="relative w-full max-w-xl bg-white text-[#111827] rounded-3xl shadow-2xl overflow-hidden my-8 print:m-0 print:p-0 print:shadow-none print:w-full print:max-w-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-[#07111F] text-[#F5F1E8] border-b border-[#1C2D4A] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#C9A24A]" />
            <span className="text-xs font-bold text-[#E2C56B]">Order Receipt & Tax Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#AAB4C2] hover:text-white hover:bg-[#101F35] transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 sm:p-8 space-y-6 text-xs leading-normal">
          {/* Brand Header */}
          <div className="text-center pb-4 border-b-2 border-dashed border-gray-300 space-y-1">
            <h1 className="font-serif text-2xl font-black text-[#07111F] tracking-wide uppercase">
              Vediq Biryani
            </h1>
            <p className="text-[11px] font-semibold text-gray-600 tracking-wider uppercase">
              The Heritage of Aromas · 100% Royal Dum Cooking
            </p>
            <p className="text-[10px] text-gray-500">
              Kitchen: Indirapuram / Raj Nagar Extension, Ghaziabad, UP · FSSAI Reg.
            </p>
          </div>

          {/* Order Meta & Customer Info */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Order Information
              </span>
              <p className="font-mono text-sm font-extrabold text-[#07111F]">
                #{order.order_number || order.id}
              </p>
              <p className="text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>{formattedDate}</span>
              </p>
              <p className="text-gray-600">
                Status: <span className="font-bold text-[#07111F] uppercase">{order.order_status?.replace(/_/g, ' ')}</span>
              </p>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Customer Details
              </span>
              <p className="font-bold text-sm text-[#07111F]">{order.customer_name}</p>
              <p className="text-gray-600 font-mono">{order.phone}</p>
              {order.email && <p className="text-gray-500 text-[11px]">{order.email}</p>}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-0.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Delivery Destination
            </span>
            <p className="font-semibold text-gray-900 leading-relaxed">{order.full_address}</p>
            <p className="text-gray-600 text-[11px]">
              {order.city || 'Ghaziabad'}, {order.state || 'Uttar Pradesh'} {order.pincode ? `– ${order.pincode}` : ''}
            </p>
            {order.customer_notes && (
              <p className="text-[11px] text-amber-800 font-medium pt-1 border-t border-gray-200 mt-1">
                <strong>Cooking Note:</strong> &ldquo;{order.customer_notes}&rdquo;
              </p>
            )}
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Items Ordered
            </span>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-[10px] uppercase font-bold text-gray-500">
                  <th className="py-1.5">Dish / Portion</th>
                  <th className="py-1.5 text-center">Qty</th>
                  <th className="py-1.5 text-right">Price</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx} className="text-gray-800">
                    <td className="py-2 pr-2">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Portion: {item.size || 'Standard'}
                      </span>
                    </td>
                    <td className="py-2 text-center font-bold text-gray-700">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-600">{formatINR(item.price)}</td>
                    <td className="py-2 text-right font-bold text-gray-900">
                      {formatINR(item.total || item.price * item.quantity)}
                    </td>
                  </tr>
                ))}

                {(order.extras || []).map((extra, idx) => (
                  <tr key={`ex-${idx}`} className="text-gray-700 text-[11px]">
                    <td className="py-1.5 pr-2">
                      <span>+ {extra.name}</span>
                      <span className="text-[10px] text-gray-400 block">Accompaniment</span>
                    </td>
                    <td className="py-1.5 text-center">{extra.quantity}</td>
                    <td className="py-1.5 text-right">{formatINR(extra.price)}</td>
                    <td className="py-1.5 text-right font-semibold">
                      {formatINR(extra.total || extra.price * (extra.quantity || 1))}
                    </td>
                  </tr>
                ))}

                {(order.complimentary_items || []).map((comp, idx) => (
                  <tr key={`comp-${idx}`} className="text-gray-700 text-[11px] bg-amber-50/50">
                    <td className="py-1.5 pr-2 font-medium text-amber-900">
                      🎁 {comp.name}
                    </td>
                    <td className="py-1.5 text-center text-amber-800">{comp.quantityText}</td>
                    <td className="py-1.5 text-right text-amber-800">Free</td>
                    <td className="py-1.5 text-right font-bold text-amber-900">FREE</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-3 border-t-2 border-dashed border-gray-300 space-y-1.5 text-gray-700">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-semibold">{formatINR(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="font-semibold">
                {order.delivery_charge === 0 ? 'FREE' : formatINR(order.delivery_charge || 0)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount Applied:</span>
                <span>- {formatINR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-300">
              <span>Grand Total:</span>
              <span className="text-lg text-[#07111F]">{formatINR(order.total || 0)}</span>
            </div>
          </div>

          {/* Payment Method Badge */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Payment Method</span>
              <span className="font-bold text-gray-900">{order.payment_method || 'Cash on Delivery (COD)'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Payment Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block ${
                  order.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.payment_status === 'paid' ? 'Paid / Collected' : 'Pending (Collect on Delivery)'}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[10px] text-gray-500 border-t border-gray-200 space-y-0.5">
            <p className="font-bold text-gray-700">Thank you for dining with Vediq Biryani!</p>
            <p>Every handi is slow-cooked on traditional charcoal dum & wrapped in fresh banana leaf.</p>
            <p className="font-mono">www.vediqbiryani.com · +91 85957 78240</p>
          </div>
        </div>
      </div>
    </div>
  );
}
