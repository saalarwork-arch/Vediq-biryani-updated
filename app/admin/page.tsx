'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Menu,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  Store,
  Bell,
  Volume2,
  VolumeX,
  X,
  ShoppingBag,
  ArrowRight,
  DollarSign,
  BarChart3,
  Smartphone,
  Download,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CustomerOrder, AdminUser, OrderStatus, MenuItem } from '@/types/supabase';
import { formatINR } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { triggerOrderStatusNotification } from '@/lib/notifications';
import {
  AdminOrderCategory,
  getOrderCategory,
  playAdminNewOrderChime,
} from '@/lib/adminOrderUtils';
import { useAdminPWA } from '@/hooks/useAdminPWA';

import AdminSidebar, { AdminTab } from '@/components/admin/AdminSidebar';
import DashboardTab from '@/components/admin/DashboardTab';
import OrdersTab from '@/components/admin/OrdersTab';
import ReportsTab from '@/components/admin/ReportsTab';
import ProductsTab from '@/components/admin/ProductsTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import GalleryTab from '@/components/admin/GalleryTab';
import HeroTab from '@/components/admin/HeroTab';
import OffersTab from '@/components/admin/OffersTab';
import MediaTab from '@/components/admin/MediaTab';
import SettingsTab from '@/components/admin/SettingsTab';
import ContentTab from '@/components/admin/ContentTab';
import AdminsTab from '@/components/admin/AdminsTab';
import ReviewsTab from '@/components/admin/ReviewsTab';
import AdminPWAInstallModal from '@/components/admin/AdminPWAInstallModal';
import AdminMobileNavBar from '@/components/admin/AdminMobileNavBar';
import AdminOfflineBanner from '@/components/admin/AdminOfflineBanner';
import AdminUpdateToast from '@/components/admin/AdminUpdateToast';

type AuthState = 'checking' | 'unauthenticated' | 'unauthorized' | 'authorized';

