import { UserProfile } from '../types';
import { normalizeMobile } from '../utils/phone';

const USER_ID_KEY = 'trussets_user_id';
const BROADCAST_CHANNEL_NAME = 'trussets_user_sync_channel';

// Create BroadcastChannel where supported for instantaneous cross-tab synchronization
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  syncChannel = null;
}

export function broadcastUserSync(action: string, payload?: any) {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ action, payload, timestamp: Date.now() });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trussets:sync', { detail: { action, payload } }));
    }
  } catch (e) {
    console.error('Failed broadcasting user sync event:', e);
  }
}

export function onUserSync(callback: (action: string, payload?: any) => void): () => void {
  const channelHandler = (event: MessageEvent) => {
    if (event.data && event.data.action) {
      callback(event.data.action, event.data.payload);
    }
  };

  const windowHandler = (event: Event) => {
    const custom = event as CustomEvent;
    if (custom.detail) {
      callback(custom.detail.action, custom.detail.payload);
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', channelHandler);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('trussets:sync', windowHandler);
  }

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', channelHandler);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('trussets:sync', windowHandler);
    }
  };
}

export function getStoredUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredUserId(id: string): void {
  try {
    localStorage.setItem(USER_ID_KEY, id);
  } catch (e) {
    console.error(e);
  }
}

export function clearStoredUserId(): void {
  try {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem('trussets_user');
  } catch (e) {
    console.error(e);
  }
}

