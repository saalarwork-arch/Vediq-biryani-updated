'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  XCircle,
  Phone,
  MapPin,
  FileText,
  Printer,
  ChevronDown,
  X,
  CreditCard,
  Calendar,
  ExternalLink,
  Compass,
  Copy,
  Check,
  Mail,
  Bell,
  Send,
} from 'lucide-react';
import { CustomerOrder, OrderStatus } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { triggerOrderStatusNotification } from '@/lib/notifications';
import { useOrderNotifications } from '@/context/NotificationContext';

interface OrdersTabProps {
  orders: CustomerOrder[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onRefresh: () => void;
  isLoading: boolean;
  selectedOrder: CustomerOrder | null;
  setSelectedOrder: (order: CustomerOrder | null) => void;
}

export default function OrdersTab({
  orders,
  onUpdateStatus,
  onRefresh,
  isLoading,
  selectedOrder,
  setSelectedOrder,
}: OrdersTabProps) {
  const { triggerOrderStatusAlert } = useOrderNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleSendManualAlert = async (order: CustomerOrder, statusToSend: OrderStatus) => {
    if (!order) return;
    setIsSendingAlert(true);
    setAlertFeedback(null);

    try {
      const res = await triggerOrderStatusNotification(order, statusToSend, {
        testMode: true,
      });

      if (res.success) {
        setAlertFeedback({
          text: `✓ Email alert dispatched to ${order.email || 'customer'} via Supabase Edge Function!`,
          success: true,
        });
      } else {
        setAlertFeedback({
          text: res.message || 'Failed to dispatch email alert.',
          success: false,
        });
      }
    } catch (err: any) {
      setAlertFeedback({
        text: err?.message || 'Error triggering notification.',
        success: false,
      });
    } finally {
      setIsSendingAlert(false);
      setTimeout(() => setAlertFeedback(null), 5000);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'all' && order.order_status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchNumber = order.order_number?.toLowerCase().includes(query);
        const matchName = order.customer_name?.toLowerCase().includes(query);
        const matchPhone = order.phone?.toLowerCase().includes(query);
        const matchAddress = order.full_address?.toLowerCase().includes(query);
        if (!matchNumber && !matchName && !matchPhone && !matchAddress) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const targetOrder = orders.find((o) => o.id === orderId) || (selectedOrder?.id === orderId ? selectedOrder : null);
      await onUpdateStatus(orderId, newStatus);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus });
      }

