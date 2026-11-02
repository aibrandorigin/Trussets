export type TransactionType = 'buy' | 'rent';

export type PropertyCategory = 
  | 'all'
  | 'plots'
  | 'lands'
  | 'apartments'
  | 'villas'
  | 'commercial'
  | 'farmhouses'
  | 'warehouses'
  | 'commercial_yard'
  | 'luxury';

export type UploaderType = 'individual' | 'builder' | 'landlord_poa';

export type PropertyStatus = 'NEW' | 'OLD';

export interface PropertyListing {
  id: string;
  title: string;
  subtitle: string;
  transactionType: TransactionType;
  category: PropertyCategory;
  categoryName: string;
  price: number;
  priceDisplay: string;
  pricePerUnit?: string;
  isNegotiable: boolean;
  city: string;
  locality: string;
  district: string;
  state: string;
  pincode?: string;
  sro?: string; // Sub-Registration Office
  mapCoordinates?: string;
  googleMapLink?: string;
  listedDate: string;
  
  // Specs & Metrics
  bhk?: string;
  areaSqFt?: number;
  landSqYds?: number;
  landAcres?: number;
  carpetAreaSqFt?: number;
  facing: string;
  roadWidthFt?: number;
  floorInfo?: string;
  totalFloors?: number;
  furnishing?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  possessionStatus: 'Ready for Registration' | 'Ready to Move In' | 'Under Construction (2025-2026)';
  propertyStatus?: PropertyStatus | null; // 'NEW' | 'OLD' | null
  propertyAge?: number | null; // e.g. 0, 5, 8 (in Years)
  propertyAgeYears?: number;
  parkingSlots?: string;
  
  // Verification Badges
  primaryBadge: string;
  badgeType: 'verified-deed' | 'hmda-dtcp' | 'ec-clear' | 'pattadar' | 'oc-certified' | 'verified-owner';
  uploaderType: UploaderType;
  uploaderName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  
  // Legal Integrity
  reraNumber?: string;
  reraApproved: boolean | 'NA';
  municipalApproval: string; // HMDA, BDA, DTCP, GHMC, etc.
  ecYears: number; // e.g. 30
  saleDeedVerified: boolean;
  mortgageStatus: 'Free From Loan' | 'Under Loan' | 'NPA / Loan Default';
  courtLitigations: 'No' | 'Yes';
  bankLoanSanctions: 'Yes' | 'No' | 'To be verified';
  
  // Rental specific
  monthlyRent?: number;
  advanceDeposit?: number;
  monthlyMaintenance?: number;
  leasePeriodMonths?: number;
  
  // Amenities & Checklist
  amenities: string[];
  locationHighlights: string[];
  
  // Images
  images: string[];
  description: string;

  // Access Control & Protected State
  contactAccess?: boolean;
  hasFullAccess?: boolean;
  ownerId?: string;
  userId?: string;
}

export interface CityInfo {
  name: string;
  state: string;
  isPopular?: boolean;
  tier?: 'metro' | 'tier2' | 'tier3';
  places?: string[];
}

export type ActivePage = 'home' | 'buy' | 'rent' | 'post-property' | 'profile' | 'admin' | 'property-plans' | 'terms' | 'privacy' | 'about' | 'help';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'owner' | 'buyer' | 'tenant' | 'admin';
  verifiedIdentity: boolean;
  avatarInitials: string;
  city: string;
  joinedDate: string;
  savedPropertyIds: string[];
  contactedPropertyIds: string[];
  
  // Identity & Normalization
  mobile_normalized?: string;
  mobile_verified?: boolean;
  userType?: 'Property Sellers' | 'Property Buyers' | 'Tenants' | 'Property Owners' | string;
  location?: string;
  state?: string;
  updated_at?: string;
  version?: number;

  // Plan & Subscription Information
  planId?: string;
  planName?: string;
  planType?: 'Buying' | 'Rental';
  planPrice?: number;
  planStartDate?: string;
  planEndDate?: string;
  categoriesAllowed?: string[];
  status?: 'Active' | 'Inactive';
  listingsAllowed?: number;
  listingsUsed?: number;
  listedProperties?: PropertyListing[];
  propertiesCount?: number;

  // Admin & Platform Staff Information
  isAdmin?: boolean;
  isStaff?: boolean;
  staffRole?: string;
  staffRoleTitle?: string;
  staffAdminId?: string;
}
