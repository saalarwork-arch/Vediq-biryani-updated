'use client';

import React, { useState } from 'react';
import { FileText, Save, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SiteSettings } from '@/types/supabase';

interface ContentTabProps {
  siteSettings: SiteSettings;
  onSaveSettings: (settings: SiteSettings) => Promise<{ success: boolean; error?: string }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ContentTab({ siteSettings, onSaveSettings, showToast }: ContentTabProps) {
  const [formData, setFormData] = useState<SiteSettings>({ ...siteSettings });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await onSaveSettings(formData);
      if (res.success) {
        showToast('Website content updated successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to update content', 'error');
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
            Website Copy & Section Content
          </h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Update messaging, Satvik guarantees, craft descriptions, and footer brand narratives.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand Tagline & Mission */}
          <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-[#1A1814] text-sm flex items-center gap-2 border-b border-[#F2EFE8] pb-3">
              <Sparkles className="w-4 h-4 text-[#9E7422]" />
              <span>Brand Tagline & Mission Statement</span>
            </h3>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Brand Headline / Motto</label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Royal Handi Dum Biryani & 100% Satvik Jain Specialties"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Brand Story / Heritage Narrative</label>
              <textarea
                rows={4}
                value={
                  formData.footer_text ||
                  'Slow-cooked individually in unglazed earthen clay pots using fragrant aged royal Basmati rice and pure organic saffron.'
                }
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] leading-relaxed"
              />
            </div>
          </div>

          {/* Satvik & Kitchen Purity Statement */}
          <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-[#1A1814] text-sm flex items-center gap-2 border-b border-[#F2EFE8] pb-3">
              <ShieldCheck className="w-4 h-4 text-[#1A4B29]" />
              <span>100% Satvik Jain Purity Guarantees</span>
            </h3>

            <div className="p-4 rounded-xl bg-[#ECF7F0] border border-[#D1EBD9] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#1A4B29]">
                <ShieldCheck className="w-4 h-4" />
                <span>Satvik Kitchen Certification Banner</span>
              </div>
              <p className="text-[#1A4B29] text-[11px] leading-relaxed">
                Prepared with zero onion, zero garlic, zero root vegetables, and in dedicated separate earthenware handis.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Certifications Note</label>
              <input
                type="text"
                value="Certified FSSAI & Satvik Kitchen Protocols"
                readOnly
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#6B665E]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Content...' : 'Save Website Content'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
