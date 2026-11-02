import { getDb } from '../db.ts';

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

/**
 * Mask sensitive phone number e.g. "+91 98490 •••••"
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '+91 ••••• •••••';
  const clean = phone.trim();
  if (clean.length > 7) {
    return clean.slice(0, clean.length - 5) + '•••••';
  }
  return '••••••••••';
}

/**
 * Mask sensitive owner name e.g. "P. V•••• R•••• (Direct Owner)"
 */
export function maskOwnerName(name?: string, uploaderType?: string): string {
  if (!name) return 'Direct Property Owner';
  if (uploaderType && uploaderType !== 'individual') {
    // Builder or partner company names can remain partially or fully recognizable
    return name;
  }
  const parts = name.split(' ');
  const maskedParts = parts.map((part) => {
    if (part.startsWith('(')) return part; // keep suffix like (Direct Owner)
    if (part.length <= 2) return part;
    return part[0] + '••••' + (part.length > 5 ? part.slice(-1) : '');
  });
  return maskedParts.join(' ');
}

/**
 * Centralized server-side entitlement check:
 * canAccessPropertyDetails(userId, propertyId, isAdmin)
 */
export function canAccessPropertyDetails(
  userId: string | undefined,
  propertyId: string,
  isAdmin: boolean = false
): EntitlementCheckResult {
  const db = getDb();
  const property = db.properties.find((p: any) => p.id === propertyId);

  if (!property) {
    return {
      hasAccess: false,
      requiredPlanType: 'Buying',
      reason: 'PROPERTY_NOT_FOUND',
      message: 'Property not found.',
    };
  }

  const transactionType: 'buy' | 'rent' = property.transactionType || 'buy';
  const requiredPlanType: 'Buying' | 'Rental' = transactionType === 'rent' ? 'Rental' : 'Buying';
  const propertyCategory = property.category || 'all';

  const fullProtectedDetails: ProtectedDetails = {
    uploaderName: property.uploaderName,
    ownerPhone: property.ownerPhone,
    ownerWhatsapp: property.ownerWhatsapp,
    exactAddress: `${property.locality}, ${property.district}, ${property.city} - ${property.pincode || '500075'}`,
    sro: property.sro || 'District Registration Jurisdiction',
    googleMapLink: property.googleMapLink || '',
    mapCoordinates: property.mapCoordinates || '',
  };

  // 1. Admin Exception (Requirement 15)
  if (isAdmin) {
    return {
      hasAccess: true,
      requiredPlanType,
      reason: 'ADMIN_ACCESS',
      message: 'Full access granted under Administrator privileges.',
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
      protectedDetails: fullProtectedDetails,
    };
  }

  // 2. Authentication Check (Requirement 5 Case C)
  if (!userId) {
    return {
      hasAccess: false,
      requiredPlanType,
      reason: 'NOT_LOGGED_IN',
      message: 'Please log in to verify your active plan and view complete owner details.',
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
    };
  }

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return {
      hasAccess: false,
      requiredPlanType,
      reason: 'NOT_LOGGED_IN',
      message: 'User account not found. Please log in again.',
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
    };
  }

  // 3. Property Owner Exception (Requirement 15)
  // An owner/seller can always view complete details of their own property even if their plan expired
  const cleanUserPhone = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
  const cleanPropPhone = property.ownerPhone ? property.ownerPhone.replace(/\D/g, '').slice(-10) : '';

  const isOwner =
    (property.ownerId && property.ownerId === user.id) ||
    (property.userId && property.userId === user.id) ||
    (cleanUserPhone && cleanPropPhone && cleanUserPhone === cleanPropPhone) ||
    (property.uploaderName && user.name && property.uploaderName.trim().toLowerCase() === user.name.trim().toLowerCase());

  if (isOwner) {
    return {
      hasAccess: true,
      requiredPlanType,
      reason: 'OWNER_ACCESS',
      message: 'Owner access: You are the verified owner of this listing.',
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
      protectedDetails: fullProtectedDetails,
    };
  }

  // 4. Plan Existence Check (Requirement 5 Case B)
  if (!user.planName && !user.planId) {
    return {
      hasAccess: false,
      requiredPlanType,
      reason: 'NO_ACTIVE_PLAN',
      message: `An active ${requiredPlanType} Plan is required to view full contact and owner details.`,
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
    };
  }

  // Determine user's plan type
  const userPlanType: 'Buying' | 'Rental' =
    user.planType ||
    (user.planName?.toLowerCase().includes('rental') ||
    user.planName?.toLowerCase().includes('tenant') ||
    user.planName?.toLowerCase().includes('landlord')
      ? 'Rental'
      : 'Buying');

  const userPlanSummary = {
    id: user.planId,
    name: user.planName,
    type: userPlanType,
    startDate: user.planStartDate,
    endDate: user.planEndDate,
    status: user.status,
  };

  // 5. Plan Type Check (Requirement 6, 7, 8)
  // Buying Plan does NOT unlock Rental details; Rental Plan does NOT unlock Buying details!
  if (userPlanType !== requiredPlanType) {
    return {
      hasAccess: false,
      requiredPlanType,
      reason: 'WRONG_PLAN_TYPE',
      message:
        requiredPlanType === 'Buying'
          ? 'This property is for Sale and requires an active Buying Plan. Your active plan is a Rental Plan.'
          : 'This property is for Rent and requires an active Rental Plan. Your active plan is a Buying Plan.',
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
      userPlan: userPlanSummary,
    };
  }

  // 6. Plan Expiration & Status Check (Requirement 9)
  // Check user status, start date, and end date
  if (user.status !== 'Active') {
    return {
      hasAccess: false,
      requiredPlanType,
      reason: 'PLAN_EXPIRED',
      message: 'Your account/plan is currently inactive. Please renew your plan.',
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
      userPlan: userPlanSummary,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (user.planStartDate && todayStr < user.planStartDate) {
    return {
      hasAccess: false,
      requiredPlanType,
      reason: 'NO_ACTIVE_PLAN',
      message: `Your plan starts on ${user.planStartDate}. It is not active yet.`,
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
      userPlan: userPlanSummary,
    };
  }

  if (user.planEndDate && todayStr > user.planEndDate) {
    return {
      hasAccess: false,
      requiredPlanType,
      reason: 'PLAN_EXPIRED',
      message: `Your ${user.planName} expired on ${user.planEndDate}. Please renew your plan to continue viewing property details.`,
      propertyTitle: property.title,
      propertyCategory,
      transactionType,
      userPlan: userPlanSummary,
    };
  }

  // 7. Plan Category Restrictions Check (Requirement 10)
  // Find the plan schema definition from buyingPlans or rentalPlans
  const allPlans = [...db.buyingPlans, ...db.rentalPlans];
  const matchedPlan = allPlans.find(
    (p: any) =>
      (user.planId && p.id === user.planId) ||
      (user.planName && p.name.toLowerCase() === user.planName.toLowerCase())
  );

  const categoriesAllowed: string[] =
    matchedPlan?.categoriesAllowed ||
    (user as any).categoriesAllowed ||
    [];

  if (categoriesAllowed.length > 0 && !categoriesAllowed.includes('all')) {
    const isCategoryAllowed = categoriesAllowed.includes(propertyCategory);
    if (!isCategoryAllowed) {
      return {
        hasAccess: false,
        requiredPlanType,
        reason: 'CATEGORY_NOT_COVERED',
        message: `Your ${user.planName} allows ${categoriesAllowed.join(', ')}, but this property is categorized under ${propertyCategory}. Please upgrade your plan.`,
        propertyTitle: property.title,
        propertyCategory,
        transactionType,
        userPlan: {
          ...userPlanSummary,
          categoriesAllowed,
        },
      };
    }
  }

  // 8. All checks passed -> Grant access (Requirement 5 Case A)
  return {
    hasAccess: true,
    requiredPlanType,
    reason: 'ACTIVE_PLAN_VALID',
    message: `Full property details unlocked with your ${user.planName}.`,
    propertyTitle: property.title,
    propertyCategory,
    transactionType,
    userPlan: {
      ...userPlanSummary,
      categoriesAllowed,
    },
    protectedDetails: fullProtectedDetails,
  };
}

/**
 * Strips or masks protected property fields for public or unauthorized consumers
 * (Requirement 13)
 */
export function sanitizePropertyForPublic(property: any, hasFullAccess: boolean = false) {
  if (hasFullAccess) {
    return {
      ...property,
      contactAccess: true,
      hasFullAccess: true,
    };
  }

  // Omit or mask sensitive fields
  return {
    ...property,
    uploaderName: maskOwnerName(property.uploaderName, property.uploaderType),
    ownerPhone: maskPhoneNumber(property.ownerPhone),
    ownerWhatsapp: '',
    googleMapLink: '', // omit exact location pin for unentitled
    contactAccess: false,
    hasFullAccess: false,
  };
}
