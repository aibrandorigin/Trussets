import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';

/**
 * Authoritative Production Backend URL for Trussets.
 * Used when the React bundle runs inside the Android Capacitor WebView (https://localhost)
 * so that Android and Website share the exact same live production backend and database.
 */
export const PRODUCTION_API_ORIGIN =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  'https://trussets.com';

const FALLBACK_API_ORIGIN = 'https://www.trussets.com';

export function isNativeAndroidOrIOS(): boolean {
  try {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const host = window.location.hostname;
      if (
        protocol === 'capacitor:' ||
        protocol === 'file:' ||
        (host === 'localhost' && !window.location.port && Boolean((window as any).Capacitor))
      ) {
        return true;
      }
    }
  } catch {
    // fallback
  }
  return false;
}

/**
 * Resolves any relative `/api/...` or `/uploads/...` URL to the live production backend
 * when running inside the Capacitor native container.
 */
export function resolveProductionUrl(url: string, baseOrigin: string = PRODUCTION_API_ORIGIN): string {
  if (!url) return url;
  if (isNativeAndroidOrIOS()) {
    const cleanOrigin = baseOrigin.replace(/\/$/, '');
    if (url.startsWith('/api/') || url === '/api' || url.startsWith('/uploads/')) {
      return `${cleanOrigin}${url}`;
    }
    if (url.startsWith('https://localhost/api/') || url.startsWith('http://localhost/api/')) {
      const pathPart = url.replace(/^https?:\/\/localhost/, '');
      return `${cleanOrigin}${pathPart}`;
    }
    if (url.startsWith('https://localhost/uploads/') || url.startsWith('http://localhost/uploads/')) {
      const pathPart = url.replace(/^https?:\/\/localhost/, '');
      return `${cleanOrigin}${pathPart}`;
    }
  }
  return url;
}

function extractRelativeApiPath(input: RequestInfo | URL): string | null {
  let rawUrl = '';
  if (typeof input === 'string') {
    rawUrl = input;
  } else if (typeof URL !== 'undefined' && input instanceof URL) {
    rawUrl = input.toString();
  } else if (typeof Request !== 'undefined' && input instanceof Request) {
    rawUrl = input.url;
  }

  if (!rawUrl) return null;

  if (rawUrl.startsWith('/api/') || rawUrl === '/api' || rawUrl.startsWith('/uploads/')) {
    return rawUrl;
  }

  if (
    rawUrl.startsWith('https://localhost/api/') ||
    rawUrl.startsWith('http://localhost/api/') ||
    rawUrl.startsWith('https://localhost/uploads/') ||
    rawUrl.startsWith('http://localhost/uploads/')
  ) {
    return rawUrl.replace(/^https?:\/\/localhost/, '');
  }

  if (rawUrl.startsWith('https://trussets.com/api/') || rawUrl.startsWith('https://www.trussets.com/api/')) {
    return rawUrl.replace(/^https:\/\/(www\.)?trussets\.com/, '');
  }

  return null;
}

function normalizeRequestHeaders(headersInit?: HeadersInit, hasBody?: boolean): Record<string, string> {
  const result: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
  };

  if (headersInit) {
    if (typeof Headers !== 'undefined' && headersInit instanceof Headers) {
      headersInit.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headersInit)) {
      for (const [key, value] of headersInit) {
        result[key] = value;
      }
    } else if (typeof headersInit === 'object') {
      Object.assign(result, headersInit as Record<string, string>);
    }
  }

  // Capacitor Android HttpURLConnection checks exact case "Content-Type"
  let contentTypeValue: string | undefined;
  for (const key of Object.keys(result)) {
    if (key.toLowerCase() === 'content-type') {
      contentTypeValue = result[key];
      if (key !== 'Content-Type') {
        delete result[key];
      }
    }
  }

  if (contentTypeValue) {
    result['Content-Type'] = contentTypeValue;
  } else if (hasBody) {
    result['Content-Type'] = 'application/json';
  }

  return result;
}

function rewriteRelativeUploadUrls(jsonText: string): string {
  if (!jsonText || !jsonText.includes('/uploads/')) return jsonText;
  return jsonText.replace(/"\/uploads\//g, `"${PRODUCTION_API_ORIGIN.replace(/\/$/, '')}/uploads/`);
}

async function executeNativeApiRequest(
  apiPath: string,
  init?: RequestInit,
  origin: string = PRODUCTION_API_ORIGIN
): Promise<Response> {
  const targetUrl = `${origin.replace(/\/$/, '')}${apiPath}`;
  const method = (init?.method || 'GET').toUpperCase();
  const rawBody = init?.body;
  const hasBody = rawBody !== undefined && rawBody !== null && method !== 'GET' && method !== 'HEAD';
  const headers = normalizeRequestHeaders(init?.headers, hasBody);

  let requestData: any = undefined;
  if (hasBody) {
    if (typeof rawBody === 'string') {
      if ((headers['Content-Type'] || '').includes('application/json')) {
        try {
          requestData = JSON.parse(rawBody);
        } catch {
          requestData = rawBody;
        }
      } else {
        requestData = rawBody;
      }
    } else {
      requestData = rawBody;
    }
  }

  const nativeResponse = await CapacitorHttp.request({
    url: targetUrl,
    method,
    headers,
    data: requestData,
    connectTimeout: 25000,
    readTimeout: 25000,
  });

  const status = typeof nativeResponse.status === 'number' && nativeResponse.status > 0 ? nativeResponse.status : 200;
  const responseHeaders = new Headers();
  if (nativeResponse.headers && typeof nativeResponse.headers === 'object') {
    for (const [k, v] of Object.entries(nativeResponse.headers)) {
      if (k && typeof v === 'string') {
        try {
          responseHeaders.set(k, v);
        } catch {
          // ignore invalid header names from native HttpURLConnection (e.g. null status line)
        }
      }
    }
  }

  if (!responseHeaders.has('Content-Type')) {
    responseHeaders.set('Content-Type', 'application/json');
  }

  let bodyString: string | null = null;
  if (status !== 204 && status !== 304) {
    if (typeof nativeResponse.data === 'string') {
      bodyString = rewriteRelativeUploadUrls(nativeResponse.data);
    } else if (nativeResponse.data !== undefined && nativeResponse.data !== null) {
      bodyString = rewriteRelativeUploadUrls(JSON.stringify(nativeResponse.data));
    } else {
      bodyString = '';
    }
  }

  return new Response(bodyString, {
    status,
    headers: responseHeaders,
  });
}

let fetchInterceptorInstalled = false;
let pluginsInitialized = false;

/**
 * Installs a transparent window.fetch interceptor ONLY for Capacitor native builds so
 * every existing `fetch('/api/...')` call automatically routes to the live production
 * Trussets backend (`https://trussets.com`) using Capacitor's native Android HTTP engine
 * (bypassing WebView CORS restrictions).
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
      const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const apiPath = extractRelativeApiPath(input);
        if (apiPath) {
          try {
            return await executeNativeApiRequest(apiPath, init, PRODUCTION_API_ORIGIN);
          } catch (primaryErr) {
            try {
              return await executeNativeApiRequest(apiPath, init, FALLBACK_API_ORIGIN);
            } catch {
              const resolvedUrl = resolveProductionUrl(apiPath, PRODUCTION_API_ORIGIN);
              return originalFetch(resolvedUrl, {
                ...init,
                mode: 'cors',
              });
            }
          }
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

  if (!pluginsInitialized) {
    pluginsInitialized = true;

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
}

// Install fetch interceptor immediately upon module evaluation on native platforms
initCapacitorNativeBridge();

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
