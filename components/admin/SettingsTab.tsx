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
  Smartphone,
  Bell,
  Volume2,
  VolumeX,
  Download,
} from 'lucide-react';
import { SiteSettings } from '@/types/supabase';

interface SettingsTabProps {
  siteSettings: SiteSettings;
  onSaveSettings: (settings: SiteSettings) => Promise<{ success: boolean; error?: string }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onOpenInstallModal?: () => void;
  isInstalled?: boolean;
  isInstallable?: boolean;
  notificationPermission?: NotificationPermission;
  onRequestNotificationPermission?: () => Promise<NotificationPermission>;
  onSendTestNotification?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function SettingsTab({
  siteSettings,
  onSaveSettings,
  showToast,
  onOpenInstallModal,
  isInstalled = false,
  isInstallable = false,
  notificationPermission = 'default',
  onRequestNotificationPermission,
  onSendTestNotification,
  soundEnabled = true,
  onToggleSound,
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

      {/* PWA & Mobile Device Management Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F2EFE8] pb-3">
          <h3 className="font-bold text-[#1A1814] text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#9E7422]" />
            <span>Installable Web App (PWA) &amp; Device Notifications</span>
          </h3>
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#FAF5EB] text-[#9E7422] border border-[#EAE0CD] w-fit">
            Native PWA Certified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Installation State */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1A1814]">Admin App Installation</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isInstalled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isInstalled ? 'Installed (Standalone PWA)' : 'Running in Browser'}
              </span>
            </div>
            <p className="text-[11px] text-[#6B665E] leading-relaxed">
              Install the VEDIQ BIRYANI ADMIN app onto your home screen or dock for quick 1-tap launch, standalone window mode, and fast order fulfillment.
            </p>
            {onOpenInstallModal && (
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1A1814] hover:bg-[#2C2924] text-[#F5F1E8] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
              >
                <Download className="w-3.5 h-3.5 text-[#C9A24A]" />
                <span>{isInstalled ? 'View App Status & Instructions' : 'Install Admin App to Home Screen'}</span>
              </button>
            )}
          </div>

          {/* Card 2: Notifications & Audio Chime */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1A1814]">Live Order Push Alerts</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {notificationPermission === 'granted'
                  ? 'Permission Granted'
                  : notificationPermission === 'denied'
                  ? 'Blocked in Browser'
                  : 'Permission Not Requested'}
              </span>
            </div>
            <p className="text-[11px] text-[#6B665E] leading-relaxed">
              Browser push alerts notify you with sound and order ID whenever a customer places a new biryani order.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {notificationPermission !== 'granted' && onRequestNotificationPermission && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await onRequestNotificationPermission();
                    if (res === 'granted') {
                      showToast('✓ Browser notifications enabled!', 'success');
                    } else if (res === 'denied') {
                      showToast('Notifications blocked in browser settings', 'error');
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Push Alerts</span>
                </button>
              )}

              {onSendTestNotification && (
                <button
                  type="button"
                  onClick={() => {
                    onSendTestNotification();
                    showToast('Dispatched test alert!', 'info');
                  }}
                  className="py-2 px-3 rounded-xl bg-white border border-[#DDD8CE] hover:bg-stone-50 text-[#1A1814] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-[#9E7422]" />
                  <span>Test Notification</span>
                </button>
              )}

              {onToggleSound && (
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    soundEnabled
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-stone-100 border-stone-300 text-stone-600'
                  }`}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sound: On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                      <span>Sound: Muted</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
