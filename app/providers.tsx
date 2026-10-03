'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { DataProvider } from '@/context/DataContext';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
import OrderNotificationToasts from '@/components/OrderNotificationToasts';

export function Providers({ children }: { children: React.ReactNode }) {
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
