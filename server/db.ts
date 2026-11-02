import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth.ts';
import { INITIAL_PROPERTIES } from '../src/data/mockProperties.ts';
import { normalizeMobile } from './utils/phone.ts';

const DB_FILE = path.join(process.cwd(), 'data', 'database.json');
const DB_BACKUP_FILE = path.join(process.cwd(), 'data', 'database.backup.json');
const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');

// Interface definition for database schema
export interface DatabaseSchema {
  admins: Array<{
    id: string;
    email: string;
    phone: string;
    name: string;
    role: string;
    roleTitle?: string;
    department?: string;
    status?: 'Active' | 'Suspended' | 'Inactive';
    permissions?: string[];
    isOriginalSuperAdmin?: boolean;
    promotedFromUserId?: string;
    promotedFromUserName?: string;
    assignedBy?: string;
    passwordHash: string;
    salt: string;
    createdAt: string;
    lastLogin: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    mobile_normalized?: string;
    mobile_verified?: boolean;
    passwordHash?: string;
    salt?: string;
    userType: 'Property Sellers' | 'Property Buyers' | 'Tenants' | 'Property Owners';
    location: string;
    city: string;
    state: string;
    accountCreated: string;
    lastLogin: string;
    verified: boolean;
    status: 'Active' | 'Inactive';
    savedPropertyIds?: string[];
    contactedPropertyIds?: string[];
    updated_at?: string;
    version?: number;
    isStaff?: boolean;
    staffRole?: string;
    staffRoleTitle?: string;
    staffAdminId?: string;
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
      taxRate?: number; // percentage (18% GST)
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
  }>;
  properties: Array<any>;
  buyingPlans: Array<{
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
  }>;
  rentalPlans: Array<{
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
  }>;
  banners: {
    desktop: Array<{
      id: string;
      title: string;
      altText: string;
      imageUrl: string;
      clickUrl: string;
      status: 'Active' | 'Inactive';
      displayOrder: number;
      startDate: string;
      endDate: string;
    }>;
    mobile: Array<{
      id: string;
      title: string;
      altText: string;
      mobileImageUrl: string;
      clickUrl: string;
      status: 'Active' | 'Inactive';
      displayOrder: number;
      startDate: string;
      endDate: string;
    }>;
    carousel1: Array<{
      id: string;
      title: string;
      altText: string;
      imageUrl: string;
      clickUrl: string;
      status: 'Active' | 'Inactive';
      displayOrder: number;
    }>;
    carousel2: Array<{
      id: string;
      title: string;
      altText: string;
      imageUrl: string;
      clickUrl: string;
      status: 'Active' | 'Inactive';
      displayOrder: number;
    }>;
    carousel3: Array<{
      id: string;
      title: string;
      altText: string;
      imageUrl: string;
      clickUrl: string;
      status: 'Active' | 'Inactive';
      displayOrder: number;
    }>;
  };
  blogs: Array<{
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
  }>;
  testimonials: Array<{
    id: string;
    customerName: string;
    profileImage: string;
    userType: 'Property Buyer' | 'Property Seller' | 'Tenant' | 'Property Owner';
    location: string;
    testimonial: string;
    rating: number;
    status: 'Published' | 'Unpublished';
    displayOrder: number;
    createdDate: string;
  }>;
  fraudReports: Array<{
    id: string;
    reportedBy: string;
    reporterPhone?: string;
    reportedUser: string;
    reportedProperty: string;
    reportType: 'Suspicious Title' | 'Fake Listing' | 'Unauthorized Broker' | 'Payment Fraud' | 'Duplicate Property';
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
  }>;
  notifications: Array<{
    id: string;
    type: 'user' | 'property' | 'plan' | 'fraud' | 'testimonial' | 'blog' | 'system';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
    linkModule: string;
  }>;
  auditLogs: Array<{
    id: string;
    admin: string;
    action: string;
    module: string;
    recordAffected: string;
    timestamp: string;
    ip: string;
    previousValue?: string;
    newValue?: string;
  }>;
  preferences: {
    sidebarOrder: string[];
    dashboardWidgetsOrder: string[];
    analyticsCardsOrder: string[];
  };
  settings: {
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
    logoDataUrl?: string;
    logoWhiteDataUrl?: string;
    faviconDataUrl?: string;
    logoUpdatedAt?: number;
  };
  subscriptions: Array<SubscriptionRecord>;
  otps?: Array<OtpRecord>;
  helpInquiries?: Array<{
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
  }>;
}

export interface OtpRecord {
  id: string;
  mobile: string;
  phoneDisplay: string;
  otpHash: string;
  salt: string;
  purpose: string;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  consumed: boolean;
  createdAt: string;
  expiresAt: string;
  verifiedAt?: string;
  ip?: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planType: 'Buying' | 'Rental';
  purchaseTransactionId: string;
  invoiceNumber?: string;
  price: number;
  purchasedAt: string;
  startsAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  listingsAllowed: number;
  listingsUsed: number;
  categoriesAllowed: string[];
}

let dbCache: DatabaseSchema | null = null;
let lastDbMtimeMs = 0;

