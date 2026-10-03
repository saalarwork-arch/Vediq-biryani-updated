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
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CustomerOrder, AdminUser, OrderStatus, MenuItem } from '@/types/supabase';
import { useData } from '@/context/DataContext';
import { triggerOrderStatusNotification } from '@/lib/notifications';

import AdminSidebar, { AdminTab } from '@/components/admin/AdminSidebar';
import DashboardTab from '@/components/admin/DashboardTab';
import OrdersTab from '@/components/admin/OrdersTab';
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

type AuthState = 'checking' | 'unauthenticated' | 'unauthorized' | 'authorized';

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

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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

  // Toast Notification State
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

      // Check if user is the designated primary admin account
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

  // Fetch Orders from Supabase
  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      // Fallback demo order for preview testing if database empty
      const localOrdersStr = localStorage.getItem('vediq_cached_orders');
      if (localOrdersStr) {
        try {
          setOrders(JSON.parse(localOrdersStr));
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
        // Fallback to local storage if table doesn't have records yet
        const localOrdersStr = localStorage.getItem('vediq_cached_orders');
        if (localOrdersStr) {
          try {
            setOrders(JSON.parse(localOrdersStr));
          } catch {}
        }
      } else if (data) {
        setOrders(data as CustomerOrder[]);
        localStorage.setItem('vediq_cached_orders', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState === 'authorized') {
      fetchOrders();
    }
  }, [authState, fetchOrders]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!emailInput.trim() || !passwordInput) {
      setLoginError('Please enter both email and password.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoginError(
        'Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are required in environment.'
      );
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

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('orders')
          .update({
            order_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (error) {
          showToast(`Failed to update order status: ${error.message}`, 'error');
          return;
        }
      }

      // Update local state
      const nowIso = new Date().toISOString();
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, order_status: newStatus, updated_at: nowIso } : ord))
      );
      showToast(`Order status updated to "${newStatus.replace(/_/g, ' ')}"`, 'success');

      // Trigger Supabase Edge Function email alert for 'ready_for_delivery' or 'out_for_delivery'
      const targetOrder = orders.find((ord) => ord.id === orderId);
      if (
        targetOrder &&
        (newStatus === 'ready_for_delivery' || newStatus === 'out_for_delivery')
      ) {
        try {
          const notifyResult = await triggerOrderStatusNotification(targetOrder, newStatus);
          if (notifyResult.success) {
            showToast(
              `📧 Email alert dispatched (${newStatus === 'ready_for_delivery' ? 'Ready for Delivery' : 'Out for Delivery'}) via Supabase Edge Function!`,
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

  // --------------------------------------------------------------------------
  // Render: Loading / Checking state
  // --------------------------------------------------------------------------
  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF5E8] border border-[#E9DCBF] flex items-center justify-center text-[#9E7422] shadow-sm animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-bold text-[#1A1814] uppercase tracking-wider">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render: Unauthenticated / Login Screen
  // --------------------------------------------------------------------------
  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#C59A3F] selection:text-white">
        <div className="max-w-md w-full space-y-6">
          {/* Logo & Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C59A3F] to-[#9E7422] flex items-center justify-center text-white text-2xl font-serif font-black mx-auto shadow-md">
              V
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">
              Vediq Biryani
            </h1>
            <p className="text-xs font-bold text-[#9E7422] uppercase tracking-wider">
              Restaurant CMS & Admin Portal
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#1A1814] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#9E7422]" />
                <span>Admin Portal Login</span>
              </h2>
              <p className="text-xs text-[#6B665E]">
                Enter authorized credentials to manage orders, products, gallery, and settings.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <p className="font-bold">Authentication Error</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{loginError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#1A1814] block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C877E]" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email or user ID"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] placeholder-[#8C877E] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#1A1814] block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C877E]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-xs text-[#1A1814] placeholder-[#8C877E] focus:outline-none focus:border-[#C59A3F] focus:bg-white transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C877E] hover:text-[#1A1814] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C59A3F] to-[#9E7422] hover:from-[#B8860B] text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Sign In to Admin Dashboard</span>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-[#6B665E] hover:text-[#1A1814] inline-flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Website</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render: Unauthorized Screen (Logged in but not in public.admins)
  // --------------------------------------------------------------------------
  if (authState === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#EAE6DF] shadow-xl p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-[#1A1814]">Unauthorized Access</h2>
            <p className="text-xs text-[#6B665E] leading-relaxed">
              Your account (<span className="font-semibold text-[#1A1814]">{currentUser?.email}</span>) is
              not authorized in the <code className="text-[#9E7422]">public.admins</code> table with active status.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-left text-xs space-y-1 text-[#5A564F]">
            <p className="font-bold text-[#1A1814]">Authorization Requirement:</p>
            <p className="text-[11px] leading-relaxed">
              An active admin record matching your user ID is required to access the restaurant CMS.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl bg-white border border-[#DDD8CE] text-xs font-bold text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
            >
              Sign Out
            </button>
            <Link
              href="/"
              className="flex-1 py-2.5 rounded-xl bg-[#1A1814] text-white text-xs font-bold hover:bg-black transition flex items-center justify-center"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render: Authorized Complete Restaurant CMS Dashboard
  // --------------------------------------------------------------------------
  const pendingOrdersCount = orders.filter((o) => o.order_status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1814] flex">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-[#1A4B29] text-white border-[#1A4B29]'
                : toastMessage.type === 'error'
                ? 'bg-[#991B1B] text-white border-[#991B1B]'
                : 'bg-[#1A1814] text-white border-[#333]'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-300" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        adminEmail={currentUser?.email}
        pendingOrdersCount={pendingOrdersCount}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#EAE6DF] px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 rounded-xl text-[#5A564F] hover:bg-[#F2EFE8] lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-[#1A1814] capitalize">
                CMS: {activeTab.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-[11px] font-bold text-[#5A564F] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#9E7422]" />
              <span>Live Website</span>
            </Link>

            <button
              onClick={fetchOrders}
              disabled={ordersLoading}
              title="Sync Database"
              className="p-2 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] text-[#5A564F] hover:text-[#1A1814] hover:bg-[#F2EFE8] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Tab Content Views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
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
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              onUpdateStatus={handleUpdateOrderStatus}
              onRefresh={fetchOrders}
              isLoading={ordersLoading}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
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

          {activeTab === 'reviews' && (
            <ReviewsTab showToast={showToast} />
          )}

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
            />
          )}

          {activeTab === 'admins' && (
            <AdminsTab currentAdmin={adminRecord} currentUser={currentUser} />
          )}
        </main>
      </div>
    </div>
  );
}
