import { UserProfile } from '../types';

export interface ProtectedDetails {
  uploaderName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  exactAddress?: string;
  sro?: string;
  googleMapLink?: string;
  mapCoordinates?: string;
}

export interface EntitlementCheckResult {
  hasAccess: boolean;
  requiredPlanType: 'Buying' | 'Rental';
  reason:
    | 'ACTIVE_PLAN_VALID'
    | 'OWNER_ACCESS'
    | 'ADMIN_ACCESS'
    | 'NOT_LOGGED_IN'
    | 'NO_ACTIVE_PLAN'
    | 'PLAN_EXPIRED'
    | 'WRONG_PLAN_TYPE'
    | 'CATEGORY_NOT_COVERED'
    | 'PROPERTY_NOT_FOUND';
  message: string;
  propertyTitle?: string;
  propertyCategory?: string;
  transactionType?: 'buy' | 'rent';
  userPlan?: {
    id?: string;
    name?: string;
    type?: 'Buying' | 'Rental';
    startDate?: string;
    endDate?: string;
    categoriesAllowed?: string[];
    status?: string;
  };
  protectedDetails?: ProtectedDetails;
}

export interface PublicPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  listingsAllowed: number;
  validityDays: number;
  categoriesAllowed: string[];
  additionalPoints: string[];
  status: 'Active' | 'Inactive';
  displayOrder: number;
}

export const propertyAccessService = {
  /**
   * Centralized Server-Side Access Check API (Requirement 14)
   */
  async checkPropertyAccess(propertyId: string, userId?: string): Promise<EntitlementCheckResult> {
    try {
      const url = userId
        ? `/api/properties/${encodeURIComponent(propertyId)}/access-check?userId=${encodeURIComponent(userId)}`
        : `/api/properties/${encodeURIComponent(propertyId)}/access-check`;

      const headers: Record<string, string> = {};
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Failed access check: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.warn('Backend access check offline or error, evaluating locally:', e);
      // Fallback evaluation if backend is temporarily unreachable
      return {
        hasAccess: false,
        requiredPlanType: 'Buying',
        reason: 'NOT_LOGGED_IN',
        message: 'Unable to verify plan status. Please ensure you are logged in.',
      };
    }
  },

  /**
   * Fetch active public Buying and Rental plans (Requirement 8)
   */
  async fetchPublicPlans(): Promise<{ buyingPlans: PublicPlan[]; rentalPlans: PublicPlan[] }> {
    try {
      const res = await fetch('/api/public/plans');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('Failed to fetch public plans:', e);
      return { buyingPlans: [], rentalPlans: [] };
    }
  },

  /**
   * Purchase or activate a plan (Requirement 12)
   */
  async purchasePlan(params: {
    userId: string;
    planId: string;
    planType: 'Buying' | 'Rental';
    name?: string;
    phone?: string;
    email?: string;
    paymentMethod?: string;
  }) {
    const res = await fetch('/api/plans/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Purchase failed: HTTP ${res.status}`);
    }
    return await res.json();
  },

  /**
   * User login / quick switch
   */
  async userLogin(params: {
    userId?: string;
    phone?: string;
    email?: string;
    name?: string;
  }): Promise<{ success: boolean; user: any; token: string }> {
    const res = await fetch('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return await res.json();
  },

  /**
   * Fetch current user profile with active plans and listed properties
   */
  async getCurrentUser(userId: string) {
    try {
      const res = await fetch('/api/user/me', {
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  /**
   * Fetch demo/test users for easy testing of all plan scenarios (Requirement 16)
   */
  async fetchTestUsers() {
    try {
      const res = await fetch('/api/public/test-users');
      if (!res.ok) return [];
      const data = await res.json();
      return data.testUsers || [];
    } catch {
      return [];
    }
  },
};
