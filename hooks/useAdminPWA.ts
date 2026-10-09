'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface AdminPWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  notificationPermission: NotificationPermission;
  install: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendTestNotification: () => void;
  applyUpdate: () => void;
}

export function useAdminPWA(): AdminPWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Register Service Worker & Listen for updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initial Online / Offline state
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Initial Standalone Detection
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // 3. iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 4. Notification Permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // 5. beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. Register Service Worker (/sw.js)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          setRegistration(reg);

          // Check if there's a waiting worker (update available)
          if (reg.waiting) {
            setHasUpdate(true);
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setHasUpdate(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[Admin PWA] Service Worker registration failed (non-critical):', err);
        });

      // Reload on controllerchange when user clicks update
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger browser install prompt
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('[Admin PWA] Install error:', err);
    }
    return false;
  }, [deferredPrompt]);

  // Request browser notification permissions
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm;
    } catch (err) {
      console.error('[Admin PWA] Notification permission error:', err);
      return 'denied';
    }
  }, []);

  // Send a test browser notification to verify permissions & audio
  const sendTestNotification = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (registration && registration.showNotification) {
          registration.showNotification('👑 Vediq Biryani Admin Alert', {
            body: 'Test order notification active! Real-time alerts will appear here.',
            icon: '/admin-icon-192.png',
            badge: '/admin-icon-192.png',
            tag: 'vediq-test-notification',
          });
        } else {
          new Notification('👑 Vediq Biryani Admin Alert', {
            body: 'Test order notification active! Real-time alerts will appear here.',
            icon: '/admin-icon-192.png',
          });
        }
      } catch (err) {
        console.warn('[Admin PWA] Test notification error:', err);
      }
    }
  }, [registration]);

  // Apply service worker update
  const applyUpdate = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [registration]);

  return {
    isInstalled,
    isInstallable: !!deferredPrompt,
    isIOS,
    isOnline,
    hasUpdate,
    notificationPermission,
    install,
    requestNotificationPermission,
    sendTestNotification,
    applyUpdate,
  };
}
