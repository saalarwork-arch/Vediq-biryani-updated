'use client';

import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, Sparkles, Percent, DollarSign } from 'lucide-react';
import { OfferItem } from '@/types/supabase';
import { formatINR } from '@/lib/utils';

interface OffersTabProps {
  offers: OfferItem[];
  onSaveOffer: (offer: OfferItem) => Promise<{ success: boolean; error?: string }>;
  onDeleteOffer: (id: string) => Promise<{ success: boolean; error?: string }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function OffersTab({
  offers,
  onSaveOffer,
  onDeleteOffer,
  showToast,
}: OffersTabProps) {
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<OfferItem>({
    id: '',
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_value: 499,
    max_discount_amount: 150,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenNew = () => {
    setEditingOffer(null);
    setFormData({
      id: `offer-${Date.now()}`,
      code: '',
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 15,
      min_order_value: 499,
      max_discount_amount: 150,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: OfferItem) => {
    setEditingOffer(offer);
    setFormData({ ...offer });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim()) {
      showToast('Please enter both coupon code and offer title', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: OfferItem = {
        ...formData,
        id: formData.id || `offer-${Date.now()}`,
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        discount_type: formData.discount_type || 'percentage',
        discount_value: Number(formData.discount_value) || 0,
        min_order_value: Number(formData.min_order_value) || 0,
        max_discount_amount: Number(formData.max_discount_amount) || undefined,
        is_active: formData.is_active !== false,
      };

      const res = await onSaveOffer(payload);
      if (res.success) {
        showToast(editingOffer ? 'Offer updated!' : 'Coupon created!', 'success');
        setIsModalOpen(false);
      } else {
        showToast(res.error || 'Failed to save offer', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (offer: OfferItem) => {
    if (confirm(`Are you sure you want to delete offer "${offer.code}"?`)) {
      const res = await onDeleteOffer(offer.id);
      if (res.success) {
        showToast(`Offer "${offer.code}" deleted`, 'info');
      } else {
        showToast(res.error || 'Failed to delete offer', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">
            Offers & Promo Codes
          </h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Configure checkout coupon codes, discounts, minimum order conditions, and validity.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Promo Code</span>
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => {
          const isActive = offer.is_active !== false;
          return (
            <div
              key={offer.id}
              className={`p-5 rounded-2xl bg-white border transition shadow-xs flex flex-col justify-between ${
                isActive ? 'border-[#EAE6DF] hover:border-[#C59A3F]' : 'border-stone-300 opacity-60 bg-stone-50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-[#FAF5E8] border border-[#E9DCBF] text-xs font-mono font-black text-[#8C6418] uppercase tracking-wider">
                    {offer.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#1A1814]">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-xs text-[#5A564F] mt-1 leading-relaxed">{offer.description}</p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-[#1A1814]">
                    <span>Discount:</span>
                    <span className="text-[#9E7422] font-black">
                      {offer.discount_type === 'percentage'
                        ? `${offer.discount_value}% OFF`
                        : `${formatINR(offer.discount_value)} FLAT OFF`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B665E] text-[11px]">
                    <span>Min Order:</span>
                    <span>{formatINR(offer.min_order_value || 0)}</span>
                  </div>
                  {offer.max_discount_amount && (
                    <div className="flex justify-between text-[#6B665E] text-[11px]">
                      <span>Max Cap:</span>
                      <span>{formatINR(offer.max_discount_amount)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 flex items-center justify-end gap-2 border-t border-[#F2EFE8]">
                <button
                  onClick={() => handleOpenEdit(offer)}
                  className="p-1.5 rounded-lg bg-[#FAF5E8] hover:bg-[#F2EFE8] text-[#9E7422] font-bold transition cursor-pointer"
                  title="Edit Offer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(offer)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition cursor-pointer"
                  title="Delete Offer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF5E8] border border-[#E9DCBF] text-[#9E7422] flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1814]">
                    {editingOffer ? `Edit Coupon: ${editingOffer.code}` : 'Create New Coupon'}
                  </h3>
                  <p className="text-xs text-[#6B665E]">Set code, percentage or fixed discount rules</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#8C877E] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. VEDIQ15"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs font-mono font-bold text-[#1A1814] uppercase focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] cursor-pointer"
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Amount (₹ OFF)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Offer Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Royal Welcome 15% OFF"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Description</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Valid on all Handi orders above ₹499"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">
                    {formData.discount_type === 'percentage' ? 'Discount (%)' : 'Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs font-bold text-[#1A1814]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Min Order (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.min_order_value || 0}
                    onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Max Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.max_discount_amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.is_active)}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-[#DDD8CE] text-[#C59A3F]"
                  />
                  <span className="font-bold text-[#1A1814]">Active and claimable during checkout</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#EAE6DF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#DDD8CE] text-xs font-bold text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingOffer ? 'Update Coupon' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
