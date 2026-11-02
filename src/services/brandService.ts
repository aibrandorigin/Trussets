export interface BrandSettings {
  platformName: string;
  logoUrl?: string;
  logoWhiteUrl?: string;
  faviconUrl?: string;
  logoUpdatedAt?: number;
  supportEmail?: string;
  verificationEmail?: string;
  supportPhone?: string;
  supportSecondaryPhone?: string;
  supportWhatsApp?: string;
  supportHours?: string;
  operationalCenterTitle?: string;
  operationalAddress?: string;
}

const STORAGE_KEY = 'trustsets_brand_settings';
const EVENT_NAME = 'trustsets_brand_updated';
const BROADCAST_CHANNEL_NAME = 'trustsets_brand_sync_channel';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.debug('BroadcastChannel not available:', e);
  }
}

export const brandService = {
  getSettings(): BrandSettings {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          platformName: parsed.platformName || 'TrustSets',
          logoUrl: parsed.logoUrl !== undefined ? parsed.logoUrl : '/trussets-logo.svg',
          logoWhiteUrl: parsed.logoWhiteUrl !== undefined ? parsed.logoWhiteUrl : '/trussets-logo-white.svg',
          faviconUrl: parsed.faviconUrl !== undefined ? parsed.faviconUrl : '/favicon.svg',
          logoUpdatedAt: parsed.logoUpdatedAt,
          supportEmail: parsed.supportEmail || 'support@trussets.in',
          verificationEmail: parsed.verificationEmail || '',
          supportPhone: parsed.supportPhone || '+91 96526 63763',
          supportSecondaryPhone: parsed.supportSecondaryPhone || '',
          supportWhatsApp: parsed.supportWhatsApp || '+91 96526 63763',
          supportHours: parsed.supportHours || 'Monday – Saturday, 9:00 AM – 8:00 PM IST',
          operationalCenterTitle: parsed.operationalCenterTitle || 'Hyderabad Operational Center',
          operationalAddress: parsed.operationalAddress || 'Hyderabad, Telangana',
        };
      }
    } catch (e) {
      console.error('Error parsing cached brand settings:', e);
    }
    return {
      platformName: 'TrustSets',
      logoUrl: '/trussets-logo.svg',
      logoWhiteUrl: '/trussets-logo-white.svg',
      faviconUrl: '/favicon.svg',
      supportEmail: 'support@trussets.in',
      verificationEmail: '',
      supportPhone: '+91 96526 63763',
      supportSecondaryPhone: '',
      supportWhatsApp: '+91 96526 63763',
      supportHours: 'Monday – Saturday, 9:00 AM – 8:00 PM IST',
      operationalCenterTitle: 'Hyderabad Operational Center',
      operationalAddress: 'Hyderabad, Telangana',
    };
  },

  setSettings(settings: Partial<BrandSettings>) {
    try {
      const current = this.getSettings();
      const updated: BrandSettings = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      this.applyFavicon(updated.faviconUrl);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));

      // Broadcast to other open tabs in this browser
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({ type: 'BRAND_UPDATED', settings: updated });
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error saving brand settings to localStorage:', e);
    }
  },

  applyFavicon(faviconUrl?: string) {
    if (typeof document === 'undefined') return;
    const url = faviconUrl && faviconUrl.trim() !== '' ? faviconUrl : '/favicon.svg';

    let favIconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    if (favIconLinks.length > 0) {
      favIconLinks.forEach((link) => {
        link.href = url;
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = url;
      document.head.appendChild(link);
    }

    const appleLinks = document.querySelectorAll<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (appleLinks.length > 0) {
      appleLinks.forEach((link) => {
        link.href = url;
      });
    }
  },

  async syncWithServer(): Promise<BrandSettings> {
    try {
      const cached = this.getSettings();
      if (cached.faviconUrl) {
        this.applyFavicon(cached.faviconUrl);
      }

      const res = await fetch('/api/public/settings', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) {
          const brand: BrandSettings = {
            platformName: data.settings.platformName || 'TrustSets',
            logoUrl: data.settings.logoUrl || '/trussets-logo.svg',
            logoWhiteUrl: data.settings.logoWhiteUrl || '/trussets-logo-white.svg',
            faviconUrl: data.settings.faviconUrl || '/favicon.svg',
            logoUpdatedAt: data.settings.logoUpdatedAt,
            supportEmail: data.settings.supportEmail || 'support@trussets.in',
            verificationEmail: data.settings.verificationEmail || '',
            supportPhone: data.settings.supportPhone || '+91 96526 63763',
            supportSecondaryPhone: data.settings.supportSecondaryPhone || '',
            supportWhatsApp: data.settings.supportWhatsApp || '+91 96526 63763',
            supportHours: data.settings.supportHours || 'Monday – Saturday, 9:00 AM – 8:00 PM IST',
            operationalCenterTitle: data.settings.operationalCenterTitle || 'Hyderabad Operational Center',
            operationalAddress: data.settings.operationalAddress || 'Hyderabad, Telangana',
          };

          // Compare if changed before triggering update
          const changed =
            cached.logoUrl !== brand.logoUrl ||
            cached.logoWhiteUrl !== brand.logoWhiteUrl ||
            cached.faviconUrl !== brand.faviconUrl ||
            cached.platformName !== brand.platformName ||
            cached.logoUpdatedAt !== brand.logoUpdatedAt ||
            cached.supportEmail !== brand.supportEmail ||
            cached.verificationEmail !== brand.verificationEmail ||
            cached.supportPhone !== brand.supportPhone ||
            cached.supportSecondaryPhone !== brand.supportSecondaryPhone ||
            cached.supportWhatsApp !== brand.supportWhatsApp ||
            cached.supportHours !== brand.supportHours ||
            cached.operationalCenterTitle !== brand.operationalCenterTitle ||
            cached.operationalAddress !== brand.operationalAddress;

          if (changed) {
            this.setSettings(brand);
          }
          return brand;
        }
      }
    } catch (e) {
      console.warn('Could not fetch server brand settings:', e);
    }
    return this.getSettings();
  },

  subscribe(callback: (settings: BrandSettings) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<BrandSettings>;
      callback(customEvent.detail || this.getSettings());
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  },
};

// Automatic multi-browser / multi-tab cross synchronization
if (typeof window !== 'undefined') {
  // Sync on window focus / tab switch
  window.addEventListener('focus', () => {
    brandService.syncWithServer();
  });

  // Sync on document visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      brandService.syncWithServer();
    }
  });

  // Sync across tabs via storage event
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: brandService.getSettings() }));
    }
  });

  // Sync across tabs via BroadcastChannel
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'BRAND_UPDATED') {
        const detail = event.data.settings || brandService.getSettings();
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
      }
    };
  }

  // Periodic poll every 10 seconds to reflect admin logo changes across all devices/browsers automatically
  setInterval(() => {
    brandService.syncWithServer();
  }, 10000);
}
