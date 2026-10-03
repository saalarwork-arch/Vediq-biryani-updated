'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
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
} from 'lucide-react';
import Link from 'next/link';

export type AdminTab =
  | 'dashboard'
  | 'orders'
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
  pendingOrdersCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  onLogout,
  adminEmail,
  pendingOrdersCount = 0,
  isOpenMobile = false,
  onCloseMobile,
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
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'products', label: 'Products & Menu', icon: UtensilsCrossed },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'gallery', label: 'Portfolio / Gallery', icon: Camera },
    { id: 'hero', label: 'Hero / Homepage', icon: Sparkles },
    { id: 'offers', label: 'Offers & Discounts', icon: Tag },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
    { id: 'content', label: 'Website Content', icon: FileText },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'admins', label: 'Admin Users', icon: Users },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#141715] text-[#9EA5A0] flex flex-col border-r border-[#242925] transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Header */}
        <div className="p-5 border-b border-[#242925] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C59A3F] to-[#9E7422] flex items-center justify-center text-white font-serif font-black shadow-md">
              V
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-base leading-tight">Vediq Biryani</h2>
              <p className="text-[10px] text-[#C59A3F] font-semibold tracking-wider uppercase">Restaurant CMS</p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            title="Open Live Public Site"
            className="p-1.5 rounded-lg text-[#8C938F] hover:text-white hover:bg-[#242925] transition"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#6E7570] uppercase tracking-wider">
            Management
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
                    ? 'bg-[#C59A3F] text-white shadow-sm font-bold'
                    : 'text-[#9EA5A0] hover:text-[#FAF7F2] hover:bg-[#1D221F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8C938F]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-[#9E7422]' : item.badgeColor || 'bg-[#242925] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-[#242925] bg-[#0E110F]">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-[10px] text-[#6E7570] uppercase tracking-wider font-semibold">Authorized Admin</p>
              <p className="text-xs font-medium text-white truncate">{adminEmail || 'Active Session'}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
