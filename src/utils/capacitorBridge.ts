import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';

/**
 * Authoritative Production Backend URL for Trussets.
 * Used when the React bundle runs inside the Android Capacitor WebView (https://localhost)
 * so that Android and Website share the exact same production backend and database.
 */
export const PRODUCTION_API_ORIGIN =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  'https://ais-pre-6omlvt4qhajgkvvfwj4akz-416483381564.asia-east1.run.app';

export function isNativeAndroidOrIOS(): boolean {
  try {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    if (protocol === 'capacitor:' || (host === 'localhost' && (window as any).Capacitor?.isNativePlatform?.())) {
      return true;
    }
  } catch {
    // fallback
  }
  return false;
}

/**
 * Resolves any relative `/api/...` or `/uploads/...` URL to the production backend
 * when running inside the Capacitor native container.
 */
export function resolveProductionUrl(url: string): string {
  if (!url) return url;
  if (isNativeAndroidOrIOS()) {
    if (url.startsWith('/api/') || url === '/api' || url.startsWith('/uploads/')) {
      return `${PRODUCTION_API_ORIGIN.replace(/\/$/, '')}${url}`;
    }
  }
  return url;
}

let fetchInterceptorInstalled = false;

/**
 * Installs a transparent window.fetch interceptor ONLY for Capacitor native builds so
 * every existing `fetch('/api/...')` call automatically routes to the production
 * Trussets backend without duplicating logic or using localhost mock servers.
 */
export function initCapacitorNativeBridge(): void {
  if (typeof window === 'undefined') return;

  // Only intercept fetch and initialize native plugins when running inside a native Capacitor app
  if (!isNativeAndroidOrIOS()) {
    return;
  }

  if (!fetchInterceptorInstalled) {
    fetchInterceptorInstalled = true;
    try {
      const originalFetch = window.fetch.bind(window);
      const wrappedFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        if (typeof input === 'string' && (input.startsWith('/api/') || input === '/api' || input.startsWith('/uploads/'))) {
          const resolved = resolveProductionUrl(input);
          return originalFetch(resolved, {
            ...init,
            mode: 'cors',
          });
        }
        return originalFetch(input, init);
      };

      try {
        window.fetch = wrappedFetch;
      } catch {
        Object.defineProperty(window, 'fetch', {
          value: wrappedFetch,
          configurable: true,
          writable: true,
        });
      }
    } catch {
      // Ignore if environment forbids overriding fetch
    }
  }

  // Configure native Android Status Bar to match Trussets crimson branding (#77101F)
  StatusBar.setBackgroundColor({ color: '#77101F' }).catch(() => {});
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

  // Hide native Splash Screen smoothly once React has mounted
  setTimeout(() => {
    SplashScreen.hide().catch(() => {});
  }, 300);

  // Listen for Android Deep Links (App Links)
  CapApp.addListener('appUrlOpen', (event) => {
    try {
      const openedUrl = new URL(event.url);
      const pathWithQuery = `${openedUrl.pathname}${openedUrl.search}${openedUrl.hash}`;
      if (pathWithQuery && pathWithQuery !== '/') {
        window.history.pushState({}, '', pathWithQuery);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch {
      // Ignore malformed deep link URL
    }
  }).catch(() => {});
}

/**
 * Registers an Android hardware back button listener.
 * Returns a cleanup function.
 */
export function registerAndroidBackButton(onBackHandler: () => boolean): () => void {
  let listenerHandle: { remove: () => Promise<void> } | null = null;
  let removed = false;

  if (isNativeAndroidOrIOS()) {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      const handledByApp = onBackHandler();
      if (!handledByApp) {
        if (canGoBack && window.history.length > 1) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      }
    })
      .then((handle) => {
        if (removed) {
          handle.remove();
        } else {
          listenerHandle = handle;
        }
      })
      .catch(() => {});
  }

  return () => {
    removed = true;
    if (listenerHandle) {
      listenerHandle.remove().catch(() => {});
    }
  };
}

/**
 * Subscribes to network connectivity changes (both Capacitor Network plugin and browser events).
 */
export function subscribeNetworkStatus(onChange: (connected: boolean) => void): () => void {
  let netListener: { remove: () => Promise<void> } | null = null;

  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  if (isNativeAndroidOrIOS()) {
    Network.getStatus()
      .then((status) => onChange(status.connected))
      .catch(() => {});

    Network.addListener('networkStatusChange', (status) => {
      onChange(status.connected);
    })
      .then((handle) => {
        netListener = handle;
      })
      .catch(() => {});
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
    if (netListener) {
      netListener.remove().catch(() => {});
    }
  };
}
