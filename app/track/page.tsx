import React, { Suspense } from 'react';
import { Metadata } from 'next';
import OrderTrackingView from '@/components/OrderTrackingView';
import { RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Track Your Order | Vediq Biryani Ghaziabad',
  description: 'Live real-time slow-dum cooking, packaging, and doorstep delivery tracking for Vediq Biryani orders.',
};

function TrackingPageFallback() {
  return (
    <div className="min-h-screen bg-[#07111F] text-[#F5F1E8] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B] animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin text-[#C9A24A]" />
        </div>
        <p className="text-xs font-bold text-[#E2C56B] uppercase tracking-wider">
          Connecting to Royal Kitchen Tracker...
        </p>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<TrackingPageFallback />}>
      <OrderTrackingView isStandalonePage={true} />
    </Suspense>
  );
}