// Atomic database write with UNIQUE(mobile_normalized) database constraint enforcement and cloud persistence
export function saveDb(data: DatabaseSchema, syncToCloud = true): void {
  try {
    // Database-level constraint: UNIQUE(mobile_normalized)
    const mobileIndex = new Map<string, string>(); // mobile_normalized -> userId
    if (data.users && Array.isArray(data.users)) {
      for (const u of data.users) {
        if (!u.mobile_normalized && u.phone) {
          const norm = normalizeMobile(u.phone);
          if (norm) {
            u.mobile_normalized = norm.normalized;
          }
        }

        if (u.mobile_normalized) {
          const existingUserId = mobileIndex.get(u.mobile_normalized);
          if (existingUserId && existingUserId !== u.id) {
            const err = new Error(
              `DATABASE_CONSTRAINT_VIOLATION: UNIQUE constraint failed: users.mobile_normalized. Mobile number ${u.mobile_normalized} is already associated with user ${existingUserId}.`
            );
            (err as any).code = 'UNIQUE_CONSTRAINT_VIOLATION';
            throw err;
          }
          mobileIndex.set(u.mobile_normalized, u.id);
        }
      }
    }

    // Safety Guard: Prevent saving empty properties array if database previously had records
    if (dbCache && dbCache.properties && dbCache.properties.length > 0 && (!data.properties || data.properties.length === 0)) {
      const err = new Error('DATABASE_SAFETY_VIOLATION: Attempted to save an empty properties array over an existing populated database. Operation aborted.');
      console.error(err);
      throw err;
    }

    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    // Maintain persistent backup of current database file before replacing
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatingBackup = path.join(BACKUPS_DIR, `database-${timestamp}.json`);
        fs.copyFileSync(DB_FILE, rotatingBackup);

        // Keep maximum 10 rotating backups
        const existingBackups = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith('database-') && f.endsWith('.json')).sort();
        if (existingBackups.length > 10) {
          existingBackups.slice(0, existingBackups.length - 10).forEach(f => {
            try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch {}
          });
        }
      } catch (backupErr) {
        console.warn('Non-fatal: Could not create database backup copy:', backupErr);
      }
    }

    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    dbCache = data;
    try {
      lastDbMtimeMs = fs.statSync(DB_FILE).mtimeMs;
    } catch {
      lastDbMtimeMs = Date.now();
    }

    // Asynchronously synchronize canonical data to persistent Cloud SQL database
    if (syncToCloud) {
      import('./cloudSqlSync.ts')
        .then(({ pushToCloudSql }) => pushToCloudSql(data))
        .catch((err) => console.warn('[CLOUD SQL SYNC] Cloud SQL sync warning:', err));
    }
  } catch (err) {
    console.error('Failed to save database atomically:', err);
    throw err;
  }
}

// Dynamic property owner data enrichment: distinguishes Current Profile from Snapshot
export function enrichPropertyWithOwner(property: any, users?: any[]): any {
  if (!property) return property;
  const allUsers = users || (dbCache ? dbCache.users : getDb().users);
  const ownerUserId = property.ownerId || property.ownerUserId || property.userId;
  
  // Find authoritative user
  const authoritativeUser = allUsers.find(
    (u: any) => u.id === ownerUserId || (property.ownerPhone && u.mobile_normalized && normalizeMobile(property.ownerPhone)?.normalized === u.mobile_normalized)
  );

  // Preserve snapshot for historical reference if not already preserved
  const historicalSnapshot = property.historicalSnapshot || {
    originalOwnerName: property.ownerName || property.uploaderName,
    originalOwnerPhone: property.ownerPhone,
    originalListedDate: property.listedDate,
  };

  if (authoritativeUser) {
    return {
      ...property,
      ownerUserId: authoritativeUser.id,
      ownerId: authoritativeUser.id,
      ownerName: authoritativeUser.name,
      ownerPhone: authoritativeUser.phone,
      ownerEmail: authoritativeUser.email,
      uploaderName: `${authoritativeUser.name} (${authoritativeUser.userType === 'Property Owners' ? 'Direct Owner' : authoritativeUser.userType === 'Property Sellers' ? 'Property Seller' : 'Direct Owner'})`,
      historicalSnapshot,
    };
  }

  return {
    ...property,
    historicalSnapshot,
  };
}

