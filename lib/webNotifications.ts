/**
 * Web Notifications API & Audio Chime Helper for Vediq Biryani
 * Handles browser push notifications, permissions, and audio alerts for order status transitions.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface OrderStatusNotificationPayload {
  orderNumber: string;
  previousStatus?: string;
  newStatus: string;
  customerName?: string;
  total?: number;
  trackingCode?: string;
}

/**
 * Check if the Web Notifications API is supported in current browser
 */
export function isWebNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isWebNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isWebNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[WebNotifications] Permission request error:', err);
    return Notification.permission;
  }
}

/**
 * Play a gentle, elegant acoustic chime using Web Audio API (zero external assets required)
 */
export function playNotificationChime(type: 'success' | 'alert' = 'alert') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Golden melody chords: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.24);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      // Delivery Alert: 587.33Hz (D5) -> 880Hz (A5)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (err) {
    // Non-blocking fallback if browser policy restricts audio
    console.debug('[WebNotifications] Audio context playback note:', err);
  }
}

/**
 * Format notification title and message body for order status transitions
 */
export function getNotificationContent(payload: OrderStatusNotificationPayload): {
  title: string;
  body: string;
  icon: string;
  tag: string;
  urgency: 'high' | 'normal';
} {
  const code = payload.orderNumber || payload.trackingCode || 'VB-ORDER';
  const statusLower = (payload.newStatus || '').toLowerCase();

  if (statusLower === 'out_for_delivery' || statusLower === 'dispatched') {
    return {
      title: `🚚 Order #${code} is Out for Delivery!`,
      body: `Your royal biryani feast is on the way! Our delivery partner has picked up your fresh hot order.`,
      icon: '/images/vediq-logo-transparent.png',
      tag: `order-${code}-out-for-delivery`,
      urgency: 'high',
    };
  }

  if (statusLower === 'delivered') {
    return {
      title: `🎉 Order #${code} Delivered!`,
      body: `Your Vediq Biryani order has been delivered! Enjoy the authentic royal dum flavors in fresh banana leaf.`,
      icon: '/images/vediq-logo-transparent.png',
      tag: `order-${code}-delivered`,
      urgency: 'high',
    };
  }

  if (statusLower === 'ready_for_delivery' || statusLower === 'ready') {
    return {
      title: `📦 Order #${code} Ready for Pickup!`,
      body: `Your biryani has finished traditional dum steaming and is packed in 100% plastic-free containers.`,
      icon: '/images/vediq-logo-transparent.png',
      tag: `order-${code}-ready`,
      urgency: 'normal',
    };
  }

  if (statusLower === 'preparing') {
    return {
      title: `👨‍🍳 Order #${code} is being Prepared!`,
      body: `Our royal chefs are slow-steaming your biryani with aged basmati rice and pure saffron.`,
      icon: '/images/vediq-logo-transparent.png',
      tag: `order-${code}-preparing`,
      urgency: 'normal',
    };
  }

  return {
    title: `🔔 Order #${code} Status Update: ${payload.newStatus}`,
    body: `Your order status has been updated to ${payload.newStatus.replace(/_/g, ' ')}.`,
    icon: '/images/vediq-logo-transparent.png',
    tag: `order-${code}-${statusLower}`,
    urgency: 'normal',
  };
}

/**
 * Dispatch a native Web Notification via the browser Notifications API
 */
export function showWebNotification(
  payload: OrderStatusNotificationPayload,
  onNotificationClick?: () => void
): Notification | null {
  if (!isWebNotificationSupported()) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const { title, body, icon, tag } = getNotificationContent(payload);

    playNotificationChime(
      payload.newStatus.toLowerCase() === 'delivered' ? 'success' : 'alert'
    );

    const options: any = {
      body,
      icon,
      badge: icon,
      tag,
      renotify: true,
      requireInteraction: payload.newStatus.toLowerCase() === 'out_for_delivery',
      data: {
        orderNumber: payload.orderNumber,
        url: `/track?code=${encodeURIComponent(payload.orderNumber)}`,
      },
    };

    const notification = new Notification(title, options);

    notification.onclick = function (event) {
      event.preventDefault();
      window.focus();

      if (onNotificationClick) {
        onNotificationClick();
      } else {
        const targetUrl = `/track?code=${encodeURIComponent(payload.orderNumber)}`;
        if (window.location.pathname !== '/track') {
          window.location.href = targetUrl;
        }
      }

      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('[WebNotifications] Error displaying native notification:', err);
    return null;
  }
}
