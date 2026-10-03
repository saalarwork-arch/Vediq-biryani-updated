'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0F1410] flex flex-col items-center justify-center p-6 text-center text-[#FAF7F2]">
      <div className="w-16 h-16 rounded-3xl bg-[#3B1919] border border-[#7F2626] flex items-center justify-center text-[#EF4444] mb-6 shadow-xl">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="font-serif text-3xl font-bold mb-2">Something went wrong</h2>
      <p className="text-xs text-[#8EA393] max-w-md mb-6">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C59A3F] text-[#0F1410] font-bold text-xs hover:bg-[#D4A94D] transition cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
