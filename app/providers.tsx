'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { DataProvider } from '@/context/DataContext';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
import OrderNotificationToasts from '@/components/OrderNotificationToasts';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Prevent unhandled Event objects (e.g. broken image load Events or network offline Events)
    // from surfacing as uncaught '{"isTrusted":true}' errors in preview environments
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error && typeof event.error === 'object' && 'isTrusted' in event.error && !event.error.message) {
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'object' && 'isTrusted' in event.reason) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ThemeProvider>
      <DataProvider>
        <CartProvider>
          <NotificationProvider>
            {children}
            <OrderNotificationToasts />
          </NotificationProvider>
        </CartProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