      if (targetOrder && (newStatus === 'out_for_delivery' || newStatus === 'delivered' || newStatus === 'ready_for_delivery')) {
        triggerOrderStatusAlert({
          orderNumber: targetOrder.order_number,
          previousStatus: targetOrder.order_status,
          newStatus,
          customerName: targetOrder.customer_name,
          total: targetOrder.total,
        });
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Order Number',
      'Customer Name',
      'Phone',
      'Address',
      'City',
      'Pincode',
      'Subtotal',
      'Delivery',
      'Discount',
      'Total',
      'Status',
      'Payment Method',
      'Payment Status',
      'Created At',
    ];
    const rows = filteredOrders.map((o) => [
      `"${o.order_number}"`,
      `"${o.customer_name}"`,
      `"${o.phone}"`,
      `"${(o.full_address || '').replace(/"/g, '""')}"`,
      `"${o.city || ''}"`,
      `"${o.pincode || ''}"`,
      o.subtotal,
      o.delivery_charge,
      o.discount,
      o.total,
      o.order_status,
      `"${o.payment_method || ''}"`,
      `"${o.payment_status || ''}"`,
      `"${o.created_at}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vediq_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Pending</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
            <span>Confirmed</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <ChefHat className="w-3 h-3 text-amber-600" />
            <span>Dum Preparing</span>
          </span>
        );
      case 'ready_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-400">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Ready for Delivery</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-500" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Cancelled</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-slate-600" />
            <span>Refunded</span>
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">Order Management</h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Track, filter, update kitchen fulfillment status, and inspect customer order slips.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DDD8CE] hover:bg-[#F8F6F0] text-xs font-bold text-[#1A1814] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export button */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF5E8] border border-[#E9DCBF] text-[#8C6418] hover:bg-[#F2EFE8] text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#EAE6DF] py-1 z-30">
                <button
                  onClick={exportCSV}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#1A1814] hover:bg-[#F8F6F0] flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#8C877E]" />
                  <span>Export to CSV Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C877E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, customer name, phone, address..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] placeholder-[#8C877E] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8C877E] hover:text-[#1A1814]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'preparing', label: 'Preparing' },
              { id: 'out_for_delivery', label: 'Out for Delivery' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#1A1814] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#5A564F] hover:bg-[#F2EFE8] border border-[#EAE6DF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-[#FAF8F5] p-8">
            <ShoppingBag className="w-10 h-10 text-[#9E7422] mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-[#1A1814]">No matching orders found</h3>
            <p className="text-xs text-[#6B665E] mt-1">
              Try adjusting your search criteria or switching the status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#6B665E] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order Details</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total & Payment</th>
                  <th className="py-3 px-4">Status & Action</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE8]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8F5] transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-sm text-[#1A1814] block">
                        {order.order_number}
                      </span>
                      <span className="text-[11px] text-[#6B665E] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-[#8C877E]" />
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {order.delivery_time && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1 border border-amber-200">
                          Slot: {order.delivery_time}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1A1814]">{order.customer_name}</p>
                      <p className="text-[11px] text-[#5A564F] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#8C877E]" />
                        {order.phone}
                      </p>
                      {order.email && (
                        <p className="text-[10px] text-[#8C6418] flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                          <Mail className="w-3 h-3 text-[#8C877E] shrink-0" />
                          <span>{order.email}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-[#6B665E] line-clamp-1 max-w-[200px] mt-0.5">
                        {order.full_address}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#1A1814] block">
                        {order.items?.length || 0} dishes
                      </span>
                      <div className="text-[11px] text-[#6B665E] space-y-0.5 max-w-[240px]">
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <p key={idx} className="truncate">
                            • {item.quantity}x {item.name} ({item.size})
                          </p>
                        ))}
                        {(order.items?.length || 0) > 2 && (
                          <p className="text-[#9E7422] font-semibold text-[10px]">
                            + {(order.items?.length || 0) - 2} more items
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-sm font-black text-[#1A1814] block">
                        {formatINR(order.total)}
                      </span>
                      <span className="text-[10px] text-[#5A564F] flex items-center gap-1 mt-0.5">
                        <CreditCard className="w-3 h-3 text-[#8C877E]" />
                        {order.payment_method}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          order.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        {getStatusBadge(order.order_status)}
                        <div>
                          <select
                            value={order.order_status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            disabled={updatingOrderId === order.id}
                            className="text-[11px] font-bold py-1 px-2 rounded-lg bg-[#FAF8F5] border border-[#DDD8CE] text-[#1A1814] focus:outline-none focus:border-[#C59A3F] cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Dum Preparing</option>
                            <option value="ready_for_delivery">Ready for Delivery</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/track?code=${encodeURIComponent(order.order_number)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white border border-[#DDD8CE] hover:bg-[#FAF8F5] text-[#5A564F] hover:text-[#9E7422] text-xs transition cursor-pointer shadow-xs"
                          title="Track Live as Customer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-xl bg-[#FAF5E8] hover:bg-[#F2EFE8] text-[#9E7422] font-bold text-xs transition cursor-pointer shadow-xs"
                          title="View Full Order & Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF5E8] border border-[#E9DCBF] text-[#9E7422] flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1814]">
                    Order #{selectedOrder.order_number}
                  </h3>
                  <p className="text-xs text-[#6B665E]">
                    Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-[#8C877E] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Status Update Quick Bar in Modal */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#6B665E] uppercase tracking-wider block">
                    Current Fulfillment Status
                  </span>
                  <div className="mt-1">{getStatusBadge(selectedOrder.order_status)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1A1814]">Change Status:</span>
                  <select
                    value={selectedOrder.order_status}
                    onChange={(e) =>
                      handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                    }
                    className="text-xs font-bold py-1.5 px-3 rounded-xl bg-white border border-[#DDD8CE] text-[#1A1814] focus:outline-none focus:border-[#C59A3F] cursor-pointer shadow-xs"
                  >
                    <option value="pending">Pending (Order Placed)</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Dum Preparing</option>
                    <option value="ready_for_delivery">Ready for Delivery</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              {/* Tracking Code and Customer Tracking Quick Strip */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                    Customer Tracking Code:
                  </span>
                  <span className="font-mono font-bold text-xs text-[#8C6418] bg-white px-2.5 py-1 rounded-lg border border-amber-200 select-all">
                    {selectedOrder.tracking_code || selectedOrder.order_number}
                  </span>
                </div>
                <a
                  href={`/track?code=${encodeURIComponent(selectedOrder.order_number)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-[#8C6418] hover:bg-[#FAF5E8] transition cursor-pointer shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5 text-[#9E7422]" />
                  <span>Open Customer Tracking Page</span>
                  <ExternalLink className="w-3 h-3 text-[#8C877E]" />
                </a>
              </div>

              {/* Email Alerts & Supabase Edge Function Strip */}
              <div className="p-3.5 rounded-2xl bg-[#F0F5FA] border border-[#D0E0EE] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#2B5C8F]" />
                    <div>
                      <span className="text-[11px] font-bold text-[#1F3D5C] block">
                        Customer Email Alerts (Supabase Edge Function)
                      </span>
                      <p className="text-[10px] text-[#55718D]">
                        Recipient: <strong className="font-mono text-[#1F3D5C]">{selectedOrder.email || 'None on file'}</strong> · Alerts sent for Ready & Out for Delivery
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendManualAlert(
                        selectedOrder,
                        selectedOrder.order_status === 'out_for_delivery'
                          ? 'out_for_delivery'
                          : 'ready_for_delivery'
                      )
                    }
                    disabled={isSendingAlert || !selectedOrder.email}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#B0CEE6] hover:bg-[#E4EEF7] text-xs font-bold text-[#1F3D5C] transition cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                    title="Send instant email alert via Supabase Edge Function"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingAlert ? 'animate-pulse' : ''}`} />
                    <span>{isSendingAlert ? 'Sending...' : 'Trigger Edge Alert'}</span>
                  </button>
                </div>

                {alertFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      alertFeedback.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    <span>{alertFeedback.text}</span>
                  </div>
                )}
              </div>

              {/* Status History & Timestamps (100% Real from Database) */}
              <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#EAE6DF] space-y-2">
                <span className="text-[10px] font-bold text-[#6B665E] uppercase tracking-wider block">
                  Status History & Timestamps
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white border border-[#EAE6DF]">
                    <span className="text-[10px] text-[#8C877E] font-bold block">1. Order Placed</span>
                    <span className="font-mono text-[#1A1814] text-[11px]">
                      {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#EAE6DF]">
                    <span className="text-[10px] text-[#8C877E] font-bold block">
                      Current State ({selectedOrder.order_status.replace(/_/g, ' ')})
                    </span>
                    <span className="font-mono text-[#1A1814] text-[11px]">
                      {selectedOrder.updated_at
                        ? new Date(selectedOrder.updated_at).toLocaleString('en-IN')
                        : new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer and Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#EAE6DF] space-y-2">
                  <h4 className="font-bold text-[#1A1814] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#9E7422]" /> Customer Details
                  </h4>
                  <p className="font-bold text-sm text-[#1A1814]">{selectedOrder.customer_name}</p>
                  <p className="text-[#5A564F]">Phone: {selectedOrder.phone}</p>
                  {selectedOrder.email && <p className="text-[#5A564F]">Email: {selectedOrder.email}</p>}
                </div>

                <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#EAE6DF] space-y-2">
                  <h4 className="font-bold text-[#1A1814] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9E7422]" /> Delivery Address
                  </h4>
                  <p className="text-[#1A1814] leading-relaxed">{selectedOrder.full_address}</p>
                  <p className="text-[#6B665E]">
                    {selectedOrder.city || 'Ghaziabad'}, {selectedOrder.state || 'Uttar Pradesh'} - {selectedOrder.pincode || '201012'}
                  </p>
                  {selectedOrder.delivery_time && (
                    <p className="text-amber-800 font-semibold text-[11px]">
                      Selected Delivery Slot: {selectedOrder.delivery_time}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#1A1814] uppercase tracking-wider text-[11px]">
                  Ordered Items & Accompaniments
                </h4>
                <div className="border border-[#EAE6DF] rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#6B665E]">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Portion / Size</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EFE8]">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-semibold text-[#1A1814]">{item.name}</td>
                          <td className="py-2.5 px-3 text-[#6B665E]">{item.size}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#1A1814]">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-[#5A564F]">{formatINR(item.price)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#1A1814]">
                            {formatINR(item.total || item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                      {selectedOrder.extras?.map((extra, idx) => (
                        <tr key={`extra-${idx}`} className="bg-[#FAF8F5]/50">
                          <td className="py-2 px-3 text-[#5A564F] italic">+ {extra.name}</td>
                          <td className="py-2 px-3 text-[#8C877E] text-[11px]">Accompaniment</td>
                          <td className="py-2 px-3 text-center text-[#5A564F]">{extra.quantity}</td>
                          <td className="py-2 px-3 text-right text-[#5A564F]">{formatINR(extra.price)}</td>
                          <td className="py-2 px-3 text-right font-medium text-[#1A1814]">
                            {formatINR(extra.total || extra.price * extra.quantity)}
                          </td>
                        </tr>
                      ))}
                      {selectedOrder.complimentary_items?.map((comp, idx) => (
                        <tr key={`comp-${idx}`} className="bg-[#FFFDF5]">
                          <td className="py-2 px-3 font-semibold text-[#8C6418]">🎁 {comp.name}</td>
                          <td className="py-2 px-3 text-[#8C6418] font-bold text-[11px]">{comp.quantityText}</td>
                          <td className="py-2 px-3 text-center text-[#8C6418] font-bold">1</td>
                          <td className="py-2 px-3 text-right text-[#8C6418] font-bold">FREE</td>
                          <td className="py-2 px-3 text-right font-bold text-[#8C6418]">₹0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.customer_notes && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                    Customer Special Request / Notes:
                  </p>
                  <p className="text-amber-800 text-xs mt-1">{selectedOrder.customer_notes}</p>
                </div>
              )}

              {/* Bill Summary */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-1.5 ml-auto max-w-xs text-xs">
                <div className="flex justify-between text-[#6B665E]">
                  <span>Items Subtotal:</span>
                  <span>{formatINR(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6B665E]">
                  <span>Delivery Fee:</span>
                  <span>{selectedOrder.delivery_charge === 0 ? 'FREE' : formatINR(selectedOrder.delivery_charge)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-[#059669] font-semibold">
                    <span>Discount Applied:</span>
                    <span>- {formatINR(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-[#1A1814] pt-2 border-t border-[#EAE6DF]">
                  <span>Grand Total:</span>
                  <span>{formatINR(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#DDD8CE] text-xs font-bold text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#9E7422]" />
                <span>Print Kitchen Receipt</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-[#1A1814] text-white text-xs font-bold hover:bg-black transition cursor-pointer shadow-xs"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
