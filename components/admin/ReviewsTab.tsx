'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  CheckCircle2,
  EyeOff,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  Copy,
  Check,
  Code2,
  MessageSquare,
} from 'lucide-react';
import { ReviewItem } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';

interface ReviewsTabProps {
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ReviewsTab({ showToast }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showSqlGuide, setShowSqlGuide] = useState<boolean>(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setReviews(data as ReviewItem[]);
      } else {
        // Try fallback table 'reviews'
        const { data: revData, error: revError } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (!revError && Array.isArray(revData)) {
          setReviews(revData as ReviewItem[]);
        } else {
          try {
            const localKey = 'vediq_user_submitted_feedback';
            const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
            setReviews(
              localList.map((item: any, idx: number) => ({
                id: item.id || `local-${idx}`,
                ...item,
              }))
            );
          } catch {
            setReviews([]);
          }
        }
      }
    } catch (err: any) {
      console.error('[ReviewsTab] Fetch error:', err);
      showToast('Could not load reviews from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Approve / Hide review
  const handleToggleApproval = async (review: ReviewItem, targetApproved: boolean) => {
    setUpdatingId(review.id);
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_approved: targetApproved, updated_at: new Date().toISOString() })
        .eq('id', review.id);

      if (error) {
        await supabase
          .from('reviews')
          .update({ is_approved: targetApproved, updated_at: new Date().toISOString() })
          .eq('id', review.id);

        try {
          const localKey = 'vediq_user_submitted_feedback';
          const localList: ReviewItem[] = JSON.parse(localStorage.getItem(localKey) || '[]');
          const updated = localList.map((item) =>
            item.id === review.id ? { ...item, is_approved: targetApproved } : item
          );
          localStorage.setItem(localKey, JSON.stringify(updated));
        } catch {}
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, is_approved: targetApproved } : r))
      );

      showToast(
        `Review marked as ${targetApproved ? 'Approved (Public)' : 'Hidden (Private)'}`,
        'success'
      );
    } catch (err: any) {
      showToast(`Error updating review: ${err.message}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer review?')) {
      return;
    }

    setUpdatingId(reviewId);
    try {
      await supabase.from('customer_reviews').delete().eq('id', reviewId);
      await supabase.from('reviews').delete().eq('id', reviewId);

      try {
        const localKey = 'vediq_user_submitted_feedback';
        const localList: ReviewItem[] = JSON.parse(localStorage.getItem(localKey) || '[]');
        const updated = localList.filter((item) => item.id !== reviewId);
        localStorage.setItem(localKey, JSON.stringify(updated));
      } catch {}

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast('Review permanently deleted.', 'info');
    } catch (err: any) {
      showToast(`Failed to delete review: ${err.message}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const sqlMigrationCode = `-- VEDIQ BIRYANI: CUSTOMER REVIEWS TABLE MIGRATION
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert of reviews" ON public.reviews;
CREATE POLICY "Allow public insert of reviews"
ON public.reviews FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read approved reviews" ON public.reviews;
CREATE POLICY "Allow public read approved reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_approved = true);

DROP POLICY IF EXISTS "Allow active admins manage reviews" ON public.reviews;
CREATE POLICY "Allow active admins manage reviews"
ON public.reviews FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    showToast('SQL migration copied to clipboard!', 'success');
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (filterStatus === 'pending' && r.is_approved) return false;
      if (filterStatus === 'approved' && !r.is_approved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name?.toLowerCase().includes(q);
        const matchText = r.review?.toLowerCase().includes(q);
        return matchName || matchText;
      }
      return true;
    });
  }, [reviews, filterStatus, searchQuery]);

  const pendingCount = reviews.filter((r) => !r.is_approved).length;
  const approvedCount = reviews.filter((r) => r.is_approved).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1814]">
              Customer Reviews Management
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B665E] mt-1">
            Review submitted feedback. Only approved reviews appear on the live website.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs font-bold text-[#5A564F] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-[#9E7422]" />
            <span>SQL Schema</span>
          </button>

          <button
            onClick={fetchReviews}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs font-bold text-[#5A564F] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SQL Migration Helper Card (Collapsible) */}
      {showSqlGuide && (
        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#9E7422]" />
              <h4 className="text-xs font-bold text-[#1A1814]">
                Supabase SQL Migration for Customer Reviews Table
              </h4>
            </div>
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#DDD8CE] text-[11px] font-bold text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#9E7422]" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#6B665E] leading-relaxed">
            Run this in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to ensure the table
            and RLS policies are active on Postgres.
          </p>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-48">
            {sqlMigrationCode}
          </pre>
        </div>
      )}

      {/* Stats and Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-white border-[#C59A3F] shadow-sm ring-1 ring-[#C59A3F]'
              : 'bg-white border-[#EAE6DF] hover:bg-[#FAF8F5]'
          }`}
        >
          <div className="text-[11px] font-bold text-[#6B665E] uppercase tracking-wider">
            Total Reviews
          </div>
          <div className="text-2xl font-serif font-black text-[#1A1814] mt-0.5">
            {reviews.length}
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('pending')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            filterStatus === 'pending'
              ? 'bg-white border-amber-500 shadow-sm ring-1 ring-amber-500'
              : 'bg-white border-[#EAE6DF] hover:bg-[#FAF8F5]'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Pending Approval
          </div>
          <div className="text-2xl font-serif font-black text-amber-900 mt-0.5">
            {pendingCount}
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('approved')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            filterStatus === 'approved'
              ? 'bg-white border-emerald-600 shadow-sm ring-1 ring-emerald-600'
              : 'bg-white border-[#EAE6DF] hover:bg-[#FAF8F5]'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Approved & Public
          </div>
          <div className="text-2xl font-serif font-black text-emerald-900 mt-0.5">
            {approvedCount}
          </div>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C877E]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search reviews by customer name or text content..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#EAE6DF] text-xs text-[#1A1814] placeholder-[#8C877E] focus:outline-none focus:border-[#C59A3F] transition shadow-xs"
        />
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#9E7422] animate-spin" />
          <p className="text-xs text-[#6B665E]">Loading submitted reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#EAE6DF] p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#DDD8CE] flex items-center justify-center text-[#9E7422] mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#1A1814]">
            {filterStatus === 'pending'
              ? 'No pending reviews'
              : filterStatus === 'approved'
              ? 'No approved reviews yet'
              : 'No reviews found'}
          </h3>
          <p className="text-xs text-[#6B665E] max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search keywords.'
              : 'When patrons submit reviews through the website, they will appear here for your moderation.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className={`p-5 rounded-2xl border transition-all ${
                r.is_approved
                  ? 'bg-white border-[#EAE6DF] hover:border-[#DDD8CE]'
                  : 'bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1A1814]">{r.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        r.is_approved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {r.is_approved ? 'Approved (Visible)' : 'Pending Approval'}
                    </span>
                    {r.created_at && (
                      <span className="text-[11px] text-[#8C877E]">
                        •{' '}
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= (r.rating || 5)
                            ? 'fill-[#C59A3F] text-[#C59A3F]'
                            : 'text-[#DDD8CE]'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#9E7422] ml-1">
                      {r.rating || 5} Stars
                    </span>
                  </div>

                  <p className="text-xs text-[#333] leading-relaxed italic bg-[#FAF8F5] p-3 rounded-xl border border-[#F2EFE8]">
                    &ldquo;{r.review}&rdquo;
                  </p>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  {!r.is_approved ? (
                    <button
                      onClick={() => handleToggleApproval(r, true)}
                      disabled={updatingId === r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleApproval(r, false)}
                      disabled={updatingId === r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-[#5A564F] hover:text-[#1A1814] hover:bg-[#F2EFE8] font-bold text-xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
                      title="Hide from public display"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    disabled={updatingId === r.id}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
