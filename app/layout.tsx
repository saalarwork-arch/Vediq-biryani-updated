import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import GmpQuotaBanner from '@/components/GmpQuotaBanner';

export const viewport: Viewport = {
  themeColor: '#07111F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Vediq Biryani',
  description: 'Experience the Heritage of Aromas. Authentic slow-cooked royal biryanis crafted with aromatic spices and traditional recipes, delivered fresh to your doorstep.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VediqBiryani',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Vediq Biryani',
    description: 'Experience the Heritage of Aromas. Authentic slow-cooked royal biryanis crafted with aromatic spices and traditional recipes, delivered fresh to your doorstep.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth w-full max-w-full overflow-x-hidden" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('vediq_theme');
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}

              // Google Maps Platform Quota Defense Listener (Two-Tier Quota Defense)
              try {
                window.gm_authFailure = function() {
                  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
                };
                var checkQuotaMsg = function(msg) {
                  if (
                    msg.indexOf('OverQuotaMapError') !== -1 ||
                    msg.indexOf('QuotaExceededError') !== -1 ||
                    msg.indexOf('limit reached') !== -1 ||
                    msg.indexOf('Maps Demo Key limit reached') !== -1 ||
                    msg.indexOf('daily quota') !== -1 ||
                    msg.indexOf('quota has been met') !== -1
                  ) {
                    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
                  }
                };
                var origError = console.error;
                console.error = function() {
                  origError.apply(console, arguments);
                  var msg = Array.prototype.slice.call(arguments).map(function(a){ return String(a); }).join(' ');
                  checkQuotaMsg(msg);
                };
                var origWarn = console.warn;
                console.warn = function() {
                  origWarn.apply(console, arguments);
                  var msg = Array.prototype.slice.call(arguments).map(function(a){ return String(a); }).join(' ');
                  checkQuotaMsg(msg);
                };
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#07111F] text-[#F5F1E8] antialiased min-h-screen w-full max-w-full overflow-x-hidden selection:bg-[#C9A24A]/30 selection:text-[#F5F1E8] transition-colors duration-200">
        <GmpQuotaBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
