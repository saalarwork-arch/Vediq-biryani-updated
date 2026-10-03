import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const viewport: Viewport = {
  themeColor: '#07111F',
  width: 'device-width',
  initialScale: 1,
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
    icon: '/icon.png',
    apple: '/icon.png',
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
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
            `,
          }}
        />
      </head>
      <body className="bg-[#07111F] text-[#F5F1E8] antialiased min-h-screen selection:bg-[#C9A24A]/30 selection:text-[#F5F1E8] transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
