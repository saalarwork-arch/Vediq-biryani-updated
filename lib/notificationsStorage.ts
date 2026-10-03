import fs from 'node:fs';
import path from 'node:path';

export interface OrderNotificationRecord {
  order_number: string;
  notify_email: boolean;
  email: string;
  customer_name?: string;
  updated_at: string;
  history?: Array<{
    status: string;
    sent_at: string;
    success: boolean;
    subject?: string;
  }>;
}

const localFilePath = path.join(process.cwd(), 'data', 'order-notifications.json');

function readStorage(): Record<string, OrderNotificationRecord> {
  try {
    if (fs.existsSync(localFilePath)) {
      const content = fs.readFileSync(localFilePath, 'utf8');
      const parsed = JSON.parse(content || '{}');
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    }
  } catch {}
  return {};
}

function writeStorage(data: Record<string, OrderNotificationRecord>): void {
  try {
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[NotificationStorage] Write error:', err);
  }
}

export function getOrderNotificationPreference(
  orderNumber: string
): OrderNotificationRecord | null {
  if (!orderNumber) return null;
  const store = readStorage();
  const normalizedKey = orderNumber.trim().toUpperCase();
  return store[normalizedKey] || null;
}

export function setOrderNotificationPreference(
  orderNumber: string,
  notifyEmail: boolean,
  email: string,
  customerName?: string
): OrderNotificationRecord {
  const store = readStorage();
  const normalizedKey = orderNumber.trim().toUpperCase();
  const existing = store[normalizedKey];

  const updated: OrderNotificationRecord = {
    order_number: normalizedKey,
    notify_email: notifyEmail,
    email: email.trim().toLowerCase(),
    customer_name: customerName || existing?.customer_name,
    updated_at: new Date().toISOString(),
    history: existing?.history || [],
  };

  store[normalizedKey] = updated;
  writeStorage(store);
  return updated;
}

export function recordNotificationDispatch(
  orderNumber: string,
  status: string,
  success: boolean,
  subject?: string
): void {
  const store = readStorage();
  const normalizedKey = orderNumber.trim().toUpperCase();
  if (!store[normalizedKey]) {
    store[normalizedKey] = {
      order_number: normalizedKey,
      notify_email: true,
      email: '',
      updated_at: new Date().toISOString(),
      history: [],
    };
  }

  store[normalizedKey].history = store[normalizedKey].history || [];
  store[normalizedKey].history!.push({
    status,
    sent_at: new Date().toISOString(),
    success,
    subject,
  });

  writeStorage(store);
}