// Initial Seed Data Generator
function generateInitialDatabase(): DatabaseSchema {
  // Hash password '111111' securely
  const { hash, salt } = hashPassword('111111');

  return {
    admins: [
      {
        id: 'admin-trussets-1',
        email: 'trussets@gmail.com',
        phone: '9652663763',
        name: 'TrustSets Super Administrator',
        role: 'super_admin',
        passwordHash: hash,
        salt: salt,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLogin: new Date().toISOString(),
      },
    ],
    users: [
      {
        id: 'usr-101',
        name: 'P. Venkat Reddy',
        email: 'venkat.reddy@gmail.com',
        phone: '+91 98490 23456',
        userType: 'Property Sellers',
        location: 'Kokapet, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        accountCreated: '2026-01-14',
        lastLogin: '2026-09-17',
        verified: true,
        status: 'Active',
        profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        planId: 'plan-buy-gold',
        planName: 'Gold Seller Pack',
        planType: 'Buying',
        planPrice: 4999,
        planStartDate: '2026-07-01',
        planEndDate: '2026-10-01',
        listingsAllowed: 5,
        listingsUsed: 2,
        propertyName: '4 BHK Triplex Luxury Villa',
        payments: [
          {
            id: 'pay-1',
            transactionId: 'TXN-984210',
            invoiceNumber: 'INV-2026-001',
            plan: 'Gold Seller Pack',
            planType: 'Buying',
            amount: 4999,
            taxRate: 18,
            taxAmount: 899.82,
            grandTotal: 5898.82,
            paymentDate: '2026-07-01',
            paymentMethod: 'UPI (PhonePe)',
            status: 'Success',
          },
        ],
        activities: [
          { id: 'act-1', type: 'Login', description: 'User logged in from Hyderabad', date: '2026-09-17 10:30' },
          { id: 'act-2', type: 'Property', description: 'Updated listing price for Kokapet Villa', date: '2026-08-20 14:10' },
          { id: 'act-3', type: 'Plan', description: 'Purchased Gold Seller Pack', date: '2026-07-01 09:15' },
        ],
      },
      {
        id: 'usr-102',
        name: 'S. Ramakrishna',
        email: 's.ramakrishna@yahoo.co.in',
        phone: '+91 98850 34567',
        userType: 'Property Owners',
        location: 'Mokila, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        accountCreated: '2026-02-05',
        lastLogin: '2026-09-15',
        verified: true,
        status: 'Active',
        profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        planId: 'plan-buy-silver',
        planName: 'Silver Land Pack',
        planType: 'Buying',
        planPrice: 2499,
        planStartDate: '2026-06-15',
        planEndDate: '2026-09-15',
        listingsAllowed: 2,
        listingsUsed: 1,
        propertyName: '200 Sq. Yds Residential Plot',
        payments: [
          {
            id: 'pay-2',
            transactionId: 'TXN-872341',
            invoiceNumber: 'INV-2026-002',
            plan: 'Silver Land Pack',
            planType: 'Buying',
            amount: 2499,
            taxRate: 18,
            taxAmount: 449.82,
            grandTotal: 2948.82,
            paymentDate: '2026-06-15',
            paymentMethod: 'Net Banking (SBI)',
            status: 'Success',
          },
        ],
        activities: [
          { id: 'act-4', type: 'Verification', description: 'Submitted 30-year EC documents', date: '2026-06-20 11:45' },
        ],
      },
      {
        id: 'usr-103',
        name: 'K. S. Narayanan',
        email: 'narayanan.ks@gmail.com',
        phone: '+91 94440 12890',
        userType: 'Property Owners',
        location: 'Financial District, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        accountCreated: '2026-03-10',
        lastLogin: '2026-09-18',
        verified: true,
        status: 'Active',
        profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        planId: 'plan-rent-landlord',
        planName: 'Premium Landlord',
        planType: 'Rental',
        planPrice: 3499,
        planStartDate: '2026-08-01',
        planEndDate: '2026-11-01',
        listingsAllowed: 3,
        listingsUsed: 1,
        propertyName: '3 BHK High-Rise Flat',
        payments: [
          {
            id: 'pay-3',
            transactionId: 'TXN-654812',
            invoiceNumber: 'INV-2026-003',
            plan: 'Premium Landlord',
            planType: 'Rental',
            amount: 3499,
            taxRate: 18,
            taxAmount: 629.82,
            grandTotal: 4128.82,
            paymentDate: '2026-08-01',
            paymentMethod: 'Debit Card (HDFC)',
            status: 'Success',
          },
        ],
        activities: [
          { id: 'act-5', type: 'Login', description: 'User signed in', date: '2026-09-18 08:22' },
        ],
      },
      {
        id: 'usr-104',
        name: 'Pooja Agarwal',
        email: 'pooja.agarwal@outlook.com',
        phone: '+91 98200 45678',
        userType: 'Property Buyers',
        location: 'Bandra West, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        accountCreated: '2026-04-12',
        lastLogin: '2026-09-16',
        verified: true,
        status: 'Active',
        profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        planId: 'plan-buy-buyer-prime',
        planName: 'Direct Buyer Pass',
        planType: 'Buying',
        planPrice: 999,
        planStartDate: '2026-09-01',
        planEndDate: '2026-10-01',
        listingsAllowed: 0,
        listingsUsed: 0,
        payments: [
          {
            id: 'pay-4',
            transactionId: 'TXN-419082',
            invoiceNumber: 'INV-2026-004',
            plan: 'Direct Buyer Pass',
            planType: 'Buying',
            amount: 999,
            taxRate: 18,
            taxAmount: 179.82,
            grandTotal: 1178.82,
            paymentDate: '2026-09-01',
            paymentMethod: 'UPI (Google Pay)',
            status: 'Success',
          },
        ],
        activities: [
          { id: 'act-6', type: 'Enquiry', description: 'Contacted owner for Sea View Apartment', date: '2026-09-16 16:40' },
        ],
      },
      {
        id: 'usr-105',
        name: 'Rahul Varma',
        email: 'rahul.varma@gmail.com',
        phone: '+91 97000 88990',
        userType: 'Tenants',
        location: 'Indiranagar, Bengaluru',
        city: 'Bengaluru',
        state: 'Karnataka',
        accountCreated: '2026-05-18',
        lastLogin: '2026-09-17',
        verified: false,
        status: 'Active',
        profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        planId: 'plan-rent-tenant-assist',
        planName: 'Zero Brokerage Tenant',
        planType: 'Rental',
        planPrice: 499,
        planStartDate: '2026-09-05',
        planEndDate: '2026-10-05',
        listingsAllowed: 0,
        listingsUsed: 0,
        payments: [
          {
            id: 'pay-5',
            transactionId: 'TXN-321789',
            invoiceNumber: 'INV-2026-005',
            plan: 'Zero Brokerage Tenant',
            planType: 'Rental',
            amount: 499,
            taxRate: 18,
            taxAmount: 89.82,
            grandTotal: 588.82,
            paymentDate: '2026-09-05',
            paymentMethod: 'Credit Card (ICICI)',
            status: 'Success',
          },
        ],
        activities: [
          { id: 'act-7', type: 'Search', description: 'Saved 4 rental flats in Indiranagar', date: '2026-09-17 19:12' },
        ],
      },
      {
        id: 'usr-106',
        name: 'Deepak Chopra Realties',
        email: 'deepak.c@builders-network.in',
        phone: '+91 98111 22334',
        userType: 'Property Sellers',
        location: 'Golf Course Road, Gurugram',
        city: 'Gurugram',
        state: 'Haryana',
        accountCreated: '2026-03-22',
        lastLogin: '2026-09-14',
        verified: true,
        status: 'Active',
        profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        planId: 'plan-buy-platinum',
        planName: 'Platinum Developer Suite',
        planType: 'Buying',
        planPrice: 9999,
        planStartDate: '2026-06-01',
        planEndDate: '2026-12-01',
        listingsAllowed: 20,
        listingsUsed: 4,
        propertyName: '4 BHK Luxury Penthouse',
        payments: [
          {
            id: 'pay-6',
            transactionId: 'TXN-110293',
            invoiceNumber: 'INV-2026-006',
            plan: 'Platinum Developer Suite',
            planType: 'Buying',
            amount: 9999,
            taxRate: 18,
            taxAmount: 1799.82,
            grandTotal: 11798.82,
            paymentDate: '2026-06-01',
            paymentMethod: 'Corporate Net Banking (Axis)',
            status: 'Success',
          },
        ],
        activities: [
          { id: 'act-8', type: 'Listing', description: 'Published 4 BHK Penthouse in Gurugram', date: '2026-08-11' },
        ],
      },
    ],
    properties: INITIAL_PROPERTIES.map(p => ({
      ...p,
      propertyStatus: p.propertyStatus || (p.propertyAgeYears === 0 || p.propertyAge === 0 ? 'NEW' : (p.propertyAgeYears && p.propertyAgeYears > 1 ? 'OLD' : 'NEW')),
      propertyAge: p.propertyAge !== undefined ? p.propertyAge : (p.propertyAgeYears !== undefined ? p.propertyAgeYears : 0),
      verificationStatus: p.saleDeedVerified ? 'Verified' : 'Pending',
      listingStatus: 'Published',
      plan: 'Gold Plan',
      updatedDate: p.listedDate || '2026-08-20',
    })),
    buyingPlans: [
      {
        id: 'plan-buy-free',
        name: 'Free Basic Seller',
        description: 'Ideal for individual owners looking to list 1 direct property with basic verification.',
        price: 0,
        listingsAllowed: 1,
        validityDays: 30,
        categoriesAllowed: ['plots', 'apartments', 'villas'],
        additionalPoints: [
          '1 Verified Owner Listing',
          'Zero Brokerage Inquiries',
          'Basic Direct WhatsApp Connect',
          'Standard Search Placement',
        ],
        status: 'Active',
        displayOrder: 1,
        createdDate: '2026-01-10',
        updatedDate: '2026-08-15',
      },
      {
        id: 'plan-buy-silver',
        name: 'Silver Owner Express',
        description: 'Enhanced visibility with automated title verification and direct WhatsApp leads.',
        price: 1999,
        listingsAllowed: 2,
        validityDays: 60,
        categoriesAllowed: ['plots', 'lands', 'apartments', 'villas'],
        additionalPoints: [
          '2 Verified Listings with Trust Badge',
          'Featured in City Category Bar',
          'Fast-Track Title Deed Check',
          'Direct Owner-Buyer Connect',
          'Instant SMS & WhatsApp Alerts',
        ],
        status: 'Active',
        displayOrder: 2,
        createdDate: '2026-01-10',
        updatedDate: '2026-08-20',
      },
      {
        id: 'plan-buy-gold',
        name: 'Gold Prime Seller',
        description: 'Maximum exposure on TrustSets homepage, priority deed audit, and high-intent buyer inquiries.',
        price: 4999,
        listingsAllowed: 5,
        validityDays: 90,
        categoriesAllowed: ['plots', 'lands', 'apartments', 'villas', 'commercial', 'farmhouses'],
        additionalPoints: [
          '5 Prime Listings with Verified Deed Badge',
          'Top of Search Placement across City',
          'Featured Tag on Homepage Carousel',
          'Dedicated TrustSets Relationship Lead',
          'Priority 30-Year EC Verification Support',
          'Social Media & Email Blast Promotion',
        ],
        status: 'Active',
        displayOrder: 3,
        createdDate: '2026-01-10',
        updatedDate: '2026-09-01',
      },
      {
        id: 'plan-buy-platinum',
        name: 'Platinum Developer Suite',
        description: 'For builders, farm plot developers, and large asset liquidators requiring bulk inventory support.',
        price: 11999,
        listingsAllowed: 20,
        validityDays: 180,
        categoriesAllowed: ['plots', 'lands', 'apartments', 'villas', 'commercial', 'farmhouses', 'warehouses', 'luxury'],
        additionalPoints: [
          '20 Verified Project & Plot Listings',
          'Top Billboard & Category Banner Placement',
          'RERA & Municipal Approval Showcase Badge',
          'Dedicated Key Account Manager',
          'Verified Corporate Buyer Matchmaking',
          'Zero Commission / 0% Brokerage Guarantee',
        ],
        status: 'Active',
        displayOrder: 4,
        createdDate: '2026-01-10',
        updatedDate: '2026-09-10',
      },
    ],
    rentalPlans: [
      {
        id: 'plan-rent-free',
        name: 'Basic Rental Listing',
        description: 'Free listing for individual landlords to find verified direct tenants without brokerage fees.',
        price: 0,
        listingsAllowed: 1,
        validityDays: 30,
        categoriesAllowed: ['apartments', 'villas'],
        additionalPoints: [
          '1 Rental Property Listing',
          'Direct Tenant Chat & Phone',
          'Zero Middlemen / 0% Commission',
        ],
        status: 'Active',
        displayOrder: 1,
        createdDate: '2026-02-01',
        updatedDate: '2026-08-10',
      },
      {
        id: 'plan-rent-landlord',
        name: 'Owner Plus Rental',
        description: 'Priority tenant discovery, tenant profile pre-screening, and featured banner placement.',
        price: 1499,
        listingsAllowed: 2,
        validityDays: 60,
        categoriesAllowed: ['apartments', 'villas', 'commercial'],
        additionalPoints: [
          '2 Active Rental Listings',
          'Featured Listing in Rental Section',
          'Verified Working Professionals Pre-Screening',
          'Standard Rental Agreement Draft Template',
          'Dedicated Customer Support',
        ],
        status: 'Active',
        displayOrder: 2,
        createdDate: '2026-02-01',
        updatedDate: '2026-08-25',
      },
      {
        id: 'plan-rent-premium',
        name: 'Prime Landlord Portfolio',
        description: 'Multi-unit property landlords with corporate tenant preference and guaranteed lead volume.',
        price: 3499,
        listingsAllowed: 5,
        validityDays: 90,
        categoriesAllowed: ['apartments', 'villas', 'commercial', 'warehouses'],
        additionalPoints: [
          '5 Verified Rental Listings',
          'Top Spotlight in City Rental Search',
          'Corporate Relocation Leads Priority',
          'Police Verification & KYC Assist Template',
          'Personalized WhatsApp Concierge',
        ],
        status: 'Active',
        displayOrder: 3,
        createdDate: '2026-02-01',
        updatedDate: '2026-09-05',
      },
    ],
    banners: {
      desktop: [
        {
          id: 'ban-desk-1',
          title: 'Direct Owners Real Estate Movement',
          altText: 'Direct owners zero brokerage properties across India',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80',
          clickUrl: '#listings-container',
          status: 'Active',
          displayOrder: 1,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
        {
          id: 'ban-desk-2',
          title: 'Verified Title Deeds & 30-Year EC',
          altText: 'No fake listings verified land and villas on Trussets',
          imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&auto=format&fit=crop&q=80',
          clickUrl: '#listings-container',
          status: 'Active',
          displayOrder: 2,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
      ],
      mobile: [
        {
          id: 'ban-mob-1',
          title: 'Mobile Hero Banner: Zero Brokerage Real Estate',
          altText: 'Trussets mobile banner verified homes',
          mobileImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
          clickUrl: '#listings-container',
          status: 'Active',
          displayOrder: 1,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
        {
          id: 'ban-mob-2',
          title: 'Direct WhatsApp Contact with Owners',
          altText: 'Connect directly with owners on WhatsApp',
          mobileImageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
          clickUrl: '#listings-container',
          status: 'Active',
          displayOrder: 2,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
      ],
      carousel1: [
        {
          id: 'car1-1',
          title: 'Exclusive High-Rise Flats',
          altText: 'Luxury flats with direct registration',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
          clickUrl: '#listings-container',
          status: 'Active',
          displayOrder: 1,
        },
        {
          id: 'car1-2',
          title: 'Gated Villa Communities',
          altText: 'Direct owner triplex villas',
          imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80',
          clickUrl: '#listings-container',
          status: 'Active',
          displayOrder: 2,
        },
      ],
      carousel2: [
        {
          id: 'car2-1',
          title: 'Clear Title Residential Plots',
          altText: 'HMDA and DTCP approved layouts',
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
          clickUrl: '#listings-container',
          status: 'Active',
          displayOrder: 1,
        },
      ],
      carousel3: [
        {
          id: 'car3-1',
          title: 'Commercial Office & Retail Spaces',
          altText: 'Zero brokerage commercial property leasing',
          imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
          clickUrl: '#listings-container',
          status: 'Active',
          displayOrder: 1,
        },
      ],
    },
    blogs: [
      {
        id: 'blog-1',
        title: 'How to Check 30-Year Encumbrance Certificates (EC) in India Before Buying Land',
        slug: 'how-to-check-encumbrance-certificate-ec-india',
        shortDescription: 'A complete step-by-step legal guide on verifying property title deeds, Meeseva/IGRS portals, and spotting fake registration claims.',
        fullContent: `Buying real estate is one of the largest financial commitments anyone makes. Yet thousands of buyers fall prey to disputed properties or forged title deeds.

### What is an Encumbrance Certificate (EC)?
An Encumbrance Certificate contains registered transaction records against a specific survey number, plot, or flat for a designated timeframe. It discloses:
1. Prior registered sale deeds
2. Active mortgages with banks
3. Court attachments or injunctions
4. Partition deeds and gift deeds

### Steps to Verify Online:
- Visit your state registration portal (e.g. IGRS Telangana, Kaveri Karnataka, or IGR Maharashtra).
- Enter the Sub-Registration Office (SRO), district, survey number, and house number.
- Always demand a continuous **30-year search** rather than a shallow 5-year check.
- Cross-verify link documents back to the original layout sanction.

TrustSets automatically flags properties where owners provide verified continuous EC certificates.`,
        featuredImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1000&auto=format&fit=crop&q=80',
        author: 'Advocate V. Ramanathan (Legal Counsel)',
        category: 'Legal Verification',
        tags: ['EC', 'Legal Check', 'Registration', 'Due Diligence'],
        seoTitle: 'How to Verify 30-Year Encumbrance Certificate (EC) in India - TrustSets Guide',
        seoDescription: 'Step by step legal guide on checking Encumbrance Certificate online to verify clean title deeds and avoid real estate litigation in India.',
        seoKeywords: ['encumbrance certificate', 'EC check online', 'property title verification', 'igrs search'],
        publishDate: '2026-08-18',
        status: 'Published',
        views: 1420,
        createdDate: '2026-08-15',
        updatedDate: '2026-08-18',
      },
      {
        id: 'blog-2',
        title: 'Zero Brokerage vs Middlemen: Why Direct Owner Real Estate is Revolutionizing India',
        slug: 'zero-brokerage-vs-middlemen-india-real-estate',
        shortDescription: 'Discover how eliminating 2% seller and 2% buyer brokerage saves families lakhs of rupees while improving communication transparency.',
        fullContent: `For decades, property transactions in India have suffered from opaque middleman structures where unauthorized brokers inflate prices, fabricate false buyer bids, and charge exorbitant commissions.

### The Real Cost of Brokerage
On a ₹2 Crore home:
- Seller pays: ₹4,00,000 (2%)
- Buyer pays: ₹4,00,000 (2%)
- **Total Lost to Middlemen:** ₹8,00,000!

With TrustSets, buyers and owners connect directly with verified identity and direct WhatsApp/Phone channels.`,
        featuredImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1000&auto=format&fit=crop&q=80',
        author: 'TrustSets Research Team',
        category: 'Market Insights',
        tags: ['Zero Brokerage', 'Real Estate Trends', 'Savings', 'Direct Owners'],
        seoTitle: 'Why Zero Brokerage Real Estate is Transforming India - TrustSets',
        seoDescription: 'Save lakhs on property purchases and rentals with zero brokerage direct owner networks.',
        seoKeywords: ['zero brokerage', 'direct owner property', 'no middleman real estate'],
        publishDate: '2026-09-02',
        status: 'Published',
        views: 890,
        createdDate: '2026-09-01',
        updatedDate: '2026-09-02',
      },
    ],
    testimonials: [
      {
        id: 'test-1',
        customerName: 'P. Venkat Reddy',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        userType: 'Property Seller',
        location: 'Kokapet, Hyderabad',
        testimonial: 'Listed my triplex villa on TrustSets without paying a single rupee of brokerage. Had 4 genuine high-budget buyers visit within 10 days. The title deed verification badge gave buyers instant confidence!',
        rating: 5,
        status: 'Published',
        displayOrder: 1,
        createdDate: '2026-08-28',
      },
      {
        id: 'test-2',
        customerName: 'Ananya Sharma',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        userType: 'Property Buyer',
        location: 'Bengaluru, Karnataka',
        testimonial: 'Finding an apartment in Whitefield without intrusive brokers demanding 1 month brokerage felt impossible until I used TrustSets. Spoke directly with the owner, checked the RERA documents, and completed the deal peacefully.',
        rating: 5,
        status: 'Published',
        displayOrder: 2,
        createdDate: '2026-09-04',
      },
      {
        id: 'test-3',
        customerName: 'K. S. Narayanan',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        userType: 'Property Owner',
        location: 'Financial District, Hyderabad',
        testimonial: 'Zero brokerage for landlords is a blessing. My high-rise flat was rented out to an IT professional within 72 hours of listing. Clean UI, transparent details, and prompt verification.',
        rating: 5,
        status: 'Published',
        displayOrder: 3,
        createdDate: '2026-09-12',
      },
    ],
    fraudReports: [
      {
        id: 'REP-2026-081',
        reportedBy: 'Kavita Menon',
        reporterPhone: '+91 98330 11223',
        reportedUser: 'Broker masquerading as Direct Owner',
        reportedProperty: 'prop-3',
        reportType: 'Unauthorized Broker',
        description: 'Caller stated they represent a brokerage agency demanding 1% commission after I clicked the listing. The listing says direct owner.',
        dateReported: '2026-09-14 11:20',
        evidence: 'Screenshot of WhatsApp chat with agent asking for ₹50,000 token advance before showing.',
        status: 'Under Review',
        assignedAdmin: 'TrustSets Super Administrator',
        lastUpdated: '2026-09-15 14:00',
        internalNotes: [
          {
            id: 'note-1',
            admin: 'TrustSets Admin',
            note: 'Called the registered owner number. The owner confirmed his brother listed it. Warned them regarding broker representation.',
            date: '2026-09-15 14:00',
          },
        ],
      },
      {
        id: 'REP-2026-079',
        reportedBy: 'Sanjay Deshmukh',
        reporterPhone: '+91 98201 99887',
        reportedUser: 'Unknown User',
        reportedProperty: 'prop-plot-99',
        reportType: 'Suspicious Title',
        description: 'Notice of litigation found on the plot in local newspaper archives. Please re-audit link documents.',
        dateReported: '2026-09-10 16:45',
        evidence: 'Court Case Case No. OS 412/2024 citation.',
        status: 'Investigating',
        assignedAdmin: 'TrustSets Super Administrator',
        lastUpdated: '2026-09-12 09:30',
        internalNotes: [
          {
            id: 'note-2',
            admin: 'Legal Audit Team',
            note: 'Sent notification to owner requesting court disposal order or NOC from litigant.',
            date: '2026-09-12 09:30',
          },
        ],
      },
    ],
    notifications: [
      {
        id: 'notif-1',
        type: 'user',
        title: 'New User Registration',
        description: 'Deepak Chopra Realties registered as Property Seller.',
        timestamp: '2026-09-18 09:45',
        isRead: false,
        linkModule: 'users',
      },
      {
        id: 'notif-2',
        type: 'property',
        title: 'New Property Submitted for Verification',
        description: '4 BHK Triplex Luxury Villa submitted with 30-Yr EC documents.',
        timestamp: '2026-09-18 08:30',
        isRead: false,
        linkModule: 'properties',
      },
      {
        id: 'notif-3',
        type: 'plan',
        title: 'Plan Purchased: Platinum Suite',
        description: 'Deepak Chopra Realties purchased Platinum Developer Suite (₹9,999).',
        timestamp: '2026-09-17 17:15',
        isRead: false,
        linkModule: 'plans',
      },
      {
        id: 'notif-4',
        type: 'fraud',
        title: 'New Fraud Report Filed',
        description: 'Unauthorized Broker report submitted by Kavita Menon (REP-2026-081).',
        timestamp: '2026-09-14 11:20',
        isRead: true,
        linkModule: 'fraudReports',
      },
    ],
    auditLogs: [
      {
        id: 'log-1',
        admin: 'TrustSets Super Administrator',
        action: 'System Bootstrapped',
        module: 'System',
        recordAffected: 'Initial Seed',
        timestamp: '2026-09-18 07:00',
        ip: '127.0.0.1',
      },
    ],
    preferences: {
      sidebarOrder: [
        'overview',
        'users',
        'properties',
        'analytics',
        'plans',
        'banners',
        'blogs',
        'testimonials',
        'fraudReports',
        'notifications',
      ],
      dashboardWidgetsOrder: [
        'kpiCards',
        'chartsOverview',
        'recentUsers',
        'recentProperties',
        'recentFraudReports',
      ],
      analyticsCardsOrder: [
        'userAnalytics',
        'propertyAnalytics',
        'subscriptionAnalytics',
        'revenueAnalytics',
      ],
    },
    settings: {
      platformName: 'TrustSets',
      supportEmail: 'support@trustsets.com',
      supportPhone: '+91 9652663763',
      supportWhatsApp: '+91 9652663763',
      currency: 'INR (₹)',
      defaultValidityDays: 30,
      deedVerificationSLAHours: 24,
      maxPropertyImages: 15,
      autoPublishVerifiedListings: true,
      maintenanceMode: false,
      logoUrl: '/trussets-logo.svg',
      logoWhiteUrl: '/trussets-logo-white.svg',
      faviconUrl: '/favicon.svg',
      logoUpdatedAt: Date.now(),
    },
    subscriptions: [
      {
        id: 'sub-usr-101-init',
        userId: 'usr-101',
        planId: 'plan-buy-gold',
        planName: 'Gold Seller Pack',
        planType: 'Buying',
        purchaseTransactionId: 'TXN-984210',
        invoiceNumber: 'INV-2026-001',
        price: 4999,
        purchasedAt: '2026-07-01T00:00:00.000Z',
        startsAt: '2026-07-01T00:00:00.000Z',
        expiresAt: '2026-10-01T00:00:00.000Z',
        status: 'ACTIVE',
        listingsAllowed: 5,
        listingsUsed: 2,
        categoriesAllowed: ['all'],
      },
    ],
    otps: [],
  };
}

// Load or Initialize Database (Single Source of Truth)
export function getDb(): DatabaseSchema {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const stat = fs.statSync(DB_FILE);
      if (dbCache && stat.mtimeMs <= lastDbMtimeMs) {
        return dbCache;
      }

      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      lastDbMtimeMs = stat.mtimeMs;

      // Ensure otps collection exists
      if (!dbCache!.otps) {
        dbCache!.otps = [];
      }

      // Ensure admin exists with correct hash for '111111'
      ensureSuperAdmin(dbCache!);

      // Ensure settings exists
      if (!dbCache!.settings) {
        dbCache!.settings = {
          platformName: 'TrustSets',
          supportEmail: 'support@trustsets.com',
          supportPhone: '+91 9652663763',
          supportWhatsApp: '+91 9652663763',
          currency: 'INR (₹)',
          defaultValidityDays: 30,
          deedVerificationSLAHours: 24,
          maxPropertyImages: 15,
          autoPublishVerifiedListings: true,
          maintenanceMode: false,
        };
        saveDb(dbCache!);
      }

      // Safe User Migration: inspect existing records for duplicate normalized mobile numbers & initialize fields
      if (dbCache!.users && Array.isArray(dbCache!.users)) {
        let usersChanged = false;
        const seenNormalized = new Map<string, any>();

        dbCache!.users.forEach((u: any) => {
          // Normalize phone using authoritative normalization logic
          if (u.phone && !u.mobile_normalized) {
            const norm = normalizeMobile(u.phone);
            if (norm) {
              u.mobile_normalized = norm.normalized;
              usersChanged = true;
            }
          }

          if (u.mobile_verified === undefined) {
            u.mobile_verified = u.verified ?? true;
            usersChanged = true;
          }

          if (!u.savedPropertyIds) {
            u.savedPropertyIds = [];
            usersChanged = true;
          }

          if (!u.contactedPropertyIds) {
            u.contactedPropertyIds = [];
            usersChanged = true;
          }

          if (!u.updated_at) {
            u.updated_at = u.accountCreated || new Date().toISOString();
            usersChanged = true;
          }

          if (u.version === undefined) {
            u.version = 1;
            usersChanged = true;
          }

          // Clean legacy synthetic emails: DO NOT invent/propagate fake emails (Requirement 14, 21)
          if (u.email && /^(usr-|user-|test-user-)[0-9a-z-]+@trussets\.in$/i.test(u.email)) {
            u.email = '';
            usersChanged = true;
          }

          // Initialize password hash for existing users if missing (enables Email + Password login with standard seed '111111')
          if (!u.passwordHash) {
            const { hash, salt } = hashPassword('111111');
            u.passwordHash = hash;
            u.salt = salt;
            usersChanged = true;
          }

          // Safe duplicate conflict handling: DO NOT silently delete accounts
          if (u.mobile_normalized) {
            const conflict = seenNormalized.get(u.mobile_normalized);
            if (conflict && conflict.id !== u.id) {
              console.warn(`[DATABASE INTEGRITY CONFLICT] Found duplicate normalized mobile: ${u.mobile_normalized} between user ${conflict.id} and ${u.id}. Resolving safely without deleting.`);
              u.mobile_normalized = `${u.mobile_normalized}_conflict_${u.id}`;
              usersChanged = true;
            } else {
              seenNormalized.set(u.mobile_normalized, u);
            }
          }
        });

        if (usersChanged) {
          saveDb(dbCache!);
        }
      }

      // Ensure properties have propertyStatus and propertyAge
      if (dbCache!.properties && Array.isArray(dbCache!.properties)) {
        let changed = false;
        dbCache!.properties.forEach((p: any) => {
          if (p.propertyAge === undefined) {
            p.propertyAge = p.propertyAgeYears !== undefined ? p.propertyAgeYears : 0;
            changed = true;
          }
          if (!p.propertyStatus) {
            p.propertyStatus = (p.propertyAge === 0 || p.propertyAgeYears === 0) ? 'NEW' : (p.propertyAge && p.propertyAge > 1 ? 'OLD' : 'NEW');
            changed = true;
          }
        });
        if (changed) {
          saveDb(dbCache!);
        }
      }

      // Ensure subscriptions array exists
      if (!dbCache!.subscriptions || !Array.isArray(dbCache!.subscriptions)) {
        dbCache!.subscriptions = [];
        // Populate from users that already have plans
        if (dbCache!.users && Array.isArray(dbCache!.users)) {
          dbCache!.users.forEach((u: any) => {
            if (u.planName) {
              const start = u.planStartDate ? new Date(u.planStartDate).toISOString() : new Date().toISOString();
              const end = u.planEndDate ? new Date(u.planEndDate).toISOString() : new Date(Date.now() + 60 * 86400000).toISOString();
              const isExpired = new Date(end).getTime() < Date.now();
              dbCache!.subscriptions.push({
                id: `sub-${u.id}-${Date.now()}`,
                userId: u.id,
                planId: u.planId || 'plan-buy-gold',
                planName: u.planName,
                planType: u.planType || 'Buying',
                purchaseTransactionId: u.payments?.[0]?.transactionId || 'TXN-INIT',
                invoiceNumber: u.payments?.[0]?.invoiceNumber || 'INV-INIT',
                price: u.planPrice || 4999,
                purchasedAt: start,
                startsAt: start,
                expiresAt: end,
                status: isExpired ? 'EXPIRED' : 'ACTIVE',
                listingsAllowed: u.listingsAllowed || 5,
                listingsUsed: u.listingsUsed || 0,
                categoriesAllowed: ['all'],
              });
            }
          });
        }
        saveDb(dbCache!);
      }

      return dbCache!;
    } catch (e) {
      console.error('[DATABASE SAFETY] Failed reading primary database file:', e);
      // Attempt recovery from backup file first
      if (fs.existsSync(DB_BACKUP_FILE)) {
        try {
          console.warn('[DATABASE SAFETY] Attempting recovery from persistent backup file:', DB_BACKUP_FILE);
          const backupRaw = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
          const recovered = JSON.parse(backupRaw);
          if (recovered && recovered.properties && Array.isArray(recovered.properties) && recovered.properties.length > 0) {
            dbCache = recovered;
            saveDb(recovered);
            console.log('[DATABASE SAFETY] Database successfully recovered from backup.');
            return dbCache!;
          }
        } catch (recoverErr) {
          console.error('[DATABASE SAFETY] Failed to restore from backup file:', recoverErr);
        }
      }

      // If in-memory dbCache is already loaded and valid, preserve it! DO NOT wipe!
      if (dbCache && dbCache.properties && Array.isArray(dbCache.properties) && dbCache.properties.length > 0) {
        console.warn('[DATABASE PRESERVATION] Preserving existing in-memory database. Will NOT overwrite with seed.');
        return dbCache;
      }
    }
  }

  // Only generate initial seed data if DB_FILE has never existed on disk AND no backup exists
  if (!fs.existsSync(DB_FILE) && !fs.existsSync(DB_BACKUP_FILE)) {
    console.log('[DATABASE BOOT] Initial setup: Generating first-time seed database.');
    const initialData = generateInitialDatabase();
    saveDb(initialData);
    dbCache = initialData;
    return dbCache;
  }

  // If DB_FILE exists but failed to parse and no cache/backup worked, preserve memory state or throw rather than wiping data!
  if (dbCache) {
    return dbCache;
  }
  throw new Error('DATABASE_READ_ERROR: Failed to load database and safety mechanisms prevented destructive re-seeding.');
}

function ensureSuperAdmin(db: DatabaseSchema) {
  let hasChanges = false;
  const adminEmail = 'trussets@gmail.com';
  const existing = db.admins.find(a => a.email.toLowerCase() === adminEmail);
  if (!existing) {
    const { hash, salt } = hashPassword('111111');
    db.admins.push({
      id: 'admin-trussets-1',
      email: adminEmail,
      phone: '9652663763',
      name: 'TrustSets Super Administrator',
      role: 'super_admin',
      roleTitle: 'Super Administrator',
      department: 'Platform Governance',
      status: 'Active',
      permissions: ['*'],
      isOriginalSuperAdmin: true,
      passwordHash: hash,
      salt: salt,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString(),
    });
    hasChanges = true;
  } else {
    if (!existing.passwordHash || existing.role !== 'super_admin' || !existing.isOriginalSuperAdmin) {
      const { hash, salt } = hashPassword('111111');
      existing.isOriginalSuperAdmin = true;
      existing.role = 'super_admin';
      existing.roleTitle = existing.roleTitle || 'Super Administrator';
      existing.department = existing.department || 'Platform Governance';
      existing.status = 'Active';
      existing.permissions = ['*'];
      existing.passwordHash = hash;
      existing.salt = salt;
      hasChanges = true;
    }
  }

  // Ensure an operations manager staff and a deed verification specialist staff exist
  const opsStaff = db.admins.find(a => a.email.toLowerCase() === 'ops.manager@trussets.com');
  if (!opsStaff) {
    const { hash, salt } = hashPassword('staff123');
    db.admins.push({
      id: 'staff-ops-1',
      email: 'ops.manager@trussets.com',
      phone: '+91 9845012345',
      name: 'Priya Sharma',
      role: 'operations_admin',
      roleTitle: 'Operations Manager',
      department: 'Operations',
      status: 'Active',
      permissions: ['manage_properties', 'manage_users', 'manage_plans', 'view_analytics', 'manage_banners'],
      assignedBy: 'TrustSets Super Administrator',
      passwordHash: hash,
      salt: salt,
      createdAt: '2026-02-15T10:00:00.000Z',
      lastLogin: '2026-09-17T14:30:00.000Z',
    });
    hasChanges = true;
  }

  const deedStaff = db.admins.find(a => a.email.toLowerCase() === 'deeds.audit@trussets.com');
  if (!deedStaff) {
    const { hash, salt } = hashPassword('staff123');
    db.admins.push({
      id: 'staff-deed-1',
      email: 'deeds.audit@trussets.com',
      phone: '+91 9912345678',
      name: 'Kavitha Reddy',
      role: 'deed_auditor',
      roleTitle: 'Deed Verification Specialist',
      department: 'Legal & Title Compliance',
      status: 'Active',
      permissions: ['verify_deeds', 'view_properties', 'triage_fraud', 'view_audit_logs'],
      assignedBy: 'TrustSets Super Administrator',
      passwordHash: hash,
      salt: salt,
      createdAt: '2026-03-01T09:00:00.000Z',
      lastLogin: '2026-09-18T08:15:00.000Z',
    });
    hasChanges = true;
  }

  if (Array.isArray(db.auditLogs)) {
    db.auditLogs.forEach((log: any) => {
      if (log && typeof log.ip !== 'string') {
        if (log.ip && typeof log.ip === 'object' && !log.newValue) {
          log.newValue = JSON.stringify(log.ip);
        }
        log.ip = '127.0.0.1';
        hasChanges = true;
      }
      for (const field of ['admin', 'action', 'module', 'recordAffected', 'timestamp'] as const) {
        if (log && typeof log[field] !== 'string') {
          log[field] = log[field] != null ? (typeof log[field] === 'object' ? JSON.stringify(log[field]) : String(log[field])) : '';
          hasChanges = true;
        }
      }
    });
  }

  if (hasChanges) {
    saveDb(db);
  }
}

// Helper to log administrative audit trail
export function logAdminAction(
  admin: string,
  action: string,
  module: string,
  recordAffected: string,
  ip: any = '127.0.0.1',
  previousValue?: any,
  newValue?: any
) {
  const db = getDb();
  const safeString = (val: any, fallback = ''): string => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const safeIp = typeof ip === 'string' && ip.trim() ? ip.trim() : '127.0.0.1';
  const resolvedNewValue =
    newValue !== undefined
      ? safeString(newValue)
      : typeof ip === 'object' && ip !== null
      ? JSON.stringify(ip)
      : undefined;

  const newLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    admin: safeString(admin, 'Admin'),
    action: safeString(action, 'Administrative Action'),
    module: safeString(module, 'System'),
    recordAffected: safeString(recordAffected, 'N/A'),
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    ip: safeIp,
    previousValue: previousValue !== undefined ? safeString(previousValue) : undefined,
    newValue: resolvedNewValue,
  };
  db.auditLogs.unshift(newLog);
  // Keep last 1000 audit logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  saveDb(db);
}
