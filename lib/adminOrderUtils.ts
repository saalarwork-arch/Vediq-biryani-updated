import { CustomerOrder, OrderStatus } from '@/types/supabase';
import { formatINR } from './utils';

export type AdminOrderCategory =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderCategoryConfig {
  key: AdminOrderCategory;
  label: string;
  shortLabel: string;
  description: string;
  dbStatus: OrderStatus;
  matchingStatuses: string[];
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
}

export const ORDER_CATEGORIES: OrderCategoryConfig[] = [
  {
    key: 'new',
    label: 'New / Received Orders',
    shortLabel: 'New Orders',
    description: 'Newly placed orders awaiting acceptance or preparation.',
    dbStatus: 'pending',
    matchingStatuses: ['pending', 'new', 'received'],
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
    accentColor: '#F59E0B',
  },
  {
    key: 'confirmed',
    label: 'Confirmed Orders',
    shortLabel: 'Confirmed',
    description: 'Orders accepted by the admin and queued for kitchen.',
    dbStatus: 'confirmed',
    matchingStatuses: ['confirmed'],
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/30',
    accentColor: '#3B82F6',
  },
  {
    key: 'preparing',
    label: 'Preparing Orders',
    shortLabel: 'Preparing',
    description: 'Slow-cooking on royal dum in authentic handis.',
    dbStatus: 'preparing',
    matchingStatuses: ['preparing', 'cooking'],
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/30',
    accentColor: '#8B5CF6',
  },
  {
    key: 'ready',
    label: 'Ready Orders',
    shortLabel: 'Ready',
    description: 'Packed hot in natural banana leaf, ready for dispatch or pickup.',
    dbStatus: 'ready_for_delivery',
    matchingStatuses: ['ready_for_delivery', 'ready'],
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/30',
    accentColor: '#14B8A6',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    shortLabel: 'Out for Delivery',
    description: 'Dispatched with delivery valet to customer doorstep.',
    dbStatus: 'out_for_delivery',
    matchingStatuses: ['out_for_delivery', 'dispatched'],
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/30',
    accentColor: '#F97316',
  },
  {
    key: 'delivered',
    label: 'Delivered Orders',
    shortLabel: 'Delivered',
    description: 'Successfully handed over to customer.',
    dbStatus: 'delivered',
    matchingStatuses: ['delivered', 'completed'],
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    accentColor: '#10B981',
  },
  {
    key: 'cancelled',
    label: 'Cancelled Orders',
    shortLabel: 'Cancelled',
    description: 'Cancelled or rejected orders.',
    dbStatus: 'cancelled',
    matchingStatuses: ['cancelled', 'failed', 'rejected'],
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/30',
    accentColor: '#EF4444',
  },
];

/**
 * Returns which category an order belongs to based on its current status
 */
export function getOrderCategory(order: CustomerOrder): AdminOrderCategory {
  const status = (order.order_status || 'pending').toLowerCase();
  for (const cat of ORDER_CATEGORIES) {
    if (cat.matchingStatuses.includes(status)) {
      return cat.key;
    }
  }
  return 'new';
}

/**
 * Valid workflow transitions definition
 */
export interface StatusTransition {
  nextStatus: OrderStatus;
  label: string;
  description: string;
  buttonClass: string;
  requiresReason?: boolean;
}

