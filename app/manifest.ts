import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Vediq Biryani',
    short_name: 'VediqBiryani',
    description:
      'Experience the Heritage of Aromas. Authentic slow-cooked royal biryanis crafted with aromatic spices and traditional recipes, delivered fresh to your doorstep.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#07111F',
    theme_color: '#07111F',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192 512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
