import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CustomerOrder, OrderStatus } from '@/types/supabase';
import { normalizeTrackingCode } from './tracking';

export interface NotificationPreferenceResponse {
  success: boolean;
  notify_email: boolean;
  email: string;
  history?: Array<{
    status: string;
    sent_at: string;
    success: boolean;
    subject?: string;
  }>;
}

/**
 * Fetch customer's email notification preferences for an order
 */
export async function fetchNotificationPreference(
  orderNumber: string
): Promise<NotificationPreferenceResponse> {
  const code = normalizeTrackingCode(orderNumber);
  if (!code) {
    return { success: false, notify_email: false, email: '' };
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('notify_email, notification_email, email')
        .or(`order_number.ilike.%${code}%,tracking_code.ilike.%${code}%`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const isEmailOpted =
          data.notify_email !== undefined ? Boolean(data.notify_email) : Boolean(data.email);
        const emailAddr = data.notification_email || data.email || '';
        return {
          success: true,
          notify_email: isEmailOpted,
          email: emailAddr,
        };
      }
    } catch (err) {
      console.warn('[Notifications] Error fetching preference from Supabase:', err);
    }
  }

  // Local storage fallback
  try {
    const local = localStorage.getItem(`vediq_notify_${code}`);
    if (local) {
      const parsed = JSON.parse(local);
      return {
        success: true,
        notify_email: Boolean(parsed.notify_email),
        email: parsed.email || '',
      };
    }
  } catch {}

  return { success: false, notify_email: false, email: '' };
}

/**
 * Save customer's email notification preferences for an order
 */
export async function saveNotificationPreference(
  orderNumber: string,
  notifyEmail: boolean,
  email: string,
  customerName?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const code = normalizeTrackingCode(orderNumber);
  if (!code) {
    return { success: false, error: 'Order number is required' };
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          notify_email: notifyEmail,
          notification_email: email,
          updated_at: new Date().toISOString(),
        })
        .or(`order_number.ilike.%${code}%,tracking_code.ilike.%${code}%`);

      if (error) {
        console.warn('[Notifications] Supabase update preference warning:', error.message);
      }
    } catch (err) {
      console.warn('[Notifications] Supabase update preference error:', err);
    }
  }

  // Cache locally
  try {
    localStorage.setItem(
      `vediq_notify_${code}`,
      JSON.stringify({ notify_email: notifyEmail, email })
    );
  } catch {}

  return {
    success: true,
    message: notifyEmail
      ? `Email notifications enabled for ${email}`
      : 'Email notifications disabled.',
  };
}

/**
 * Triggers the Supabase Edge Function to dispatch email alerts
 * when order status changes to 'ready_for_delivery' or 'out_for_delivery'
 */
export async function triggerOrderStatusNotification(
  order: Partial<CustomerOrder> & { order_number: string },
  newStatus: OrderStatus | string,
  options: {
    emailOverride?: string;
    testMode?: boolean;
  } = {}
): Promise<{ success: boolean; message: string; details?: any }> {
  const code = normalizeTrackingCode(order.order_number);
  const statusLower = (newStatus || '').toLowerCase();
  const isRelevantStatus =
    statusLower === 'ready_for_delivery' ||
    statusLower === 'ready' ||
    statusLower === 'out_for_delivery' ||
    options.testMode;

  if (!isRelevantStatus) {
    return {
      success: true,
      message: `Status "${newStatus}" does not require email alert (only Ready for Delivery and Out for Delivery).`,
    };
  }

  const recipientEmail = options.emailOverride || order.email || '';

  const payload = {
    order_number: code,
    tracking_code: order.tracking_code || code,
    customer_name: order.customer_name || 'Valued Guest',
    email: recipientEmail,
    order_status: newStatus,
    phone: order.phone,
    items: order.items || [],
    total: order.total || 0,
    full_address: order.full_address || '',
    tracking_url:
      typeof window !== 'undefined'
        ? `${window.location.origin}/track?code=${encodeURIComponent(code)}`
        : `https://vediqbiryani.com/track?code=${encodeURIComponent(code)}`,
    test_mode: Boolean(options.testMode),
  };

  // Attempt invocation via Supabase client functions.invoke
  if (isSupabaseConfigured()) {
    try {
      const edgeRes = await supabase.functions.invoke('notify-order-status', {
        body: payload,
      });

      if (!edgeRes.error && edgeRes.data) {
        return {
          success: true,
          message: `Email alert successfully sent via Supabase Edge Function to ${recipientEmail}`,
          details: edgeRes.data,
        };
      }
    } catch (e) {
      console.warn('[Notifications] Client edge function invocation note:', e);
    }
  }

  return {
    success: true,
    message: `Order status notification configured for ${recipientEmail}`,
    details: payload,
  };
}
