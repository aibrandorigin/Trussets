import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Key-value store for app collections and state persistence
export const appStorage = pgTable('app_storage', {
  key: text('key').primaryKey(),
  data: text('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').default(''),
  phone: text('phone').default(''),
  userType: text('user_type').default('Property Buyers'),
  location: text('location').default(''),
  city: text('city').default(''),
  state: text('state').default(''),
  profilePhoto: text('profile_photo').default(''),
  verified: boolean('verified').default(false),
  status: text('status').default('Active'),
  planId: text('plan_id'),
  planName: text('plan_name'),
  planType: text('plan_type'),
  data: text('data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Properties table
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  propertyId: text('property_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').default(''),
  type: text('type').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  displayPrice: text('display_price'),
  city: text('city').notNull(),
  locality: text('locality').notNull(),
  bedrooms: integer('bedrooms').default(0),
  bathrooms: integer('bathrooms').default(0),
  areaSqFt: integer('area_sq_ft').default(0),
  furnishing: text('furnishing').default('Unfurnished'),
  ownerUserId: text('owner_user_id'),
  ownerName: text('owner_name').default(''),
  ownerPhone: text('owner_phone').default(''),
  ownerEmail: text('owner_email').default(''),
  saleDeedVerified: boolean('sale_deed_verified').default(false),
  verificationStatus: text('verification_status').default('Pending'),
  listingStatus: text('listing_status').default('Published'),
  data: text('data'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Plans table
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  planId: text('plan_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').default(''),
  type: text('type').notNull(),
  price: integer('price').notNull(),
  listingsAllowed: integer('listings_allowed').notNull(),
  validityDays: integer('validity_days').notNull(),
  status: text('status').default('Active'),
  displayOrder: integer('display_order').default(1),
  data: text('data'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  subscriptionId: text('subscription_id').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  userUid: text('user_uid').notNull(),
  planId: text('plan_id').notNull(),
  planName: text('plan_name').notNull(),
  planType: text('plan_type').notNull(),
  price: integer('price').notNull(),
  purchaseTransactionId: text('purchase_transaction_id'),
  status: text('status').default('ACTIVE'),
  listingsAllowed: integer('listings_allowed').default(1),
  listingsUsed: integer('listings_used').default(0),
  startsAt: timestamp('starts_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  data: text('data'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Admins table
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  adminId: text('admin_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  role: text('role').default('admin'),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  data: text('data'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  logId: text('log_id').notNull().unique(),
  admin: text('admin').notNull(),
  action: text('action').notNull(),
  module: text('module').notNull(),
  recordAffected: text('record_affected'),
  ip: text('ip'),
  timestamp: text('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
