'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Menu,
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminMobileNavBarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  newOrdersCount?: number;
  onOpenMobileMenu: () => void;
}

export default function AdminMobileNavBar({
  activeTab,
  setActiveTab,
  newOrdersCount = 0,
  onOpenMobileMenu,
}: AdminMobileNavBarProps) {
  const items: {
    id: AdminTab | 'more';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: newOrdersCount > 0 ? newOrdersCount : undefined,
    },
    { id: 'products', label: 'Menu', icon: UtensilsCrossed },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'more', label: 'More', icon: Menu },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[#07111F]/95 backdrop-blur-md border-t border-[#1C2D4A] shadow-[0_-4px_25px_rgba(0,0,0,0.6)] px-2 py-1.5 safe-area-bottom"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isMore = item.id === 'more';
          const isActive = !isMore && activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isMore) {
                  onOpenMobileMenu();
                } else {
                  setActiveTab(item.id as AdminTab);
                }
              }}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#E2C56B]'
                  : 'text-[#7E8B9B] hover:text-[#F5F1E8]'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 text-[#C9A24A]' : ''
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-[#07111F] font-black text-[9px] animate-pulse shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                  isActive ? 'font-bold text-[#E2C56B]' : ''
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24A] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
