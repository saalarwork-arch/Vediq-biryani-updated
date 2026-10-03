'use client';

import React, { useState } from 'react';
import { Sparkles, Save, Eye, CheckCircle2, RotateCcw } from 'lucide-react';
import { HeroContent } from '@/types/supabase';
import { DEFAULT_HERO_CONTENT } from '@/data/menuData';
import ImageUploadField from './ImageUploadField';

interface HeroTabProps {
  heroContent: HeroContent;
  onSaveHeroContent: (content: HeroContent) => Promise<{ success: boolean; error?: string }>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function HeroTab({ heroContent, onSaveHeroContent, showToast }: HeroTabProps) {
  const [formData, setFormData] = useState<HeroContent>({ ...heroContent });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await onSaveHeroContent(formData);
      if (res.success) {
        showToast('Hero section updated successfully! Public homepage will reflect changes.', 'success');
      } else {
        showToast(res.error || 'Failed to update hero section', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset hero content back to default royal branding?')) {
      setFormData({ ...DEFAULT_HERO_CONTENT });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">
            Hero & Homepage Section
          </h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Customize main headlines, royal announcement badges, CTA buttons, and showcase imagery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DDD8CE] hover:bg-[#F2EFE8] text-xs font-bold text-[#5A564F] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
        </div>
      </div>

      {/* Form and Preview Layout */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 space-y-5 bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs text-xs">
            <h3 className="font-bold text-[#1A1814] text-sm flex items-center gap-2 border-b border-[#F2EFE8] pb-3">
              <Sparkles className="w-4 h-4 text-[#9E7422]" />
              <span>Headline & Typography</span>
            </h3>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Top Announcement Badge</label>
              <input
                type="text"
                value={formData.badge_text || ''}
                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                placeholder="e.g. Royal Awadhi Heritage & 100% Satvik Jain Dum Biryani"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Headline Part 1 (First Line)</label>
                <input
                  type="text"
                  value={formData.headline_line1 || ''}
                  onChange={(e) => setFormData({ ...formData, headline_line1: e.target.value })}
                  placeholder="e.g. Pure Heritage."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Headline Part 2 (Accent Line)</label>
                <input
                  type="text"
                  value={formData.headline_line2 || ''}
                  onChange={(e) => setFormData({ ...formData, headline_line2: e.target.value })}
                  placeholder="e.g. Slow-Dum Cooked in Clay."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition font-serif font-bold text-[#9E7422]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1A1814]">Subheading Description</label>
              <textarea
                rows={3}
                value={formData.subheading || ''}
                onChange={(e) => setFormData({ ...formData, subheading: e.target.value })}
                placeholder="Description paragraph below main headline..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#F2EFE8]">
              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Primary CTA Button Text</label>
                <input
                  type="text"
                  value={formData.cta_primary_text || ''}
                  onChange={(e) => setFormData({ ...formData, cta_primary_text: e.target.value })}
                  placeholder="Explore Royal Menu"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A1814]">Secondary CTA Button Text</label>
                <input
                  type="text"
                  value={formData.cta_secondary_text || ''}
                  onChange={(e) => setFormData({ ...formData, cta_secondary_text: e.target.value })}
                  placeholder="100% Satvik Jain"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#F2EFE8]">
              <ImageUploadField
                label="Hero Featured Photo"
                value={formData.hero_image_url || ''}
                onChange={(url) => setFormData({ ...formData, hero_image_url: url })}
                folder="hero"
                aspectRatio="video"
                showToast={showToast}
              />
            </div>

            {/* Feature Bullets */}
            <div className="space-y-2 pt-3 border-t border-[#F2EFE8]">
              <label className="font-bold text-[#1A1814] block">3 Trust Pillars / Feature Highlights</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.feature_tag_1 || 'Individual Handi Cooked'}
                  onChange={(e) => setFormData({ ...formData, feature_tag_1: e.target.value })}
                  placeholder="Pillar 1"
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#DDD8CE] text-xs"
                />
                <input
                  type="text"
                  value={formData.feature_tag_2 || '100% Satvik Jain Certified'}
                  onChange={(e) => setFormData({ ...formData, feature_tag_2: e.target.value })}
                  placeholder="Pillar 2"
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#DDD8CE] text-xs"
                />
                <input
                  type="text"
                  value={formData.feature_tag_3 || 'Eco-Friendly Earthen Pots'}
                  onChange={(e) => setFormData({ ...formData, feature_tag_3: e.target.value })}
                  placeholder="Pillar 3"
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#DDD8CE] text-xs"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Mock Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE6DF] shadow-xs">
              <span className="text-[10px] font-bold text-[#9E7422] uppercase tracking-wider block mb-3">
                Live Public Homepage Preview
              </span>

              <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] space-y-4 shadow-sm">
                <div className="inline-block px-3 py-1 rounded-full bg-[#FAF5E8] border border-[#E9DCBF] text-[10px] font-bold text-[#8C6418]">
                  {formData.badge_text}
                </div>

                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1A1814] leading-tight">
                    {formData.headline_line1}{' '}
                    <span className="text-[#9E7422] block italic">{formData.headline_line2}</span>
                  </h2>
                  <p className="text-xs text-[#6B665E] mt-2 leading-relaxed">{formData.subheading}</p>
                </div>

                <div className="flex gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-[#1A1814] text-white text-[11px] font-bold shadow-xs">
                    {formData.cta_primary_text}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#FAF5E8] border border-[#E9DCBF] text-[#8C6418] text-[11px] font-bold">
                    {formData.cta_secondary_text}
                  </span>
                </div>

                {formData.hero_image_url && (
                  <div className="rounded-xl overflow-hidden aspect-video border border-[#DDD8CE]">
                    <img
                      src={formData.hero_image_url}
                      alt="Hero preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save & Publish Hero Updates'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
