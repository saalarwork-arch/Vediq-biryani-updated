// VEDIQ BIRYANI — Enterprise Service Worker
// Version: 1.0.0
const CACHE_NAME = 'vediq-admin-v1';

// Static safe assets to pre-cache (ONLY non-sensitive UI shell & static branding)
const PRECACHE_ASSETS = [
  '/admin',
  '/manifest-admin.json',
  '/logo.svg',
  '/admin-icon-192.png',
  '/admin-icon-512.png',
  '/admin-icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// URLs that must NEVER be cached (Customer privacy & dynamic real-time compliance)
const NEVER_CACHE_PATTERNS = [
  /supabase\.co/,
  /\/rest\/v1\//,
  /\/auth\/v1\//,
  /\/storage\/v1\//,
  /\/realtime\/v1\//,
  /\/api\//,
  /_next\/webpack-hmr/,
];

// Install: Cache safe app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Strict Privacy Rule: NEVER cache Supabase API calls or private order records
  const isNeverCache = NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.href));
  if (isNeverCache) {
    return; // Pass through directly to network
  }

  // 3. Navigation requests (HTML pages): Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, clone into cache
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const adminCached = await caches.match('/admin');
          if (adminCached) {
            return adminCached;
          }
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Vediq Biryani Admin — Offline</title>
                <style>
                  body {
                    margin: 0;
                    padding: 2rem;
                    background: #07111F;
                    color: #F5F1E8;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                  }
                  .card {
                    background: #0A1628;
                    border: 1px solid #1C2D4A;
                    border-radius: 1.5rem;
                    padding: 2.5rem;
                    max-width: 420px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                  }
                  h1 { font-size: 1.25rem; color: #E2C56B; margin-top: 1rem; }
                  p { font-size: 0.875rem; color: #AAB4C2; line-height: 1.6; }
                  button {
                    margin-top: 1.5rem;
                    padding: 0.75rem 1.5rem;
                    background: #C9A24A;
                    color: #07111F;
                    font-weight: 700;
                    border: none;
                    border-radius: 0.75rem;
                    cursor: pointer;
                  }
                </style>
              </head>
              <body>
                <div class="card">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E2C56B" stroke-width="2">
                    <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
                  </svg>
                  <h1>Admin Offline Mode</h1>
                  <p>You are disconnected from the network. Reconnect to resume live kitchen order processing and synchronization.</p>
                  <button onclick="window.location.reload()">Retry Connection</button>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 4. Static assets (JS, CSS, static images, fonts): Cache-first with network fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});

// Background Message listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push Notifications Support (when browser push is configured)
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 New Order Received — Vediq Biryani',
    body: 'A new customer order has been placed.',
    orderId: '',
    url: '/admin',
  };

  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/admin-icon-192.png',
    badge: '/admin-icon-192.png',
    tag: data.orderId ? `order-${data.orderId}` : 'vediq-order-notification',
    renotify: true,
    data: {
      url: data.url || '/admin',
    },
    actions: [
      { action: 'open', title: 'Open Admin' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