interface AdminNotificationItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  total: number;
  itemCount: number;
  timestamp: Date;
  read: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const {
    menuItems,
    categories,
    galleryItems,
    heroContent,
    siteSettings,
    offers,
    mediaItems,
    saveMenuItem,
    deleteMenuItem,
    toggleMenuItemActive,
    saveCategory,
    deleteCategory,
    saveGalleryItem,
    deleteGalleryItem,
    saveHeroContent,
    saveSiteSettings,
    saveOffer,
    deleteOffer,
    addMediaItem,
  } = useData();

  // Authentication & Verification State
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminRecord, setAdminRecord] = useState<AdminUser | null>(null);

  // Progressive Web App (PWA) State & Hardware Integration
  const {
    isInstalled,
    isInstallable,
    isIOS,
    isOnline,
    hasUpdate,
    notificationPermission,
    install: installPWA,
    requestNotificationPermission,
    sendTestNotification,
    applyUpdate,
  } = useAdminPWA();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<AdminOrderCategory | 'all'>('new');

  // Login Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  // Real-time Notification System & Audio Toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const notificationCenterRef = useRef<HTMLDivElement>(null);

  // High-priority Live Banner Toast for newly received orders
  const [newOrderBanner, setNewOrderBanner] = useState<AdminNotificationItem | null>(null);

  // Deduplication set to prevent repeat alerts for same order
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  // General Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initialize Sound Preference from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vediq_admin_sound_enabled');
      if (stored !== null) {
        setSoundEnabled(stored === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    try {
      localStorage.setItem('vediq_admin_sound_enabled', String(nextVal));
    } catch {
      // ignore
    }
    showToast(`Order Audio Alert: ${nextVal ? 'Enabled' : 'Muted'}`, 'info');
  };

  // Close Notification Center on Click Outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationCenterRef.current &&
        !notificationCenterRef.current.contains(e.target as Node)
      ) {
        setIsNotificationCenterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --------------------------------------------------------------------------
  // Admin Verification Logic
  // --------------------------------------------------------------------------
  const verifyAdminAccess = useCallback(async (user: any) => {
    if (!user || !user.id) {
      setAuthState('unauthenticated');
      setCurrentUser(null);
      setAdminRecord(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (data && data.active === true) {
        setAdminRecord(data as AdminUser);
        setCurrentUser(user);
        setAuthState('authorized');
        return;
      }

      // Check designated primary admin account
      const isDesignatedAdmin =
        user.id === 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c' ||
        user.email?.toLowerCase() === 'vediqbiryani@gmail.com';

      if (isDesignatedAdmin) {
        setAdminRecord({
          id: user.id,
          user_id: user.id,
          email: user.email || 'vediqbiryani@gmail.com',
          role: 'admin',
          active: true,
          created_at: new Date().toISOString(),
        });
        setCurrentUser(user);
        setAuthState('authorized');
        return;
      }

      if (error) {
        console.error('Error checking admin authorization:', error.message);
      }

      setAuthState('unauthorized');
      setCurrentUser(user);
      setAdminRecord(null);
    } catch (err: any) {
      console.error('Admin verification exception:', err);
      setAuthState('unauthorized');
      setCurrentUser(user);
    }
  }, []);

  // Initial Auth Check on Mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setAuthState('checking');

      if (!isSupabaseConfigured()) {
        setAuthState('unauthenticated');
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session || !session.user) {
          if (isMounted) {
            setAuthState('unauthenticated');
            setCurrentUser(null);
            setAdminRecord(null);
          }
          return;
        }

        if (isMounted) {
          await verifyAdminAccess(session.user);
        }
      } catch (err) {
        console.error('Session retrieval error:', err);
        if (isMounted) {
          setAuthState('unauthenticated');
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session || !session.user) {
        if (isMounted) {
          setAuthState('unauthenticated');
          setCurrentUser(null);
          setAdminRecord(null);
          setOrders([]);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (isMounted && session.user) {
          await verifyAdminAccess(session.user);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [verifyAdminAccess]);

  // Handle Incoming New Order (Realtime or Polling)
  const handleIncomingNewOrder = useCallback(
    (newOrder: CustomerOrder) => {
      const orderId = newOrder.id || newOrder.order_number;
      if (!orderId) return;

      // Deduplication check
      if (knownOrderIdsRef.current.has(orderId)) return;
      knownOrderIdsRef.current.add(orderId);

      // Play audio chime if sound is enabled
      if (soundEnabled) {
        playAdminNewOrderChime();
      }

      // Add to notifications list
      const notifItem: AdminNotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId: newOrder.id,
        orderNumber: newOrder.order_number || newOrder.id,
        customerName: newOrder.customer_name || 'Guest',
        total: Number(newOrder.total) || 0,
        itemCount: (newOrder.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0),
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [notifItem, ...prev.slice(0, 20)]);

      // Show prominent banner toast
      setNewOrderBanner(notifItem);

      // Dispatch native browser notification if granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const formattedAmount = formatINR(Number(newOrder.total) || 0);
          new Notification(`👑 New Order: #${notifItem.orderNumber}`, {
            body: `${notifItem.customerName} • ${formattedAmount} (${notifItem.itemCount} items)`,
            icon: '/admin-icon-192.png',
            tag: `order-${notifItem.orderNumber}`,
          });
        } catch (err) {
          console.warn('[Admin PWA] Native notification notice:', err);
        }
      }

      // Update orders list immediately without refresh
      setOrders((prev) => {
        const exists = prev.some((o) => (o.id === newOrder.id || o.order_number === newOrder.order_number));
        if (exists) {
          return prev.map((o) => (o.id === newOrder.id ? { ...o, ...newOrder } : o));
        }
        return [newOrder, ...prev];
      });
    },
    [soundEnabled]
  );

  // Fetch Orders from Supabase
  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      const localOrdersStr = localStorage.getItem('vediq_cached_orders');
      if (localOrdersStr) {
        try {
          const parsed = JSON.parse(localOrdersStr);
          setOrders(parsed);
          parsed.forEach((o: CustomerOrder) => {
            if (o.id) knownOrderIdsRef.current.add(o.id);
            if (o.order_number) knownOrderIdsRef.current.add(o.order_number);
          });
        } catch {}
      }
      return;
    }

    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error.message);
      } else if (data) {
        const fetchedOrders = data as CustomerOrder[];

        // Check if any new orders arrived during fetch
        fetchedOrders.forEach((ord) => {
          const ordId = ord.id || ord.order_number;
          // Seed initial known IDs on first load
          if (knownOrderIdsRef.current.size === 0) {
            knownOrderIdsRef.current.add(ordId);
          } else if (!knownOrderIdsRef.current.has(ordId)) {
            // New order discovered!
            handleIncomingNewOrder(ord);
          }
        });

        setOrders(fetchedOrders);
        localStorage.setItem('vediq_cached_orders', JSON.stringify(fetchedOrders));
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [handleIncomingNewOrder]);

  // Initial fetch when authorized
  useEffect(() => {
    if (authState === 'authorized') {
      fetchOrders();
    }
  }, [authState, fetchOrders]);

  // --------------------------------------------------------------------------
  // SUPABASE REALTIME SUBSCRIPTION FOR LIVE ORDERS
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (authState !== 'authorized' || !isSupabaseConfigured()) return;

    try {
      const channel = supabase
        .channel('admin-orders-live-stream')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const incoming = payload.new as CustomerOrder;
            if (incoming) {
              handleIncomingNewOrder(incoming);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updated = payload.new as CustomerOrder;
            if (updated) {
              setOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
              );
            }
          }
        )
        .subscribe();

      // Background Polling Fallback (every 12 seconds to ensure 100% reliability)
      const pollInterval = setInterval(() => {
        fetchOrders();
      }, 12000);

      return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[AdminPage] Realtime subscription notice:', err);
    }
  }, [authState, handleIncomingNewOrder, fetchOrders]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!emailInput.trim() || !passwordInput) {
      setLoginError('Please enter both email and password.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoginError('Supabase credentials are required in environment.');
      return;
    }

    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (error) {
        setLoginError(error.message || 'Invalid login credentials.');
        setLoginLoading(false);
        return;
      }

      if (data && data.user) {
        await verifyAdminAccess(data.user);
      }
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setAuthState('unauthenticated');
    setCurrentUser(null);
    setAdminRecord(null);
    setOrders([]);
    showToast('Signed out of Admin CMS.', 'info');
  };

  // Update Order Status (with history preservation)
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    reason?: string
  ) => {
    try {
      const nowIso = new Date().toISOString();
      const targetOrder = orders.find((o) => o.id === orderId);

      const existingHistory = targetOrder?.status_history || [];
      const updatedHistory = [
        ...existingHistory,
        { status: newStatus, timestamp: nowIso, note: reason },
      ];

      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('orders')
          .update({
            order_status: newStatus,
            updated_at: nowIso,
          })
          .eq('id', orderId);

        if (error) {
          showToast(`Failed to update order status: ${error.message}`, 'error');
          return;
        }
      }

      // Update local state without duplication
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                order_status: newStatus,
                updated_at: nowIso,
                status_history: updatedHistory,
              }
            : ord
        )
      );

      showToast(`Order status updated to "${newStatus.replace(/_/g, ' ')}"`, 'success');

      // Dispatch customer email alert if out for delivery or ready
      if (
        targetOrder &&
        (newStatus === 'ready_for_delivery' || newStatus === 'out_for_delivery')
      ) {
        try {
          const notifyResult = await triggerOrderStatusNotification(targetOrder, newStatus);
          if (notifyResult.success) {
            showToast(
              `📧 Email alert dispatched (${newStatus.replace(/_/g, ' ')}) to customer!`,
              'success'
            );
          }
        } catch (notifyErr: any) {
          console.warn('[Admin] Edge function notification error:', notifyErr);
        }
      }
    } catch (err: any) {
      showToast(`Failed to update order: ${err.message}`, 'error');
    }
  };

  // Toggle Cash on Delivery Payment Status (Pending vs Paid/Collected)
  const handleTogglePaymentStatus = async (
    orderId: string,
    newPaymentStatus: 'pending' | 'paid'
  ) => {
    try {
      const nowIso = new Date().toISOString();

      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: newPaymentStatus,
            updated_at: nowIso,
          })
          .eq('id', orderId);

        if (error) {
          showToast(`Failed to update payment status: ${error.message}`, 'error');
          return;
        }
      }

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? { ...ord, payment_status: newPaymentStatus, updated_at: nowIso }
            : ord
        )
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          payment_status: newPaymentStatus,
          updated_at: nowIso,
        });
      }

      showToast(
        newPaymentStatus === 'paid'
          ? '✓ COD marked as Paid / Collected!'
          : 'COD marked as Pending collection.',
        'success'
      );
    } catch (err: any) {
      showToast(`Failed to update payment: ${err.message}`, 'error');
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Click on a notification item to inspect order
  const handleNotificationClick = (notif: AdminNotificationItem) => {
    const target = orders.find((o) => o.id === notif.orderId || o.order_number === notif.orderNumber);
    if (target) {
      setSelectedOrder(target);
      setActiveTab('orders');
    }
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsNotificationCenterOpen(false);
    setNewOrderBanner(null);
  };

  // Compute unread count
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Compute new / pending orders count for sidebar badge
  const newOrdersCount = orders.filter((o) => getOrderCategory(o) === 'new').length;

  // --------------------------------------------------------------------------
  // Render: Loading / Checking Auth state
  // --------------------------------------------------------------------------
  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#07111F] text-[#F5F1E8] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#101F35] border border-[#C9A24A]/40 flex items-center justify-center text-[#E2C56B] shadow-2xl animate-pulse">
            <RefreshCw className="w-7 h-7 animate-spin text-[#C9A24A]" />
          </div>
          <p className="text-xs font-bold text-[#E2C56B] uppercase tracking-widest">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render: Unauthenticated / Login Screen (Royal Navy & Gold Branding)
  // --------------------------------------------------------------------------
  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#07111F] text-[#F5F1E8] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#C9A24A] selection:text-[#07111F]">
        <div className="max-w-md w-full space-y-6">
          {/* Logo & Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A24A] to-[#B89033] flex items-center justify-center text-[#07111F] text-3xl font-serif font-black mx-auto shadow-2xl">
              V
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F1E8]">
              Vediq Biryani
            </h1>
            <p className="text-xs font-bold text-[#E2C56B] uppercase tracking-widest">
              Restaurant CMS &amp; Kitchen Management Portal
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#0A1628] rounded-3xl border border-[#1C2D4A] shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#F5F1E8] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C9A24A]" />
                <span>Admin Portal Login</span>
              </h2>
              <p className="text-xs text-[#AAB4C2]">
                Enter authorized credentials to manage live kitchen orders, menu, and reports.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <p className="font-bold">Authentication Error</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{loginError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#F5F1E8] block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email or admin ID"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] transition shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#F5F1E8] block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8B9B]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-xs text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E8B9B] hover:text-[#F5F1E8] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] font-black text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize &amp; Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 space-y-3">
              <Link
                href="/"
                className="text-xs text-[#AAB4C2] hover:text-[#E2C56B] transition inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Live Public Site</span>
              </Link>

              {!isInstalled && (
                <div className="pt-2 border-t border-[#1C2D4A]">
                  <button
                    type="button"
                    onClick={() => {
                      if (isInstallable) {
                        installPWA();
                      } else {
                        setIsInstallModalOpen(true);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#101F35] hover:bg-[#162947] border border-[#C9A24A]/40 text-[#E2C56B] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#C9A24A]" />
                    <span>Install VEDIQ ADMIN on this Device</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PWA Install Guide Modal */}
        <AdminPWAInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          isIOS={isIOS}
          onInstall={installPWA}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render: Unauthorized State
  // --------------------------------------------------------------------------
  if (authState === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#07111F] text-[#F5F1E8] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0A1628] rounded-3xl border border-rose-500/40 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#F5F1E8]">Access Denied</h2>
          <p className="text-xs text-[#AAB4C2] leading-relaxed">
            Your authenticated account (<strong className="text-[#F5F1E8]">{currentUser?.email}</strong>) is not granted active admin permissions in the restaurant database.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-[#101F35] text-xs font-bold text-[#F5F1E8] hover:bg-[#1C2D4A] transition"
            >
              Sign Out
            </button>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-[#C9A24A] text-[#07111F] text-xs font-bold hover:bg-[#E2C56B] transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render: Authorized Main Admin Panel (Royal Navy & Antique Gold Theme)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#07111F] text-[#F5F1E8] flex flex-col">
      {/* Offline Status Alert Banner */}
      <AdminOfflineBanner isOnline={isOnline} />

      <div className="flex flex-1 min-h-0">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div
              className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-950 text-rose-200 border-rose-500/50'
                  : 'bg-[#101F35] text-[#F5F1E8] border-[#1C2D4A]'
              }`}
            >
              {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Prominent Real-Time New-Order Alert Toast Banner */}
        {newOrderBanner && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 animate-in slide-in-from-top-4 duration-300 max-w-sm w-full">
            <div className="p-4 rounded-2xl bg-[#0A1628] border-2 border-[#C9A24A] shadow-[0_0_25px_rgba(201,162,74,0.35)] space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="font-extrabold uppercase text-[11px] text-[#E2C56B] tracking-wider">
                    🔔 New Order Received!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewOrderBanner(null)}
                  className="text-[#7E8B9B] hover:text-[#F5F1E8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-0.5">
                <p className="font-mono text-sm font-black text-[#F5F1E8]">
                  #{newOrderBanner.orderNumber}
                </p>
                <p className="text-[#AAB4C2]">
                  Customer: <strong className="text-[#F5F1E8]">{newOrderBanner.customerName}</strong>
                </p>
                <p className="text-emerald-400 font-bold">
                  Total: {formatINR(newOrderBanner.total)} ({newOrderBanner.itemCount} dishes)
                </p>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleNotificationClick(newOrderBanner)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] text-[#07111F] font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Inspect Order Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Navigation */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          adminEmail={currentUser?.email}
          newOrdersCount={newOrdersCount}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          isInstalled={isInstalled}
        />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[#07111F]/95 backdrop-blur-md border-b border-[#1C2D4A] px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 rounded-xl text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35] lg:hidden cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-[#F5F1E8] capitalize">
                Vediq Admin: {activeTab.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Top Controls: Sound Toggle, Notification Centre, Sync, Live Site */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Alert Bell Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? 'Notification Sound: Enabled (Click to Mute)' : 'Notification Sound: Muted (Click to Enable)'}
              className={`p-2 rounded-xl border text-xs transition cursor-pointer flex items-center gap-1 ${
                soundEnabled
                  ? 'bg-[#101F35] border-[#C9A24A]/40 text-[#E2C56B]'
                  : 'bg-[#07111F] border-[#1C2D4A] text-[#7E8B9B]'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#C9A24A]" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[10px] font-bold hidden sm:inline">
                {soundEnabled ? 'Sound On' : 'Muted'}
              </span>
            </button>

            {/* Notification Centre Bell with Dropdown */}
            <div className="relative" ref={notificationCenterRef}>
              <button
                type="button"
                onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
                className="relative p-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-[#F5F1E8] hover:text-[#E2C56B] transition cursor-pointer"
                title="Notification Centre"
              >
                <Bell className="w-4 h-4 text-[#C9A24A]" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-[#07111F] font-black text-[10px] flex items-center justify-center animate-bounce shadow-md">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Centre Dropdown */}
              {isNotificationCenterOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0A1628] border border-[#1C2D4A] shadow-2xl p-4 z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-[#1C2D4A] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#C9A24A]" />
                      <span className="font-bold text-xs text-[#F5F1E8]">Order Notifications</span>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[11px] text-[#E2C56B] hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-[#7E8B9B]">
                        No new order notifications yet.
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition space-y-1 ${
                            notif.read
                              ? 'bg-[#07111F] border-[#1C2D4A] text-[#AAB4C2]'
                              : 'bg-[#101F35] border-[#C9A24A]/40 text-[#F5F1E8] shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[#E2C56B]">
                              #{notif.orderNumber}
                            </span>
                            <span className="text-[10px] text-[#7E8B9B]">
                              {notif.timestamp.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="font-semibold text-xs text-[#F5F1E8]">{notif.customerName}</p>
                          <p className="text-[11px] text-[#AAB4C2]">
                            {notif.itemCount} items · <strong className="text-emerald-400">{formatINR(notif.total)}</strong>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sync Database Button */}
            <button
              onClick={fetchOrders}
              disabled={ordersLoading}
              title="Sync Orders from Supabase"
              className="p-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#1C2D4A] transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin text-[#C9A24A]' : ''}`} />
            </button>

            {/* Install Admin App Button (if not already running in standalone) */}
            {!isInstalled && (
              <button
                type="button"
                onClick={() => {
                  if (isInstallable) {
                    installPWA();
                  } else {
                    setIsInstallModalOpen(true);
                  }
                }}
                title="Install VEDIQ BIRYANI ADMIN App"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] text-[11px] font-black transition shadow-xs cursor-pointer active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {/* Live Website Link */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-[11px] font-bold text-[#AAB4C2] hover:text-[#F5F1E8] transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C9A24A]" />
              <span className="hidden sm:inline">Live Site</span>
            </Link>
          </div>
        </header>

        {/* Tab Content Views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-28 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardTab
              orders={orders}
              menuItems={menuItems}
              categoriesCount={categories.length}
              onNavigateTab={setActiveTab}
              onViewOrder={(order) => {
                setSelectedOrder(order);
                setActiveTab('orders');
              }}
              onAddNewProduct={() => setActiveTab('products')}
              onSelectCategoryFilter={(cat) => {
                setSelectedCategoryFilter(cat);
              }}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              onUpdateStatus={handleUpdateOrderStatus}
              onTogglePaymentStatus={handleTogglePaymentStatus}
              onRefresh={fetchOrders}
              isLoading={ordersLoading}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              initialCategory={selectedCategoryFilter}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              orders={orders}
              menuItems={menuItems}
              categories={categories}
              onViewOrder={(order) => {
                setSelectedOrder(order);
                setActiveTab('orders');
              }}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab
              menuItems={menuItems}
              categories={categories}
              onSaveProduct={saveMenuItem}
              onDeleteProduct={deleteMenuItem}
              onToggleActive={toggleMenuItemActive}
              showToast={showToast}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              onSaveCategory={saveCategory}
              onDeleteCategory={deleteCategory}
              showToast={showToast}
            />
          )}

          {activeTab === 'gallery' && (
            <GalleryTab
              galleryItems={galleryItems}
              onSaveGalleryItem={saveGalleryItem}
              onDeleteGalleryItem={deleteGalleryItem}
              showToast={showToast}
            />
          )}

          {activeTab === 'hero' && (
            <HeroTab
              heroContent={heroContent}
              onSaveHeroContent={saveHeroContent}
              showToast={showToast}
            />
          )}

          {activeTab === 'offers' && (
            <OffersTab
              offers={offers}
              onSaveOffer={saveOffer}
              onDeleteOffer={deleteOffer}
              showToast={showToast}
            />
          )}

          {activeTab === 'media' && (
            <MediaTab
              mediaItems={mediaItems}
              onAddMediaItem={addMediaItem}
              showToast={showToast}
            />
          )}

          {activeTab === 'reviews' && <ReviewsTab showToast={showToast} />}

          {activeTab === 'content' && (
            <ContentTab
              siteSettings={siteSettings}
              onSaveSettings={saveSiteSettings}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              siteSettings={siteSettings}
              onSaveSettings={saveSiteSettings}
              showToast={showToast}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
              isInstalled={isInstalled}
              isInstallable={isInstallable}
              notificationPermission={notificationPermission}
              onRequestNotificationPermission={requestNotificationPermission}
              onSendTestNotification={sendTestNotification}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
            />
          )}

          {activeTab === 'admins' && (
            <AdminsTab currentAdmin={adminRecord} currentUser={currentUser} />
          )}
        </main>
      </div>
    </div>

      {/* Mobile-First Bottom Navigation Bar for easy one-handed operation */}
      <AdminMobileNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        newOrdersCount={newOrdersCount}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
      />

      {/* Progressive Web App Update Toast */}
      <AdminUpdateToast hasUpdate={hasUpdate} onUpdate={applyUpdate} />

      {/* PWA Guided Install Modal for Android, iOS Safari and Desktop */}
      <AdminPWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={installPWA}
      />
    </div>
  );
}
