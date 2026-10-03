'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CustomerOrder, OrderStatus } from '@/types/supabase';
import {
  isWebNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showWebNotification,
  playNotificationChime,
  NotificationPermissionState,
  OrderStatusNotificationPayload,
} from '@/lib/webNotifications';
import { normalizeTrackingCode } from '@/lib/tracking';

export interface OrderToastItem {
  id: string;
  orderNumber: string;
  previousStatus?: string;
  newStatus: string;
  title: string;
  message: string;
  timestamp: Date;
  customerName?: string;
  total?: number;
}

interface NotificationContextType {
  isSupported: boolean;
  permission: NotificationPermissionState;
  requestPermission: () => Promise<NotificationPermissionState>;
  toasts: OrderToastItem[];
  dismissToast: (id: string) => void;
  triggerOrderStatusAlert: (payload: OrderStatusNotificationPayload) => void;
  testNotificationAlert: (status?: 'out_for_delivery' | 'delivered') => void;
  trackOrderCode: (orderNumber: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [toasts, setToasts] = useState<OrderToastItem[]>([]);

  // Ref to track known statuses of orders to prevent duplicate alerts
  // Map of orderNumber -> lastKnownStatus
  const knownStatusMapRef = useRef<Map<string, string>>(new Map());
  const trackedCodesRef = useRef<Set<string>>(new Set());

  // Initialize permission and supported state on mount
  useEffect(() => {
    const supported = isWebNotificationSupported();
    setIsSupported(supported);
    if (supported) {
      setPermission(getNotificationPermission());
    }

    // Load previously cached user orders into knownStatusMap
    try {
      const stored: CustomerOrder[] = JSON.parse(localStorage.getItem('vediq_user_orders') || '[]');
      if (Array.isArray(stored)) {
        stored.forEach((o) => {
          const code = normalizeTrackingCode(o.order_number);
          if (code) {
            knownStatusMapRef.current.set(code, (o.order_status || 'pending').toLowerCase());
            trackedCodesRef.current.add(code);
          }
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleRequestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const trackOrderCode = useCallback((orderNumber: string) => {
    const code = normalizeTrackingCode(orderNumber);
    if (code) {
      trackedCodesRef.current.add(code);
    }
  }, []);

  // Core alert trigger
  const triggerOrderStatusAlert = useCallback(
    (payload: OrderStatusNotificationPayload) => {
      const code = normalizeTrackingCode(payload.orderNumber) || 'VB-ORDER';
      const status = (payload.newStatus || '').toLowerCase();
      const prev = (payload.previousStatus || '').toLowerCase();

      // Format title and message
      let title = `Order #${code} Status Update`;
      let message = `Your order status is now ${payload.newStatus.replace(/_/g, ' ')}.`;

      if (status === 'out_for_delivery' || status === 'dispatched') {
        title = `🚚 Order #${code} Out for Delivery!`;
        message = `Our delivery partner is on the way with your steaming dum biryani!`;
      } else if (status === 'delivered') {
        title = `🎉 Order #${code} Delivered!`;
        message = `Your royal feast has arrived! Enjoy your meal wrapped in fresh banana leaf.`;
      } else if (status === 'ready_for_delivery' || status === 'ready') {
        title = `📦 Order #${code} Ready for Pickup!`;
        message = `Your biryani is packed in 100% plastic-free eco-friendly containers.`;
      } else if (status === 'preparing') {
        title = `👨‍🍳 Order #${code} is being Prepared!`;
        message = `Our royal chefs are gently dum-steaming your biryani with pure saffron.`;
      }

      // 1. Dispatch Web Notifications API (Browser native push)
      showWebNotification(payload);

      // 2. Play subtle audio chime
      playNotificationChime(status === 'delivered' ? 'success' : 'alert');

      // 3. Add in-app Toast Alert
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: OrderToastItem = {
        id: toastId,
        orderNumber: code,
        previousStatus: payload.previousStatus,
        newStatus: payload.newStatus,
        title,
        message,
        timestamp: new Date(),
        customerName: payload.customerName,
        total: payload.total,
      };

      setToasts((prevToasts) => [newToast, ...prevToasts.slice(0, 4)]);

      // Auto-dismiss in-app toast after 8 seconds
      setTimeout(() => {
        dismissToast(toastId);
      }, 8000);

      // Update known status map
      knownStatusMapRef.current.set(code, status);

      // Update local storage user orders if found
      try {
        const stored: CustomerOrder[] = JSON.parse(localStorage.getItem('vediq_user_orders') || '[]');
        if (Array.isArray(stored)) {
          const updated = stored.map((o) => {
            if (normalizeTrackingCode(o.order_number) === code) {
              return { ...o, order_status: payload.newStatus as OrderStatus, updated_at: new Date().toISOString() };
            }
            return o;
          });
          localStorage.setItem('vediq_user_orders', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
    },
    [dismissToast]
  );

  // Test notification helper for quick live testing & preview
  const testNotificationAlert = useCallback(
    (status: 'out_for_delivery' | 'delivered' = 'out_for_delivery') => {
      const demoOrderNumber = `VB-${Math.floor(100000 + Math.random() * 900000)}`;
      triggerOrderStatusAlert({
        orderNumber: demoOrderNumber,
        previousStatus: 'pending',
        newStatus: status,
        customerName: 'Valued Guest',
        total: 549,
      });
    },
    [triggerOrderStatusAlert]
  );

  // Real-time Supabase Subscription for order status changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    try {
      const channel = supabase
        .channel('vediq-realtime-orders')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            const updated = payload.new as CustomerOrder;
            if (!updated || !updated.order_number) return;

            const code = normalizeTrackingCode(updated.order_number);
            const newStatus = (updated.order_status || '').toLowerCase();
            const oldKnownStatus = knownStatusMapRef.current.get(code) || 'pending';

            // Check if status actually transitioned and matches key states
            if (newStatus !== oldKnownStatus) {
              const isRelevantTransition =
                newStatus === 'out_for_delivery' ||
                newStatus === 'delivered' ||
                newStatus === 'ready_for_delivery' ||
                newStatus === 'preparing';

              // If it's a tracked order or relevant transition
              if (isRelevantTransition && (trackedCodesRef.current.has(code) || trackedCodesRef.current.size === 0)) {
                triggerOrderStatusAlert({
                  orderNumber: code,
                  previousStatus: oldKnownStatus,
                  newStatus: updated.order_status,
                  customerName: updated.customer_name,
                  total: updated.total,
                });
              } else {
                knownStatusMapRef.current.set(code, newStatus);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[NotificationContext] Realtime subscription notice:', err);
    }
  }, [triggerOrderStatusAlert]);

  // Client-side Polling Fallback (Polls active orders every 15 seconds)
  useEffect(() => {
    const checkActiveOrders = async () => {
      try {
        const stored: CustomerOrder[] = JSON.parse(localStorage.getItem('vediq_user_orders') || '[]');
        if (!Array.isArray(stored) || stored.length === 0) return;

        // Check active in-flight orders (pending, confirmed, preparing, ready_for_delivery, out_for_delivery)
        const inFlight = stored.filter((o) => {
          const s = (o.order_status || '').toLowerCase();
          return s !== 'delivered' && s !== 'cancelled';
        });

        for (const order of inFlight.slice(0, 3)) {
          const code = normalizeTrackingCode(order.order_number);
          if (!code) continue;

          try {
            const res = await fetch(`/api/track-order?code=${encodeURIComponent(code)}`, {
              cache: 'no-store',
            });
            const data = await res.json();
            if (res.ok && data.success && data.order) {
              const remoteOrder = data.order as CustomerOrder;
              const remoteStatus = (remoteOrder.order_status || '').toLowerCase();
              const knownStatus = knownStatusMapRef.current.get(code) || (order.order_status || 'pending').toLowerCase();

              if (remoteStatus !== knownStatus) {
                // Status changed!
                triggerOrderStatusAlert({
                  orderNumber: code,
                  previousStatus: knownStatus,
                  newStatus: remoteOrder.order_status,
                  customerName: remoteOrder.customer_name,
                  total: remoteOrder.total,
                });
              }
            }
          } catch {
            // silent catch during background poll
          }
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(checkActiveOrders, 15000);
    return () => clearInterval(interval);
  }, [triggerOrderStatusAlert]);

  return (
    <NotificationContext.Provider
      value={{
        isSupported,
        permission,
        requestPermission: handleRequestPermission,
        toasts,
        dismissToast,
        triggerOrderStatusAlert,
        testNotificationAlert,
        trackOrderCode,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useOrderNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useOrderNotifications must be used within a NotificationProvider');
  }
  return context;
}
