export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  lastLogin?: string;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'Property Sellers' | 'Property Buyers' | 'Tenants' | 'Property Owners';
  location: string;
  city: string;
  state: string;
  accountCreated: string;
  lastLogin: string;
  verified: boolean;
  status: 'Active' | 'Inactive';
  profilePhoto?: string;
  planId?: string;
  planName?: string;
  planType?: 'Buying' | 'Rental';
  planPrice?: number;
  planStartDate?: string;
  planEndDate?: string;
  listingsAllowed?: number;
  listingsUsed?: number;
  propertyName?: string;
  payments?: Array<{
    id: string;
    transactionId: string;
    invoiceNumber?: string;
    plan: string;
    planType?: 'Buying' | 'Rental';
    amount: number; // Plan Amount / Income Before Tax
    taxRate?: number; // e.g. 18% GST
    taxAmount?: number; // Tax Amount
    grandTotal?: number; // Grand (base + tax)
    paymentDate: string;
    paymentMethod?: string;
    status: 'Success' | 'Pending' | 'Failed';
  }>;
  activities?: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
}

export interface BuyingPlan {
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
  createdDate: string;
  updatedDate: string;
}

export interface RentalPlan {
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
  createdDate: string;
  updatedDate: string;
}

export interface BannerItem {
  id: string;
  title: string;
  altText: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  clickUrl: string;
  status: 'Active' | 'Inactive';
  displayOrder: number;
  startDate?: string;
  endDate?: string;
}

export interface BannersState {
  desktop: BannerItem[];
  mobile: BannerItem[];
  carousel1: BannerItem[];
  carousel2: BannerItem[];
  carousel3: BannerItem[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullContent: string;
  featuredImage: string;
  author: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  publishDate: string;
  status: 'Draft' | 'Published' | 'Scheduled' | 'Archived';
  views: number;
  createdDate: string;
  updatedDate: string;
}

export interface TestimonialItem {
  id: string;
  customerName: string;
  profileImage: string;
  userType: string;
  location: string;
  testimonial: string;
  rating: number;
  status: 'Published' | 'Unpublished';
  displayOrder: number;
  createdDate: string;
}

export interface FraudReport {
  id: string;
  reportedBy: string;
  reporterPhone?: string;
  reportedUser: string;
  reportedProperty: string;
  reportType: string;
  description: string;
  dateReported: string;
  evidence?: string;
  status: 'New' | 'Under Review' | 'Investigating' | 'Resolved' | 'Rejected' | 'Escalated';
  assignedAdmin: string;
  lastUpdated: string;
  internalNotes: Array<{
    id: string;
    admin: string;
    note: string;
    date: string;
  }>;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  linkModule: string;
}

export interface AuditLogItem {
  id: string;
  admin: string;
  action: string;
  module: string;
  recordAffected: string;
  timestamp: string;
  ip: string;
  previousValue?: string;
  newValue?: string;
}

export interface UIPreferences {
  sidebarOrder: string[];
  dashboardWidgetsOrder: string[];
  analyticsCardsOrder: string[];
}

export interface AdminKPIs {
  totalUsers: number;
  propertySellers: number;
  propertyBuyers: number;
  tenants: number;
  propertyOwners: number;
  totalProperties: number;
  activeProperties: number;
  pendingProperties: number;
  soldProperties: number;
  rentedProperties: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeBuyingPlans: number;
  activeRentalPlans: number;
  totalPlanPurchases: number;
  totalRevenue: number;
  totalBaseRevenue: number; // Plan Amount / Income Before Tax
  totalTaxAmount: number; // Tax Amount (18% GST)
  grandTotalRevenue: number; // Grand Total
  pendingFraudReports: number;
  unreadNotifications: number;
}

export interface PlanPaymentRecord {
  id: string;
  transactionId: string;
  invoiceNumber?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userType?: string;
  plan: string;
  planType: 'Buying' | 'Rental';
  amount: number; // Plan Amount / Income Before Tax
  taxRate: number; // Tax rate % (e.g. 18%)
  taxAmount: number; // Tax Amount
  grandTotal: number; // Grand Total
  paymentDate: string;
  paymentMethod?: string;
  status: 'Success' | 'Pending' | 'Failed';
}

export interface TaxPlanBreakdown {
  planName: string;
  planType: 'Buying' | 'Rental';
  count: number;
  baseAmount: number; // Income Before Tax
  taxAmount: number; // Tax Amount
  grandTotal: number; // Grand Total
}

export interface TaxMonthlyPoint {
  month: string;
  baseAmount: number; // Income Before Tax
  taxAmount: number; // Tax Amount
  grandTotal: number; // Grand Total
  count: number;
}

export interface TaxAnalyticsSummary {
  totalBaseRevenue: number; // Plan Amount / Income Before Tax
  totalTaxAmount: number; // Tax Amount
  grandTotalRevenue: number; // Grand Total
  totalTransactions: number;
  effectiveTaxRate: number; // e.g. 18
  taxRegime: string; // e.g. "GST (CGST 9% + SGST 9% / IGST 18%)"
  cgstAmount: number;
  sgstAmount: number;
  buyingPlans: {
    baseAmount: number;
    taxAmount: number;
    grandTotal: number;
    count: number;
  };
  rentalPlans: {
    baseAmount: number;
    taxAmount: number;
    grandTotal: number;
    count: number;
  };
  byPlan: TaxPlanBreakdown[];
  monthlyTrend: TaxMonthlyPoint[];
  transactions: PlanPaymentRecord[];
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  verificationEmail?: string;
  supportPhone: string;
  supportSecondaryPhone?: string;
  supportWhatsApp: string;
  supportHours?: string;
  operationalCenterTitle?: string;
  operationalAddress?: string;
  currency: string;
  defaultValidityDays: number;
  deedVerificationSLAHours: number;
  maxPropertyImages: number;
  autoPublishVerifiedListings: boolean;
  maintenanceMode: boolean;
  logoUrl?: string;
  logoWhiteUrl?: string;
  faviconUrl?: string;
}

export interface HelpInquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: 'New' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