export function getValidTransitions(currentStatus: OrderStatus): StatusTransition[] {
  const normalized = (currentStatus || 'pending').toLowerCase();

  switch (normalized) {
    case 'pending':
    case 'new':
    case 'received':
      return [
        {
          nextStatus: 'confirmed',
          label: 'Accept & Confirm Order',
          description: 'Acknowledge order and move to preparation queue',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white',
        },
        {
          nextStatus: 'preparing',
          label: 'Directly Start Dum Cooking',
          description: 'Send order directly to kitchen handis',
          buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white',
        },
        {
          nextStatus: 'cancelled',
          label: 'Cancel Order',
          description: 'Reject or cancel this order',
          buttonClass: 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50',
          requiresReason: true,
        },
      ];

    case 'confirmed':
      return [
        {
          nextStatus: 'preparing',
          label: 'Start Dum Cooking',
          description: 'Kitchen has begun slow-dum preparation',
          buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white',
        },
        {
          nextStatus: 'ready_for_delivery',
          label: 'Mark as Ready & Packed',
          description: 'Sealed in banana leaf, ready for dispatch',
          buttonClass: 'bg-teal-600 hover:bg-teal-500 text-white',
        },
        {
          nextStatus: 'cancelled',
          label: 'Cancel Order',
          description: 'Cancel order before kitchen dispatch',
          buttonClass: 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50',
          requiresReason: true,
        },
      ];

    case 'preparing':
      return [
        {
          nextStatus: 'ready_for_delivery',
          label: 'Mark as Ready for Pickup / Dispatch',
          description: 'Food is prepared and packed with royal accompaniments',
          buttonClass: 'bg-teal-600 hover:bg-teal-500 text-white',
        },
        {
          nextStatus: 'out_for_delivery',
          label: 'Handover to Valet (Out for Delivery)',
          description: 'Dispatch immediately to customer address',
          buttonClass: 'bg-orange-600 hover:bg-orange-500 text-white',
        },
        {
          nextStatus: 'cancelled',
          label: 'Cancel Order',
          description: 'Emergency cancellation during preparation',
          buttonClass: 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50',
          requiresReason: true,
        },
      ];

    case 'ready_for_delivery':
    case 'ready':
      return [
        {
          nextStatus: 'out_for_delivery',
          label: 'Dispatch (Out for Delivery)',
          description: 'Delivery partner has picked up the hot package',
          buttonClass: 'bg-orange-600 hover:bg-orange-500 text-white',
        },
        {
          nextStatus: 'delivered',
          label: 'Mark as Delivered (Takeaway/Direct)',
          description: 'Customer received package at counter or doorstep',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        },
        {
          nextStatus: 'cancelled',
          label: 'Cancel Order',
          description: 'Cancel order',
          buttonClass: 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50',
          requiresReason: true,
        },
      ];

    case 'out_for_delivery':
    case 'dispatched':
      return [
        {
          nextStatus: 'delivered',
          label: 'Mark as Delivered',
          description: 'Customer successfully received food at doorstep',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        },
        {
          nextStatus: 'cancelled',
          label: 'Mark Delivery Failed / Cancelled',
          description: 'Customer unreachable or returned',
          buttonClass: 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50',
          requiresReason: true,
        },
      ];

    case 'delivered':
      return []; // Terminal state

    case 'cancelled':
      return []; // Terminal state

    default:
      return [
        {
          nextStatus: 'confirmed',
          label: 'Confirm Order',
          description: 'Move to confirmed',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white',
        },
      ];
  }
}

/**
 * Play an audible multi-tone chime for newly received orders in the admin panel
 * Uses Web Audio API without any external dependencies or network assets.
 */
export function playAdminNewOrderChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Create 3-note ascending fanfare chime: 587.33Hz (D5), 739.99Hz (F#5), 880.00Hz (A5)
    const notes = [
      { freq: 587.33, start: 0.0, dur: 0.16 },
      { freq: 739.99, start: 0.14, dur: 0.18 },
      { freq: 880.00, start: 0.30, dur: 0.40 },
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(0.25, now + note.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    });
  } catch (err) {
    console.debug('[playAdminNewOrderChime] Audio note:', err);
  }
}

/**
 * Formats a clean CSV string for order exports
 */
export function generateOrdersCSV(orders: CustomerOrder[]): string {
  const headers = [
    'Order ID',
    'Created At',
    'Customer Name',
    'Phone',
    'Email',
    'Delivery Address',
    'City',
    'State',
    'Pincode',
    'Delivery Slot',
    'Items Summary',
    'Item Count',
    'Subtotal (INR)',
    'Delivery Charge (INR)',
    'Discount (INR)',
    'Grand Total (INR)',
    'Order Status',
    'Payment Method',
    'Payment Status',
    'Customer Notes',
  ];

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = orders.map((o) => {
    const itemsSummary = (o.items || [])
      .map((it) => `${it.quantity}x ${it.name} (${it.size || 'Standard'})`)
      .join('; ');
    const itemCount = (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

    return [
      escapeCSV(o.order_number || o.id),
      escapeCSV(o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : ''),
      escapeCSV(o.customer_name),
      escapeCSV(o.phone),
      escapeCSV(o.email || ''),
      escapeCSV(o.full_address),
      escapeCSV(o.city || 'Ghaziabad'),
      escapeCSV(o.state || 'Uttar Pradesh'),
      escapeCSV(o.pincode || ''),
      escapeCSV(o.delivery_time || 'Standard'),
      escapeCSV(itemsSummary),
      escapeCSV(itemCount),
      escapeCSV(o.subtotal || 0),
      escapeCSV(o.delivery_charge || 0),
      escapeCSV(o.discount || 0),
      escapeCSV(o.total || 0),
      escapeCSV(o.order_status),
      escapeCSV(o.payment_method || 'Cash on Delivery'),
      escapeCSV(o.payment_status || 'pending'),
      escapeCSV(o.customer_notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers a download of the CSV content in the browser
 */
export function downloadCSVFile(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
