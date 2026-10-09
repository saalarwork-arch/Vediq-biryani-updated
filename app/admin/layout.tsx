import type { Metadata, Viewport } from 'next';
import React from 'react';

export const viewport: Viewport = {
  themeColor: '#07111F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'VEDIQ BIRYANI ADMIN — Operations & Order Dispatch',
  description:
    'Official restaurant administration & real-time kitchen order dispatch system for Vediq Biryani.',
  manifest: '/manifest-admin.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vediq Admin',
  },
  icons: {
    icon: '/admin-icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
