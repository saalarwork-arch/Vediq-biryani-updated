'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, AlertCircle, X, RefreshCw, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { ReviewItem } from '@/types/supabase';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Feedback form state
  const [name, setName] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchApprovedReviews = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('customer_reviews')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          setReviews(data as ReviewItem[]);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[CustomerReviews] Error fetching reviews from Supabase:', err);
    }

    try {
      const stored = localStorage.getItem('vediq_user_submitted_feedback');
      if (stored) {
        const parsed = JSON.parse(stored);
        setReviews(parsed.filter((r: any) => r.is_approved === true));
      } else {
        setReviews([]);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedReviews();
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanName = name.trim();
    const cleanReview = reviewText.trim();

    if (!cleanName) {
      setFormError('Please enter your name.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setFormError('Please select a star rating between 1 and 5.');
      return;
    }
    if (!cleanReview || cleanReview.length < 5) {
      setFormError('Please write your feedback (minimum 5 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRecord = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        rating,
        review: cleanReview,
        is_approved: false,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('customer_reviews').insert([newRecord]);
        if (error) {
          console.warn('[CustomerReviews] Supabase insert warning:', error.message);
        }
      }

      try {
        const localKey = 'vediq_user_submitted_feedback';
        const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
        existing.unshift(newRecord);
        localStorage.setItem(localKey, JSON.stringify(existing));
      } catch {}

      setFormSuccess(
        'Thank you for your feedback! It will be displayed here once approved by our team.'
      );
      setName('');
      setReviewText('');
      setRating(5);
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 2500);
    } catch (err: any) {
      setFormError(err.message || 'Network error submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="py-10 sm:py-14 bg-[#0A1628] border-b border-[#1C2D4A] relative scroll-mt-20 sm:scroll-mt-24 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-1.5"
        >
          <div className="flex items-center justify-center gap-2 text-[#C9A24A]">
            <span className="w-6 h-[1px] bg-[#C9A24A]/70" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#E2C56B]">
              Customer Feedback
            </span>
            <span className="w-6 h-[1px] bg-[#C9A24A]/70" />
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F1E8] tracking-tight">
            Customer Reviews
          </h2>

          <p className="text-[#AAB4C2] text-xs sm:text-sm leading-relaxed">
            Read verified feedback from patrons who have experienced our traditional dum biryanis.
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] font-bold text-xs sm:text-sm transition-all shadow-[0_4px_16px_rgba(201,162,74,0.25)] active:scale-95 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Give Feedback</span>
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#C9A24A] animate-spin" />
            <p className="text-xs text-[#AAB4C2]">Loading customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State as explicitly requested */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto p-8 rounded-3xl bg-[#07111F] border border-[#1C2D4A] text-center space-y-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#101F35] border border-[#C9A24A]/30 flex items-center justify-center text-[#C9A24A] mx-auto">
              <Star className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#F5F1E8]">
                No reviews yet. Be the first to share your experience.
              </p>
              <p className="text-xs text-[#7E8B9B]">
                Your feedback helps us continuously perfect our royal dum recipes.
              </p>
            </div>
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 text-[#E2C56B] hover:bg-[#C9A24A] hover:text-[#07111F] text-xs font-bold transition cursor-pointer"
            >
              Share Your Review
            </button>
          </motion.div>
        ) : (
          /* Approved Reviews Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {reviews.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.1, ease: 'easeOut' }}
                className="p-6 rounded-2xl bg-[#07111F] border border-[#1C2D4A] flex flex-col justify-between space-y-4 shadow-xs hover:border-[#C9A24A]/50 transition-all duration-300 w-full"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#C9A24A]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (r.rating || 5) ? 'fill-[#C9A24A] text-[#C9A24A]' : 'text-[#1C2D4A]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#F5F1E8] leading-relaxed italic">
                    &ldquo;{r.review}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1C2D4A] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#F5F1E8]">{r.name}</h4>
                    {r.created_at && (
                      <p className="text-[10px] text-[#7E8B9B]">
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#E2C56B] bg-[#101F35] px-2 py-0.5 rounded-md border border-[#C9A24A]/30">
                    Verified Customer
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Give Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0A1628] border border-[#1C2D4A] p-6 sm:p-8 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto overflow-x-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F1E8]">
                  Share Your Experience
                </h3>
                <p className="text-xs text-[#AAB4C2] mt-1">
                  We appreciate your honest feedback on our authentic royal dum biryanis.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-[#7E8B9B] hover:text-[#F5F1E8] hover:bg-[#101F35] transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Alerts */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Feedback Form */}
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Rating Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F5F1E8] block">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none cursor-pointer transition transform hover:scale-110"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-[#C9A24A] text-[#C9A24A]'
                            : 'text-[#1C2D4A]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#E2C56B] ml-2">
                    {rating === 5 && 'Outstanding'}
                    {rating === 4 && 'Very Good'}
                    {rating === 3 && 'Good'}
                    {rating === 2 && 'Fair'}
                    {rating === 1 && 'Needs Improvement'}
                  </span>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F5F1E8] block">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] transition"
                />
              </div>

              {/* Review Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F5F1E8] block">
                  Your Review / Feedback
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about the aroma, taste, banana leaf packaging, or delivery..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs font-bold text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] font-bold text-xs transition shadow-md active:scale-95 disabled:opacity-60 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Feedback</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
