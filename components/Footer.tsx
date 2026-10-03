'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, ShieldCheck, MessageCircle, Instagram, Facebook, Smartphone } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import VediqLogo from './VediqLogo';

export default function Footer() {
  const { setTrackOrderModalOpen, siteSettings } = useData();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, install } = usePWAInstall();
  const phoneVal = siteSettings.phone || '+91 87440 44994';
  const emailVal = siteSettings.email || 'vediqbiryani@gmail.com';
  const hoursVal = siteSettings.opening_hours || 'Open 24 hours';
  const instaUrl = siteSettings.instagram_url || 'https://instagram.com/vediqbiryani';
  const fbUrl = siteSettings.facebook_url || 'https://facebook.com/vediqbiryani';
  const rawPhoneDigits = phoneVal.replace(/\D/g, '');

  return (
    <footer className="bg-[#07111F] border-t border-[#1C2D4A] text-[#AAB4C2] text-xs pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1C2D4A]">
          {/* Brand Info & Business Category */}
          <div className="space-y-4">
            <VediqLogo variant="dark" size="lg" showTagline={true} />
            <p className="text-[#AAB4C2] leading-relaxed">
              {siteSettings.tagline ||
                'Authentic slow-cooked royal Awadhi and 100% Jain Satvik dum biryanis, packed in natural banana leaf.'}
            </p>
            <div className="inline-block px-2.5 py-1 rounded-md bg-[#0A1628] border border-[#1C2D4A] text-[10px] text-[#AAB4C2] font-medium">
              Restaurant • Soul Food Restaurant • Comfort Food Restaurant
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#E2C56B] bg-[#101F35] p-2.5 rounded-xl border border-[#C9A24A]/40">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#C9A24A]" />
              <span>Certified FSSAI & Satvik Kitchen Protocols</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#F5F1E8] uppercase tracking-wider text-xs">Royal Offerings</h4>
            <ul className="space-y-2.5">
              <li><a href="#menu" className="hover:text-[#E2C56B] transition">Aloo & Veg Dum Biryani</a></li>
              <li><a href="#menu" className="hover:text-[#E2C56B] transition">Soya Chaap Dum Biryani</a></li>
              <li><a href="#menu" className="hover:text-[#E2C56B] transition">Paneer Dum Biryani</a></li>
              <li><a href="#menu" className="hover:text-[#E2C56B] transition">King Oyster Mushroom Biryani</a></li>
              <li><a href="#menu" className="hover:text-[#E2C56B] transition">Complimentary Mint Raita & Shahi Tukda</a></li>
            </ul>
          </div>

          {/* Guest Services & Social Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#F5F1E8] uppercase tracking-wider text-xs">Guest Services</h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => setTrackOrderModalOpen(true)}
                  className="hover:text-[#E2C56B] transition text-left cursor-pointer"
                >
                  Track Live Order
                </button>
              </li>
              <li><a href="#craft" className="hover:text-[#E2C56B] transition">The Dum Cooking Process</a></li>
              <li><a href="#reviews" className="hover:text-[#E2C56B] transition">Guest Reviews & Ratings</a></li>
              {isInstallable && (
                <li>
                  <button
                    onClick={() => install()}
                    className="hover:text-[#E2C56B] transition text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#C9A24A]" />
                    <span>Install Web App</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={toggleTheme}
                  className="hover:text-[#E2C56B] transition text-left cursor-pointer"
                >
                  Theme: <span className="text-[#E2C56B] font-bold">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
              </li>
            </ul>

            <div className="pt-2 space-y-2">
              <h5 className="font-bold text-[#F5F1E8] uppercase tracking-wider text-[11px]">Connect With Us</h5>
              <div className="flex items-center gap-3">
                <a
                  href={instaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1628] hover:bg-[#101F35] text-[#E2C56B] hover:text-[#F5F1E8] border border-[#1C2D4A] transition text-[11px] font-semibold"
                  aria-label="Instagram @vediqbiryani"
                >
                  <Instagram className="w-3.5 h-3.5 text-[#C9A24A]" />
                  <span>@vediqbiryani</span>
                </a>
                <a
                  href={fbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1628] hover:bg-[#101F35] text-[#E2C56B] hover:text-[#F5F1E8] border border-[#1C2D4A] transition text-[11px] font-semibold"
                  aria-label="Facebook Vediq Biryani"
                >
                  <Facebook className="w-3.5 h-3.5 text-[#C9A24A]" />
                  <span>Vediq Biryani</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#F5F1E8] uppercase tracking-wider text-xs">Kitchen & Deliveries</h4>
            <div className="space-y-2.5 text-[11px]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
                <a href={`tel:+${rawPhoneDigits}`} className="text-[#F5F1E8] hover:text-[#E2C56B] transition">
                  {phoneVal}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <a
                  href={`https://wa.me/${rawPhoneDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:underline transition font-semibold"
                >
                  WhatsApp: {phoneVal}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
                <a href={`mailto:${emailVal}`} className="hover:text-[#E2C56B] transition">
                  {emailVal}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C9A24A] mt-0.5 shrink-0" />
                <span>{siteSettings.address || 'Ek-92, Eklavya Vihar, Sector 9, Vasundhara, Ghaziabad'}</span>
              </div>
              <p className="text-[#AAB4C2] pt-1 font-semibold">
                Hours: <span className="text-[#E2C56B]">{hoursVal}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7E8B9B]">
          <p>© {new Date().getFullYear()} Vediq Biryani. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Handcrafted with Royal Awadhi Devotion</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
