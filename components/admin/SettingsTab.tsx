'use client';

import React, { useState } from 'react';
import {
  Settings,
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Truck,
  ShieldCheck,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { SiteSettings } from '@/types/supabase';

interface SettingsTabProps {
  siteSettings: SiteSettings;
  onSaveSettings: (settings: SiteSettings) => Promise<{ success: boolean; error?: string }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function SettingsTab({
  siteSettings,
  onSaveSettings,
  showToast,
}: SettingsTabProps) {
  const [formData, setFormData] = useState<SiteSettings>({ ...siteSettings });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: SiteSettings = {
        ...formData,
        delivery_charge: Number(formData.delivery_charge) || 0,
        free_delivery_threshold: Number(formData.free_delivery_threshold) || 0,
        minimum_order_amount: Number(formData.minimum_order_amount) || 0,
      };

      const res = await onSaveSettings(payload);
      if (res.success) {
        showToast('Site settings updated! Delivery rates and kitchen info refreshed.', 'success');
      } else {
        showToast(res.error || 'Failed to save settings', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">
            Restaurant & Kitchen Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Configure contact coordinates, delivery fees, free delivery limits, and operating hours.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Restaurant Identity */}
          <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-[#1A1814] text-sm flex items-center gap-2 border-b border-[#F2EFE8] pb-3">
              <Store className="w-4 h-4 text-[#9E7422]" />
              <span>Brand & Kitchen Identity</span>
            </h3>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Restaurant Name</label>
              <input
                type="text"
                required
                value={formData.restaurant_name}
                onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Official Brand Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Customer Support Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">WhatsApp Order Line</label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Inquiry Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Kitchen Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">City</label>
                <input
                  type="text"
                  value={formData.city || 'Ghaziabad'}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">State</label>
                <input
                  type="text"
                  value={formData.state || 'Uttar Pradesh'}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode || '201012'}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814]"
                />
              </div>
            </div>
          </div>

          {/* Delivery & Operations Configuration */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-[#1A1814] text-sm flex items-center gap-2 border-b border-[#F2EFE8] pb-3">
                <Truck className="w-4 h-4 text-[#9E7422]" />
                <span>Delivery & Checkout Logic</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Standard Delivery Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.delivery_charge}
                    onChange={(e) => setFormData({ ...formData, delivery_charge: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs font-bold text-[#1A1814]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Free Delivery Threshold (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.free_delivery_threshold}
                    onChange={(e) =>
                      setFormData({ ...formData, free_delivery_threshold: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs font-bold text-[#1A1814]"
                  />
                  <p className="text-[10px] text-[#6B665E]">Orders at or above this get free delivery</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Estimated Delivery Time</label>
                  <input
                    type="text"
                    value={formData.estimated_delivery_time}
                    onChange={(e) => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
                    placeholder="35-45 mins"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1A1814]">Kitchen Operating Hours</label>
                  <input
                    type="text"
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    placeholder="Open 24 hours"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1A1814]">Kitchen Online Accepting Orders</h4>
                  <p className="text-[11px] text-[#6B665E]">
                    Toggle whether customers can place new orders right now
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_open_now !== false}
                    onChange={(e) => setFormData({ ...formData, is_open_now: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Settings...' : 'Save & Publish Site Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
