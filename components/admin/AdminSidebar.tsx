'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  UtensilsCrossed,
  Layers,
  Camera,
  Sparkles,
  Tag,
  Image as ImageIcon,
  FileText,
  Settings,
  Users,
  Star,
  LogOut,
  ExternalLink,
  Store,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'reports'
  | 'products'
  | 'categories'
  | 'gallery'
  | 'hero'
  | 'offers'
  | 'media'
  | 'reviews'
  | 'content'
  | 'settings'
  | 'admins';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onLogout: () => void;
  adminEmail?: string;
  newOrdersCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenInstallModal?: () => void;
  isInstalled?: boolean;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  onLogout,
  adminEmail,
  newOrdersCount = 0,
  isOpenMobile = false,
  onCloseMobile,
  onOpenInstallModal,
  isInstalled = false,
}: AdminSidebarProps) {
  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Order Management',
      icon: ShoppingBag,
      badge: newOrdersCount > 0 ? newOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-black font-black animate-pulse shadow-xs',
    },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'products', label: 'Products & Menu', icon: UtensilsCrossed },
    { id: 'categories', label: 'Dish Categories', icon: Layers },
    { id: 'gallery', label: 'Portfolio / Gallery', icon: Camera },
    { id: 'hero', label: 'Hero / Homepage', icon: Sparkles },
    { id: 'offers', label: 'Offers & Discounts', icon: Tag },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
    { id: 'content', label: 'Website Content', icon: FileText },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'admins', label: 'Admin Access', icon: Users },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#07111F] text-[#AAB4C2] flex flex-col border-r border-[#1C2D4A] transition-transform duration-300 shadow-2xl ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Header */}
        <div className="p-5 border-b border-[#1C2D4A] bg-[#0A1628]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A24A] to-[#B89033] flex items-center justify-center text-[#07111F] font-serif font-black shadow-md">
              V
            </div>
            <div>
              <h2 className="font-serif font-bold text-[#F5F1E8] text-base leading-tight">Vediq Biryani</h2>
              <p className="text-[10px] text-[#E2C56B] font-semibold tracking-wider uppercase">Restaurant CMS</p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            title="Open Live Public Site"
            className="p-1.5 rounded-lg text-[#7E8B9B] hover:text-[#E2C56B] hover:bg-[#101F35] transition"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-extrabold text-[#7E8B9B] uppercase tracking-wider">
            Management &amp; Fulfillment
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#C9A24A] to-[#B89033] text-[#07111F] font-black shadow-md'
                    : 'text-[#AAB4C2] hover:text-[#F5F1E8] hover:bg-[#101F35]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#07111F]' : 'text-[#C9A24A]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      isActive ? 'bg-[#07111F] text-[#E2C56B] font-black' : item.badgeColor || 'bg-[#101F35] text-[#E2C56B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* PWA Install Tile / Standalone Badge */}
        {onOpenInstallModal && (
          <div className="p-3 border-t border-[#1C2D4A] bg-[#0A1628]/40">
            {isInstalled ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">VEDIQ ADMIN App Active</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-[#101F35] to-[#162947] hover:from-[#162947] hover:to-[#1C3660] border border-[#C9A24A]/40 text-[#E2C56B] text-xs font-bold transition shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#C9A24A] group-hover:scale-110 transition-transform" />
                  <span>Install Admin App</span>
                </div>
                <span className="text-[10px] bg-[#C9A24A] text-[#07111F] font-black px-1.5 py-0.5 rounded-md">
                  PWA
                </span>
              </button>
            )}
          </div>
        )}

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-[#1C2D4A] bg-[#050B14]">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-[10px] text-[#7E8B9B] uppercase tracking-wider font-semibold">Authorized Admin</p>
              <p className="text-xs font-medium text-[#F5F1E8] truncate">{adminEmail || 'Active Admin Session'}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
