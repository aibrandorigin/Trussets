import {
  AdminUser,
  AdminUserListItem,
  BuyingPlan,
  RentalPlan,
  BannersState,
  BannerItem,
  BlogPost,
  TestimonialItem,
  FraudReport,
  AdminNotification,
  AuditLogItem,
  UIPreferences,
  AdminKPIs,
  TaxAnalyticsSummary,
  HelpInquiry,
} from '../types/admin';
import { PropertyListing } from '../types';

const TOKEN_KEY = 'trussets_admin_token';

export const adminAuthStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('trussets_admin_auth', 'true');
    } catch (e) {
      console.error(e);
    }
  },
  clearToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('trussets_admin_auth');
      localStorage.removeItem('trussets_admin_user');
    } catch (e) {
      console.error(e);
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('trussets_admin_auth');
      localStorage.removeItem('trussets_admin_user');
    } catch (e) {
      console.error(e);
    }
  },
  isAuthenticated: (): boolean => {
    return !!adminAuthStorage.getToken();
  },
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = adminAuthStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error(err.message || `Network error connecting to ${endpoint}`);
  }

  if (response.status === 401) {
    // Session expired or invalid
    adminAuthStorage.clearToken();
    throw new Error('Unauthorized or session expired. Please log in again.');
  }

  // Safely extract and parse response text
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  let data: any = null;
  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  } else {
    // If the server responded with HTML (e.g. error page or Vite fallback)
    if (!response.ok) {
      throw new Error(`Server request failed with status ${response.status}`);
    }
    throw new Error(`Unexpected non-JSON response from ${endpoint}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const adminApi = {
  // Authentication
  login: async (email: string, password: string): Promise<{ token: string; admin: AdminUser }> => {
    const res = await apiRequest<{ success: boolean; token: string; admin: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    adminAuthStorage.setToken(res.token);
    return { token: res.token, admin: res.admin };
  },

  testLogin: async (email?: string): Promise<{ token: string; admin: AdminUser }> => {
    const res = await apiRequest<{ success: boolean; token: string; admin: AdminUser }>('/api/admin/test-login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    adminAuthStorage.setToken(res.token);
    return { token: res.token, admin: res.admin };
  },

  getTestAccounts: async (): Promise<{ accounts: Array<{ id: string; name: string; email: string; password: string; role: string; phone: string; description: string; badge: string }>; status: string }> => {
    return apiRequest('/api/admin/test-accounts');
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/api/admin/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  logout: async (): Promise<void> => {
    const token = adminAuthStorage.getToken();
    adminAuthStorage.clearToken();
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore network errors during logout
      }
    }
  },

  getMe: async (): Promise<{ admin: AdminUser }> => {
    return apiRequest<{ admin: AdminUser }>('/api/admin/me');
  },

  // Overview & Analytics
  getOverview: async (range = '30d'): Promise<{ kpis: AdminKPIs; charts: any; taxSummary?: TaxAnalyticsSummary }> => {
    return apiRequest(`/api/admin/overview?range=${encodeURIComponent(range)}`);
  },

  getAnalytics: async (range = '30d'): Promise<{ kpis: AdminKPIs; charts: any; taxSummary: TaxAnalyticsSummary }> => {
    return apiRequest(`/api/admin/analytics?range=${encodeURIComponent(range)}`);
  },

  // Users
  getUsers: async (params: {
    search?: string;
    userType?: string;
    verified?: string;
    status?: string;
    plan?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ users: AdminUserListItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    return apiRequest(`/api/admin/users?${searchParams.toString()}`);
  },

  getUser: async (id: string): Promise<{ user: AdminUserListItem; properties: PropertyListing[] }> => {
    return apiRequest(`/api/admin/users/${id}`);
  },

  createUser: async (data: {
    name: string;
    phone: string;
    email?: string;
    userType?: string;
    city?: string;
    location?: string;
    status?: 'Active' | 'Inactive';
    verified?: boolean;
    planName?: string;
  }): Promise<{ success: boolean; user: AdminUserListItem; message: string }> => {
    return apiRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: async (id: string, data: Partial<AdminUserListItem>): Promise<{ user: AdminUserListItem }> => {
    return apiRequest(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleUserVerify: async (id: string, verified?: boolean): Promise<{ user: AdminUserListItem }> => {
    return apiRequest(`/api/admin/users/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verified }),
    });
  },

  toggleUserStatus: async (id: string, status?: 'Active' | 'Inactive'): Promise<{ user: AdminUserListItem }> => {
    return apiRequest(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Properties
  getProperties: async (params: {
    search?: string;
    category?: string;
    transactionType?: string;
    city?: string;
    listingStatus?: string;
    verificationStatus?: string;
    propertyStatus?: string;
    propertyAgeRange?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ properties: PropertyListing[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    return apiRequest(`/api/admin/properties?${searchParams.toString()}`);
  },

  updateProperty: async (id: string, data: Partial<PropertyListing>): Promise<{ property: PropertyListing }> => {
    return apiRequest(`/api/admin/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  verifyProperty: async (id: string, verified: boolean): Promise<{ property: PropertyListing }> => {
    return apiRequest(`/api/admin/properties/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verified }),
    });
  },

  updatePropertyStatus: async (id: string, status: string): Promise<{ property: PropertyListing }> => {
    return apiRequest(`/api/admin/properties/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  deleteProperty: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/api/admin/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // Buying Plans
  getBuyingPlans: async (): Promise<{ plans: BuyingPlan[] }> => {
    return apiRequest('/api/admin/plans/buying');
  },

  createBuyingPlan: async (data: Partial<BuyingPlan>): Promise<{ plan: BuyingPlan }> => {
    return apiRequest('/api/admin/plans/buying', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBuyingPlan: async (id: string, data: Partial<BuyingPlan>): Promise<{ plan: BuyingPlan }> => {
    return apiRequest(`/api/admin/plans/buying/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteBuyingPlan: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/api/admin/plans/buying/${id}`, {
      method: 'DELETE',
    });
  },

  reorderBuyingPlans: async (orderedIds: string[]): Promise<{ plans: BuyingPlan[] }> => {
    return apiRequest('/api/admin/plans/buying-reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  },

  // Rental Plans
  getRentalPlans: async (): Promise<{ plans: RentalPlan[] }> => {
    return apiRequest('/api/admin/plans/rental');
  },

  createRentalPlan: async (data: Partial<RentalPlan>): Promise<{ plan: RentalPlan }> => {
    return apiRequest('/api/admin/plans/rental', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRentalPlan: async (id: string, data: Partial<RentalPlan>): Promise<{ plan: RentalPlan }> => {
    return apiRequest(`/api/admin/plans/rental/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteRentalPlan: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/api/admin/plans/rental/${id}`, {
      method: 'DELETE',
    });
  },

  reorderRentalPlans: async (orderedIds: string[]): Promise<{ plans: RentalPlan[] }> => {
    return apiRequest('/api/admin/plans/rental-reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  },

  // Banners
  getBanners: async (): Promise<{ banners: BannersState }> => {
    return apiRequest('/api/admin/banners');
  },

  updateBanners: async (section: keyof BannersState, items: BannerItem[]): Promise<{ banners: BannersState }> => {
    return apiRequest(`/api/admin/banners/${section}`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  // Blogs
  getBlogs: async (): Promise<{ blogs: BlogPost[] }> => {
    return apiRequest('/api/admin/blogs');
  },

  createBlog: async (data: Partial<BlogPost>): Promise<{ blog: BlogPost }> => {
    return apiRequest('/api/admin/blogs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBlog: async (id: string, data: Partial<BlogPost>): Promise<{ blog: BlogPost }> => {
    return apiRequest(`/api/admin/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteBlog: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/api/admin/blogs/${id}`, {
      method: 'DELETE',
    });
  },

  // Testimonials
  getTestimonials: async (): Promise<{ testimonials: TestimonialItem[] }> => {
    return apiRequest('/api/admin/testimonials');
  },

  createTestimonial: async (data: Partial<TestimonialItem>): Promise<{ testimonial: TestimonialItem }> => {
    return apiRequest('/api/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTestimonial: async (id: string, data: Partial<TestimonialItem>): Promise<{ testimonial: TestimonialItem }> => {
    return apiRequest(`/api/admin/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTestimonial: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/api/admin/testimonials/${id}`, {
      method: 'DELETE',
    });
  },

  reorderTestimonials: async (orderedIds: string[]): Promise<{ testimonials: TestimonialItem[] }> => {
    return apiRequest('/api/admin/testimonials-reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  },

  // Fraud Reports
  getFraudReports: async (): Promise<{ reports: FraudReport[] }> => {
    return apiRequest('/api/admin/fraud-reports');
  },

  updateFraudReportStatus: async (id: string, status: string, note?: string): Promise<{ report: FraudReport }> => {
    return apiRequest(`/api/admin/fraud-reports/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },

  addFraudReportNote: async (id: string, note: string): Promise<{ report: FraudReport }> => {
    return apiRequest(`/api/admin/fraud-reports/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  // Help Center Inquiries (Public & Admin)
  submitHelpInquiry: async (data: {
    fullName: string;
    phone: string;
    email?: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; inquiry: HelpInquiry; message: string }> => {
    const response = await fetch('/api/public/help-inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || 'Failed to submit inquiry.');
    }
    return resData;
  },

  getHelpInquiries: async (): Promise<{ inquiries: HelpInquiry[] }> => {
    return apiRequest('/api/admin/inquiries');
  },

  updateHelpInquiry: async (
    id: string,
    data: { status?: 'New' | 'In Progress' | 'Resolved' | 'Closed'; adminNotes?: string }
  ): Promise<{ success: boolean; inquiry: HelpInquiry }> => {
    return apiRequest(`/api/admin/inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteHelpInquiry: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/api/admin/inquiries/${id}`, {
      method: 'DELETE',
    });
  },

  // Notifications
  getNotifications: async (): Promise<{ notifications: AdminNotification[]; unreadCount: number }> => {
    return apiRequest('/api/admin/notifications');
  },

  markNotificationRead: async (id: string): Promise<{ notifications: AdminNotification[] }> => {
    return apiRequest(`/api/admin/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllNotificationsRead: async (): Promise<{ notifications: AdminNotification[] }> => {
    return apiRequest('/api/admin/notifications/read-all', {
      method: 'PUT',
    });
  },

  // Audit Logs
  getAuditLogs: async (): Promise<{ logs: AuditLogItem[] }> => {
    return apiRequest('/api/admin/audit-logs');
  },

  // UI Preferences
  getPreferences: async (): Promise<{ preferences: UIPreferences }> => {
    return apiRequest('/api/admin/preferences');
  },

  savePreferences: async (preferences: Partial<UIPreferences>): Promise<{ preferences: UIPreferences }> => {
    return apiRequest('/api/admin/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },

  // Platform Settings & Backup
  getSettings: async (): Promise<{ settings: any }> => {
    return apiRequest('/api/admin/settings');
  },

  updateSettings: async (settings: any): Promise<{ settings: any }> => {
    return apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiRequest('/api/admin/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Admin & Staff Account Management
  getAdmins: async (): Promise<{ staff: any[] }> => {
    return apiRequest('/api/admin/staff');
  },

  getAdminRoles: async (): Promise<{ roles: any[] }> => {
    return apiRequest('/api/admin/staff/roles');
  },

  createAdmin: async (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
    department?: string;
    permissions?: string[];
  }): Promise<{ success: boolean; staff: any }> => {
    return apiRequest('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAdmin: async (
    id: string,
    data: { role?: string; roleTitle?: string; department?: string; status?: 'Active' | 'Suspended'; permissions?: string[] }
  ): Promise<{ success: boolean; staff: any }> => {
    return apiRequest(`/api/admin/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  resetAdminPassword: async (id: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/api/admin/staff/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },

  deleteAdmin: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/api/admin/staff/${id}`, {
      method: 'DELETE',
    });
  },

  downloadBackup: () => {
    const token = adminAuthStorage.getToken();
    const link = document.createElement('a');
    link.href = `/api/admin/backup?token=${encodeURIComponent(token || '')}`;
    link.download = `trustsets-backup-${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Global Search
  globalSearch: async (q: string): Promise<{ results: any }> => {
    return apiRequest(`/api/admin/global-search?q=${encodeURIComponent(q)}`);
  },

  // Image & Logo Upload helpers
  uploadImage: async (file: File, type?: string): Promise<{ url: string; fileName: string; settings?: any }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await apiRequest<{ success: boolean; url: string; fileName: string; settings?: any }>('/api/admin/upload', {
            method: 'POST',
            body: JSON.stringify({
              base64Data,
              fileName: file.name,
              mimeType: file.type,
              type,
            }),
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  uploadLogo: async (file: File): Promise<{ url: string; fileName: string; settings?: any }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await apiRequest<{ success: boolean; url: string; fileName: string; settings?: any }>('/api/admin/upload-logo', {
            method: 'POST',
            body: JSON.stringify({
              base64Data,
              fileName: file.name,
              mimeType: file.type,
            }),
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },
};