// Transform server user record into frontend UserProfile format
export function mapServerUserToUserProfile(serverUser: any): UserProfile {
  const name = serverUser.name || '';
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((p: string) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  let role: 'owner' | 'buyer' | 'tenant' | 'admin' = 'buyer';
  if (serverUser.isAdmin || serverUser.isStaff) role = 'admin';
  else if (serverUser.userType === 'Property Owners') role = 'owner';
  else if (serverUser.userType === 'Property Sellers') role = 'owner';
  else if (serverUser.userType === 'Tenants') role = 'tenant';

  return {
    id: serverUser.id,
    name: serverUser.name || '',
    phone: serverUser.phone || '',
    email: serverUser.email || '',
    mobile_normalized: serverUser.mobile_normalized,
    mobile_verified: serverUser.mobile_verified ?? serverUser.verified ?? true,
    role: role,
    userType: serverUser.userType || 'Property Buyers',
    verifiedIdentity: serverUser.verified ?? true,
    avatarInitials: initials,
    city: serverUser.city || '',
    location: serverUser.location || serverUser.city || '',
    state: serverUser.state || '',
    joinedDate: serverUser.accountCreated || '2026',
    savedPropertyIds: Array.isArray(serverUser.savedPropertyIds) ? serverUser.savedPropertyIds : [],
    contactedPropertyIds: Array.isArray(serverUser.contactedPropertyIds) ? serverUser.contactedPropertyIds : [],
    planId: serverUser.planId,
    planName: serverUser.planName,
    planType: serverUser.planType,
    planPrice: serverUser.planPrice,
    planStartDate: serverUser.planStartDate,
    planEndDate: serverUser.planEndDate,
    status: serverUser.status || 'Active',
    listingsAllowed: serverUser.listingsAllowed || 5,
    listingsUsed: serverUser.listingsUsed || 0,
    listedProperties: serverUser.listedProperties || [],
    propertiesCount: serverUser.listedProperties?.length || 0,
    updated_at: serverUser.updated_at,
    version: serverUser.version,
    isAdmin: !!(serverUser.isAdmin || serverUser.isStaff),
    isStaff: !!serverUser.isStaff,
    staffRole: serverUser.staffRole || serverUser.role,
    staffRoleTitle: serverUser.staffRoleTitle || serverUser.roleTitle,
    staffAdminId: serverUser.staffAdminId,
  };
}

export const userService = {
  // Check if mobile already exists on server
  async checkMobile(phone: string): Promise<{ exists: boolean; normalized: string; display: string }> {
    const res = await fetch('/api/user/check-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to check mobile number');
    }
    return res.json();
  },

  // Direct Production SMS OTP Dispatch Endpoint (Requirement 3)
  async sendOtp(phone: string, purpose = 'login', isSignup = false): Promise<{
    success: boolean;
    message: string;
    phone: string;
    cooldownSeconds: number;
    expiresAt: string;
    isExistingUser: boolean;
  }> {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, purpose, isSignup }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to dispatch verification code');
      (err as any).code = data.code;
      (err as any).status = res.status;
      (err as any).cooldownSeconds = data.cooldownSeconds;
      throw err;
    }
    return data;
  },

  // Request OTP for Login or Signup (alias to sendOtp)
  async requestOtp(phone: string, isSignup = false): Promise<{
    success: boolean;
    message: string;
    display: string;
    cooldownSeconds?: number;
    expiresAt?: string;
    isExistingUser: boolean;
  }> {
    const data = await this.sendOtp(phone, isSignup ? 'signup' : 'login', isSignup);
    return {
      success: data.success,
      message: data.message,
      display: data.phone,
      cooldownSeconds: data.cooldownSeconds,
      expiresAt: data.expiresAt,
      isExistingUser: data.isExistingUser,
    };
  },

  // Direct Production SMS OTP Verification Endpoint (Requirement 3)
  async verifyOtp(phone: string, otp: string, purpose = 'login'): Promise<{
    valid: boolean;
    isExistingUser: boolean;
    user?: UserProfile;
    subscriptions?: any[];
    activeSubscription?: any;
    token?: string;
    verificationToken?: string;
    phone: string;
    mobile_normalized: string;
    message?: string;
  }> {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, purpose }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Verification failed');
      (err as any).code = data.code;
      (err as any).status = res.status;
      (err as any).remainingAttempts = data.remainingAttempts;
      throw err;
    }

    if (data.isExistingUser && data.user) {
      if (data.isAdmin && (data.adminToken || data.token)) {
        try {
          localStorage.setItem('trussets_admin_token', data.adminToken || data.token);
          localStorage.setItem('trussets_admin_auth', 'true');
          if (data.admin) {
            localStorage.setItem('trussets_admin_user', JSON.stringify(data.admin));
          }
        } catch (e) {
          console.error(e);
        }
      }
      const mapped = mapServerUserToUserProfile(data.user);
      setStoredUserId(mapped.id);
      broadcastUserSync('LOGIN', mapped);
      return {
        valid: true,
        isExistingUser: true,
        user: mapped,
        subscriptions: data.subscriptions || [],
        activeSubscription: data.activeSubscription || null,
        token: data.token,
        verificationToken: data.verificationToken,
        phone: data.phone,
        mobile_normalized: data.mobile_normalized,
        message: data.message,
      };
    }

    return {
      valid: true,
      isExistingUser: false,
      verificationToken: data.verificationToken,
      phone: data.phone,
      mobile_normalized: data.mobile_normalized,
      message: data.message,
    };
  },

  // Verify OTP status without creating fake user (Requirement 10 & 17)
  async verifyOtpStatus(phone: string, otp: string): Promise<{
    exists: boolean;
    user?: UserProfile;
    subscriptions?: any[];
    activeSubscription?: any;
    token?: string;
    verificationToken?: string;
    phone: string;
    mobile_normalized: string;
    message?: string;
  }> {
    const data = await this.verifyOtp(phone, otp, 'login');
    return {
      exists: data.isExistingUser,
      user: data.user,
      subscriptions: data.subscriptions,
      activeSubscription: data.activeSubscription,
      token: data.token,
      verificationToken: data.verificationToken,
      phone: data.phone,
      mobile_normalized: data.mobile_normalized,
      message: data.message,
    };
  },

  // Register New User with genuine details (Requirement 10, 13, 14, 15, 17, 18, 19, 20)
  async register(params: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    userType?: string;
    location?: string;
    city?: string;
    verificationToken?: string;
  }): Promise<{ user: UserProfile; subscriptions: any[]; activeSubscription: any; token: string }> {
    const res = await fetch('/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Registration failed');
      (err as any).code = data.code;
      throw err;
    }

    const mapped = mapServerUserToUserProfile(data.user);
    setStoredUserId(mapped.id);
    broadcastUserSync('LOGIN', mapped);

    return {
      user: mapped,
      subscriptions: data.subscriptions || [],
      activeSubscription: data.activeSubscription || null,
      token: data.token,
    };
  },

  // Email + Password Sign In (Requirement 11)
  async loginWithPassword(email: string, password: string): Promise<{
    user: UserProfile;
    subscriptions: any[];
    activeSubscription: any;
    token: string;
    isAdmin?: boolean;
    admin?: any;
  }> {
    const res = await fetch('/api/user/login-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Sign in failed');
      (err as any).code = data.code;
      throw err;
    }

    if (data.isAdmin && data.token) {
      try {
        localStorage.setItem('trussets_admin_token', data.token);
        localStorage.setItem('trussets_admin_auth', 'true');
        if (data.admin) {
          localStorage.setItem('trussets_admin_user', JSON.stringify(data.admin));
        }
      } catch (e) {
        console.error(e);
      }
    }

    const mapped = mapServerUserToUserProfile(data.user);
    setStoredUserId(mapped.id);
    broadcastUserSync('LOGIN', mapped);

    return {
      user: mapped,
      subscriptions: data.subscriptions || [],
      activeSubscription: data.activeSubscription || null,
      token: data.token,
      isAdmin: !!data.isAdmin,
      admin: data.admin || null,
    };
  },

  // Forgot Password
  async forgotPassword(emailOrPhone: string): Promise<{ message: string; devOtp?: string; identifier: string }> {
    const res = await fetch('/api/user/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to request password reset code');
    }
    return data;
  },

  // Reset Password
  async resetPassword(params: { emailOrPhone: string; otp: string; newPassword: string }): Promise<{ message: string }> {
    const res = await fetch('/api/user/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  },

  // Verify OTP and authenticate / register (legacy & backward-compatible wrapper)
  async verifyOtpAndLogin(params: {
    phone: string;
    otp: string;
    isSignup?: boolean;
    name?: string;
    email?: string;
    userType?: string;
    city?: string;
  }): Promise<{ user: UserProfile; subscriptions: any[]; activeSubscription: any; token: string }> {
    const res = await fetch('/api/user/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'OTP verification failed');
      (err as any).code = data.code;
      (err as any).status = res.status;
      throw err;
    }

    const mapped = mapServerUserToUserProfile(data.user);
    setStoredUserId(mapped.id);
    broadcastUserSync('LOGIN', mapped);

    return {
      user: mapped,
      subscriptions: data.subscriptions || [],
      activeSubscription: data.activeSubscription || null,
      token: data.token,
    };
  },

  // Fetch current authoritative user profile from database
  async fetchCurrentUser(): Promise<{ user: UserProfile | null; subscriptions: any[]; activeSubscription: any } | null> {
    const userId = getStoredUserId();
    if (!userId) return null;

    try {
      const res = await fetch(`/api/user/me?userId=${encodeURIComponent(userId)}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.status === 404 || res.status === 401) {
        clearStoredUserId();
        return null;
      }
      if (!res.ok) return null;

      const data = await res.json();
      if (!data?.user) return null;

      const mapped = mapServerUserToUserProfile(data.user);
      return {
        user: mapped,
        subscriptions: data.subscriptions || [],
        activeSubscription: data.activeSubscription || null,
      };
    } catch (e) {
      console.warn('Could not sync user from server:', e);
      return null;
    }
  },

  // Update profile data in backend
  async updateProfile(data: {
    userId: string;
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    location?: string;
    state?: string;
    userType?: string;
    profilePhoto?: string;
    newPassword?: string;
  }): Promise<UserProfile> {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Failed to update profile');
    }

    const mapped = mapServerUserToUserProfile(body.user);
    broadcastUserSync('PROFILE_UPDATED', mapped);
    return mapped;
  },

  // Request phone number change with OTP
  async requestPhoneChange(userId: string, newPhone: string): Promise<{ success: boolean; message: string; display: string; devOtp?: string; cooldownSeconds?: number; expiresAt?: string }> {
    const res = await fetch('/api/user/request-phone-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPhone }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body.error || 'Failed to request phone change');
      (err as any).code = body.code;
      throw err;
    }
    return body;
  },

  // Verify OTP and commit phone number change
  async verifyPhoneChange(userId: string, newPhone: string, otp: string): Promise<UserProfile> {
    const res = await fetch('/api/user/verify-phone-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPhone, otp }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Failed to verify phone change');
    }

    const mapped = mapServerUserToUserProfile(body.user);
    broadcastUserSync('PHONE_UPDATED', mapped);
    return mapped;
  },

  // Authoritative Wishlist operations
  async fetchWishlist(userId: string): Promise<string[]> {
    try {
      const res = await fetch(`/api/user/wishlist?userId=${encodeURIComponent(userId)}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.savedPropertyIds) ? data.savedPropertyIds : [];
      }
    } catch (e) {
      console.warn('Failed fetching wishlist from server:', e);
    }
    return [];
  },

  async toggleWishlist(userId: string, propertyId: string): Promise<string[]> {
    const res = await fetch('/api/user/wishlist/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, propertyId }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Failed to update wishlist');
    }

    const updatedList = Array.isArray(body.savedPropertyIds) ? body.savedPropertyIds : [];
    broadcastUserSync('WISHLIST_UPDATED', updatedList);
    return updatedList;
  },

  // Logout
  logout(): void {
    clearStoredUserId();
    try {
      localStorage.removeItem('trussets_admin_token');
      localStorage.removeItem('trussets_admin_auth');
      localStorage.removeItem('trussets_admin_user');
    } catch (e) {
      console.error(e);
    }
    broadcastUserSync('LOGOUT');
  },
};
