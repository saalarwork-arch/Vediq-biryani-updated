import { CustomerOrder, OrderStatus } from '@/types/supabase';

/**
 * Generate a unique, cryptographically random customer tracking code.
 * Example format: VEDIQ-8K4M9X
 * Unguessable, non-sequential, and easy for customers to read and copy.
 */
export function generateTrackingCode(): string {
  // 32-character alphabet omitting easily confused chars (0, O, 1, I)
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const length = 6;
  let randomPart = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      randomPart += alphabet[bytes[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      randomPart += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }

  return `VEDIQ-${randomPart}`;
}

export interface StatusStepInfo {
  key: OrderStatus;
  label: string;
  shortLabel: string;
  description: string;
  iconName: 'clock' | 'check' | 'chef' | 'package' | 'truck' | 'check-circle' | 'x-circle' | 'alert' | 'dollar';
}

export const ORDER_PROGRESS_STEPS: StatusStepInfo[] = [
  {
    key: 'pending',
    label: 'Order Placed',
    shortLabel: 'Placed',
    description: 'Order received and waiting for kitchen confirmation.',
    iconName: 'clock',
  },
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    shortLabel: 'Confirmed',
    description: 'Order confirmed. Chef preparing royal ingredients & clay handi.',
    iconName: 'check',
  },
  {
    key: 'preparing',
    label: 'Slow Dum Cooking',
    shortLabel: 'Dum Cooking',
    description: 'Layered with fragrant basmati & royal spices, sealed on charcoal dum.',
    iconName: 'chef',
  },
  {
    key: 'ready_for_delivery',
    label: 'Packed in Handi',
    shortLabel: 'Packed',
    description: 'Clay handi sealed with wheat dough, packed hot with accompaniments.',
    iconName: 'package',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    shortLabel: 'Out for Delivery',
    description: 'Our delivery valet is en route to your doorstep.',
    iconName: 'truck',
  },
  {
    key: 'delivered',
    label: 'Order Delivered',
    shortLabel: 'Delivered',
    description: 'Delivered piping hot. Savor your royal dum feast!',
    iconName: 'check-circle',
  },
];

export interface TimelineEvent {
  key: OrderStatus;
  label: string;
  description: string;
  timestamp: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
}

/**
 * Returns the timeline events for an order with 100% REAL timestamps.
 * A timestamp is only shown if it actually occurred and is stored.
 * Never invents fake timestamps.
 */
export function buildOrderTimeline(order: CustomerOrder): {
  steps: TimelineEvent[];
  currentStepIndex: number;
  isTerminal: boolean;
  terminalStatus?: {
    key: OrderStatus;
    label: string;
    description: string;
    timestamp: string | null;
  };
} {
  const currentStatus = order.order_status;
  const isTerminal = ['cancelled', 'failed', 'refunded'].includes(currentStatus);

  if (isTerminal) {
    let termLabel = 'Order Cancelled';
    let termDesc = 'This order was cancelled.';
    if (currentStatus === 'failed') {
      termLabel = 'Order / Payment Failed';
      termDesc = 'The order could not be completed or payment failed.';
    } else if (currentStatus === 'refunded') {
      termLabel = 'Order Refunded';
      termDesc = 'This order was refunded to the original payment source.';
    }

    return {
      steps: [],
      currentStepIndex: -1,
      isTerminal: true,
      terminalStatus: {
        key: currentStatus,
        label: termLabel,
        description: termDesc,
        timestamp: order.updated_at || order.created_at || null,
      },
    };
  }

  // Find index of current status in standard progression
  let currentIdx = ORDER_PROGRESS_STEPS.findIndex((s) => s.key === currentStatus);
  if (currentIdx === -1) {
    currentIdx = 0; // fallback to pending
  }

  // Build steps
  const steps: TimelineEvent[] = ORDER_PROGRESS_STEPS.map((step, idx) => {
    const isCompleted = idx < currentIdx;
    const isCurrent = idx === currentIdx;
    const isUpcoming = idx > currentIdx;

    let timestamp: string | null = null;

    // Check if order has explicit status_history array
    if (Array.isArray(order.status_history)) {
      const historyEntry = order.status_history.find((h) => h.status === step.key);
      if (historyEntry && historyEntry.timestamp) {
        timestamp = historyEntry.timestamp;
      }
    }

    // Authentic timestamp fallbacks from real DB columns
    if (!timestamp) {
      if (idx === 0) {
        // Step 0: Order Placed always occurred at order.created_at
        timestamp = order.created_at || null;
      } else if (isCurrent && order.updated_at && order.updated_at !== order.created_at) {
        // Current status occurred at updated_at if different from creation
        timestamp = order.updated_at;
      }
    }

    // Strictly ensure upcoming steps NEVER have a timestamp
    if (isUpcoming) {
      timestamp = null;
    }

    return {
      key: step.key,
      label: step.label,
      description: step.description,
      timestamp,
      isCompleted,
      isCurrent,
      isUpcoming,
    };
  });

  return {
    steps,
    currentStepIndex: currentIdx,
    isTerminal: false,
  };
}

/**
 * Format a status key into a human readable title
 */
export function getStatusLabel(status: OrderStatus | string): string {
  switch (status) {
    case 'pending':
      return 'Order Placed';
    case 'confirmed':
      return 'Order Confirmed';
    case 'preparing':
      return 'Slow Dum Cooking';
    case 'ready_for_delivery':
      return 'Packed in Handi';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'failed':
      return 'Failed';
    case 'refunded':
      return 'Refunded';
    default:
      return status?.replace(/_/g, ' ') || 'Unknown';
  }
}

/**
 * Clean and normalize a tracking code query
 */
export function normalizeTrackingCode(code: string): string {
  if (!code) return '';
  return code.trim().replace(/^#+/, '').toUpperCase();
}
