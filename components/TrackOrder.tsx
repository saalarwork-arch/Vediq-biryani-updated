'use client';

import React, { Suspense } from 'react';
import { useData } from '@/context/DataContext';
import OrderTrackingView from './OrderTrackingView';
import { RefreshCw } from 'lucide-react';

export default function TrackOrder() {
  const { trackOrderModalOpen, setTrackOrderModalOpen, activeTrackingOrderNumber } = useData();

  if (!trackOrderModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden w-full max-w-full bg-[#07111F] text-[#F5F1E8] animate-in fade-in duration-200">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C9A24A]" />
          </div>
        }
      >
        <OrderTrackingView
          initialCode={activeTrackingOrderNumber}
          onBack={() => setTrackOrderModalOpen(false)}
        />
      </Suspense>
    </div>
  );
}
