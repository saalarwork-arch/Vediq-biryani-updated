'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles, Compass, Menu, X, History, Sun, Moon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import VediqLogo from './VediqLogo';

export default function Navbar() {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { setTrackOrderModalOpen } = useData();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-Spy: Track scroll position and highlight active section (Menu, Jain Specials, About/Craft, Reviews)
  useEffect(() => {
    const sectionIds = [
      { id: 'menu', key: 'menu' },
      { id: 'jain-specials', key: 'jain-specials' },
      { id: 'craft', key: 'about' },
      { id: 'about', key: 'about' },
      { id: 'reviews', key: 'reviews' },
    ];

    const updateScrollSpy = () => {
      const scrollPosition = window.scrollY + 160;

      // When near top (Hero), deactivate section highlights
      if (window.scrollY < 180) {
        setActiveSection('');
        return;
      }

      // Check if user has scrolled near bottom of page
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
        setActiveSection('reviews');
        return;
      }

      let current = '';
      for (const section of sectionIds) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            current = section.key;
            break;
          }
        }
      }

      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', updateScrollSpy, { passive: true });
    updateScrollSpy();
    return () => window.removeEventListener('scroll', updateScrollSpy);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 w-full max-w-[100vw] overflow-x-clip box-border ${
        isScrolled
          ? 'bg-[#0A1628]/95 backdrop-blur-md border-b border-[#1C2D4A] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] py-1 sm:py-1.5'
          : 'bg-[#07111F]/92 backdrop-blur-sm border-b border-[#1C2D4A] py-1.5 sm:py-2'
      }`}
      style={{ width: '100%', maxWidth: '100vw' }}
    >
      {/* 1. MATHEMATICALLY EXACT VIEWPORT-CENTERED LOGO LAYER (Spans 100% of header width) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-8 xs:px-12 sm:px-20 md:px-28 lg:px-40 h-full w-full max-w-full overflow-hidden box-border shrink-0 min-w-0">
        <Link
          href="/"
          className="pointer-events-auto flex items-center justify-center h-full max-h-[96%] py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24A] rounded-lg transition-transform duration-200 hover:scale-[1.02] w-auto max-w-full shrink-0 min-w-0"
          aria-label="Vediq Biryani Homepage"
        >
          <VediqLogo variant="dark" size="header" showTagline={true} />
        </Link>
      </div>

      {/* 2. HEADER CONTROLS CONTAINER (Left Controls & Right Controls) */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-20 box-border">
        <div className="flex items-center justify-between min-h-[64px] sm:min-h-[72px] md:min-h-[80px] lg:min-h-[86px] w-full max-w-full box-border shrink-0 min-w-0">
          {/* Left Controls: Hamburger on mobile, Left Nav Links on desktop */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 max-w-full shrink-0 box-border">
            {/* Mobile Menu Toggle Button (Left Position on Mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl bg-[#101F35] border border-[#1C2D4A] text-[#F5F1E8] hover:text-[#E2C56B] transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop Left Nav Links with Scroll-Spy Highlighting */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 max-w-full shrink-0 min-w-0">
              <a
                href="#menu"
                className={`text-xs lg:text-sm font-semibold transition-all py-1 whitespace-nowrap relative ${
                  activeSection === 'menu'
                    ? 'text-[#E2C56B] font-bold after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[2px] after:bg-[#C9A24A] after:rounded-full after:shadow-[0_0_8px_rgba(201,162,74,0.6)]'
                    : 'text-[#F5F1E8] hover:text-[#E2C56B]'
                }`}
              >
                Our Menu
              </a>
              <a
                href="#jain-specials"
                className={`text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 py-1 px-3 rounded-full whitespace-nowrap ${
                  activeSection === 'jain-specials'
                    ? 'bg-[#C9A24A]/25 border-2 border-[#C9A24A] text-[#F5F1E8] shadow-[0_0_12px_rgba(201,162,74,0.35)]'
                    : 'bg-[#101F35] border border-[#C9A24A]/40 text-[#E2C56B] hover:text-[#F5F1E8]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
                <span>100% Jain Satvik</span>
              </a>
              <a
                href="#craft"
                className={`text-xs lg:text-sm font-semibold transition-all py-1 whitespace-nowrap relative ${
                  activeSection === 'about'
                    ? 'text-[#E2C56B] font-bold after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[2px] after:bg-[#C9A24A] after:rounded-full after:shadow-[0_0_8px_rgba(201,162,74,0.6)]'
                    : 'text-[#F5F1E8] hover:text-[#E2C56B]'
                }`}
              >
                About & Craft
              </a>
            </nav>
          </div>

          {/* Right Controls: Desktop Right Nav Links, Theme Toggle, Cart Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0 min-w-0 max-w-full box-border">
            {/* Desktop Right Nav Links with Scroll-Spy Highlighting */}
            <nav className="hidden xl:flex items-center gap-5 mr-2 max-w-full shrink-0 min-w-0">
              <a
                href="#reviews"
                className={`text-xs lg:text-sm font-semibold transition-all py-1 whitespace-nowrap relative ${
                  activeSection === 'reviews'
                    ? 'text-[#E2C56B] font-bold after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[2px] after:bg-[#C9A24A] after:rounded-full after:shadow-[0_0_8px_rgba(201,162,74,0.6)]'
                    : 'text-[#F5F1E8] hover:text-[#E2C56B]'
                }`}
              >
                Guest Reviews
              </a>
              <button
                onClick={() => setTrackOrderModalOpen(true)}
                className="text-xs lg:text-sm font-semibold text-[#F5F1E8] hover:text-[#E2C56B] transition-colors flex items-center gap-1.5 cursor-pointer py-1 whitespace-nowrap"
              >
                <Compass className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
                <span>Track Order</span>
              </button>
              <Link
                href="/orders"
                className="text-xs lg:text-sm font-semibold text-[#F5F1E8] hover:text-[#E2C56B] transition-colors flex items-center gap-1.5 py-1 whitespace-nowrap"
              >
                <History className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
                <span>My Orders</span>
              </Link>
            </nav>

            {/* Light / Dark Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-[#101F35] border border-[#1C2D4A] hover:border-[#C9A24A]/50 text-[#E2C56B] hover:text-[#F5F1E8] transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-xs"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle light or dark theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#E2C56B] animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-[#8F6413] animate-in spin-in-180 duration-300" />
              )}
            </button>

            {/* Cart Trigger Button */}
            <button
              id="btn-nav-cart"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-[#07111F] font-bold text-xs sm:text-sm transition-all shadow-[0_2px_10px_rgba(201,162,74,0.3)] active:scale-95 cursor-pointer shrink-0"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Cart</span>
              {totalItemsCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-[11px] font-black bg-[#07111F] text-[#E2C56B] rounded-full shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu with Scroll-Spy Highlighting */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0A1628] border-b border-[#1C2D4A] px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200 relative z-30 w-full max-w-full box-border shrink-0 min-w-0">
          <div className="flex flex-col space-y-2 pt-1 w-full max-w-full box-border shrink-0 min-w-0">
            <a
              href="#menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                activeSection === 'menu'
                  ? 'bg-[#101F35] text-[#E2C56B] border-l-4 border-[#C9A24A] font-bold shadow-xs'
                  : 'text-[#F5F1E8] hover:bg-[#101F35] hover:text-[#E2C56B]'
              }`}
            >
              <span>Our Menu</span>
              {activeSection === 'menu' && <span className="w-2 h-2 rounded-full bg-[#C9A24A] animate-pulse" />}
            </a>
            <a
              href="#jain-specials"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center justify-between transition ${
                activeSection === 'jain-specials'
                  ? 'bg-[#C9A24A]/25 border-2 border-[#C9A24A] text-[#F5F1E8] shadow-[0_0_12px_rgba(201,162,74,0.35)]'
                  : 'bg-[#101F35] border border-[#C9A24A]/40 text-[#E2C56B]'
              }`}
            >
              <span>100% Jain Satvik Menu</span>
              <Sparkles className="w-4 h-4 text-[#C9A24A]" />
            </a>
            <a
              href="#craft"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                activeSection === 'about'
                  ? 'bg-[#101F35] text-[#E2C56B] border-l-4 border-[#C9A24A] font-bold shadow-xs'
                  : 'text-[#F5F1E8] hover:bg-[#101F35] hover:text-[#E2C56B]'
              }`}
            >
              <span>About & Heritage Craft</span>
              {activeSection === 'about' && <span className="w-2 h-2 rounded-full bg-[#C9A24A] animate-pulse" />}
            </a>
            <a
              href="#reviews"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                activeSection === 'reviews'
                  ? 'bg-[#101F35] text-[#E2C56B] border-l-4 border-[#C9A24A] font-bold shadow-xs'
                  : 'text-[#F5F1E8] hover:bg-[#101F35] hover:text-[#E2C56B]'
              }`}
            >
              <span>Guest Reviews</span>
              {activeSection === 'reviews' && <span className="w-2 h-2 rounded-full bg-[#C9A24A] animate-pulse" />}
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setTrackOrderModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-[#F5F1E8] hover:bg-[#101F35] hover:text-[#E2C56B] flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#C9A24A]" />
              <span>Track Live Order</span>
            </button>
            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-[#F5F1E8] hover:bg-[#101F35] hover:text-[#E2C56B] flex items-center gap-2 transition"
            >
              <History className="w-4 h-4 text-[#C9A24A]" />
              <span>My Orders & History</span>
            </Link>

            {/* Mobile Menu Theme Toggle Item */}
            <div className="pt-2 border-t border-[#1C2D4A]/50">
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#F5F1E8] hover:bg-[#101F35] hover:text-[#E2C56B] flex items-center justify-between cursor-pointer bg-[#101F35]/50 border border-[#1C2D4A]"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-[#E2C56B]" />
                      <span>Switch to Light Theme</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-[#8F6413]" />
                      <span>Switch to Dark Theme</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#101F35] text-[#C9A24A] border border-[#C9A24A]/40">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
