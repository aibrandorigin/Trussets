import { createPool } from '../src/db/index.ts';
import type { DatabaseSchema } from './db.ts';

/**
 * Cloud SQL (PostgreSQL) Persistent Synchronizer
 * Exclusively uses Cloud SQL as the database.
 */

export async function pullFromCloudSql(): Promise<Partial<DatabaseSchema> | null> {
  const pool = createPool();
  try {
    const res = await pool.query('SELECT key, data FROM app_storage');
    if (!res.rows || res.rows.length === 0) {
      return null;
    }

    const cloudData: Partial<DatabaseSchema> = {};
    for (const row of res.rows) {
      try {
        const parsed = JSON.parse(row.data);
        if (row.key === 'properties' && Array.isArray(parsed) && parsed.length > 0) {
          cloudData.properties = parsed;
        } else if (row.key === 'users' && Array.isArray(parsed) && parsed.length > 0) {
          cloudData.users = parsed;
        } else if (row.key === 'admins' && Array.isArray(parsed) && parsed.length > 0) {
          cloudData.admins = parsed;
        } else if (row.key === 'buyingPlans' && Array.isArray(parsed)) {
          cloudData.buyingPlans = parsed;
        } else if (row.key === 'rentalPlans' && Array.isArray(parsed)) {
          cloudData.rentalPlans = parsed;
        } else if (row.key === 'subscriptions' && Array.isArray(parsed)) {
          cloudData.subscriptions = parsed;
        } else if (row.key === 'banners' && parsed) {
          cloudData.banners = parsed;
        } else if (row.key === 'blogs' && Array.isArray(parsed)) {
          cloudData.blogs = parsed;
        } else if (row.key === 'testimonials' && Array.isArray(parsed)) {
          cloudData.testimonials = parsed;
        } else if (row.key === 'fraudReports' && Array.isArray(parsed)) {
          cloudData.fraudReports = parsed;
        } else if (row.key === 'notifications' && Array.isArray(parsed)) {
          cloudData.notifications = parsed;
        } else if (row.key === 'auditLogs' && Array.isArray(parsed)) {
          cloudData.auditLogs = parsed;
        } else if (row.key === 'settings' && parsed) {
          cloudData.settings = parsed;
        } else if (row.key === 'preferences' && parsed) {
          cloudData.preferences = parsed;
        }
      } catch (err) {
        console.warn(`[CLOUD SQL SYNC] Failed parsing data for key ${row.key}:`, err);
      }
    }

    if (cloudData.properties && cloudData.properties.length > 0) {
      console.log(
        `[CLOUD SQL SYNC] Pulled authoritative state from Cloud SQL: ${cloudData.properties?.length || 0} properties, ${cloudData.users?.length || 0} users.`
      );
      return cloudData;
    }

    return null;
  } catch (error) {
    console.error('[CLOUD SQL SYNC] Error reading from Cloud SQL:', error);
    return null;
  }
}

export async function pushToCloudSql(data: DatabaseSchema): Promise<void> {
  const pool = createPool();
  try {
    // 1. Sync all collections into app_storage
    const collections: Array<{ key: string; value: any }> = [
      { key: 'properties', value: data.properties || [] },
      { key: 'users', value: data.users || [] },
      { key: 'admins', value: data.admins || [] },
      { key: 'buyingPlans', value: data.buyingPlans || [] },
      { key: 'rentalPlans', value: data.rentalPlans || [] },
      { key: 'subscriptions', value: data.subscriptions || [] },
      { key: 'banners', value: data.banners || {} },
      { key: 'blogs', value: data.blogs || [] },
      { key: 'testimonials', value: data.testimonials || [] },
      { key: 'fraudReports', value: data.fraudReports || [] },
      { key: 'notifications', value: data.notifications || [] },
      { key: 'auditLogs', value: data.auditLogs || [] },
      { key: 'settings', value: data.settings || {} },
      { key: 'preferences', value: data.preferences || {} },
    ];

    for (const col of collections) {
      await pool.query(
        `INSERT INTO app_storage (key, data, updated_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (key) 
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [col.key, JSON.stringify(col.value)]
      );
    }

    // 2. Synchronize individual records to relational tables
    // Sync properties
    if (data.properties && Array.isArray(data.properties)) {
      for (const p of data.properties) {
        try {
          if (!p.id) continue;
          const propId = String(p.id);
          const title = String(p.title || 'Untitled Property');
          const desc = String(p.description || p.subtitle || '');
          const type = String(p.transactionType || p.type || 'buy');
          const category = String(p.category || 'apartments');
          const price = Math.round(Number(p.price) || 0);
          const displayPrice = String(p.priceDisplay || p.displayPrice || `₹${price}`);
          const city = String(p.city || 'India');
          const locality = String(p.locality || 'Central');
          const bedrooms = Math.round(Number(p.bedrooms || (p.bhk ? parseInt(p.bhk, 10) : 0)) || 0);
          const bathrooms = Math.round(Number(p.bathrooms) || 0);
          const areaSqFt = Math.round(Number(p.areaSqFt) || 0);
          const furnishing = String(p.furnishing || 'Unfurnished');
          const ownerUserId = String(p.ownerUserId || p.ownerId || '');
          const ownerName = String(p.ownerName || p.uploaderName || '');
          const ownerPhone = String(p.ownerPhone || '');
          const ownerEmail = String(p.ownerEmail || '');
          const saleDeedVerified = Boolean(p.saleDeedVerified);
          const verificationStatus = String(p.verificationStatus || (saleDeedVerified ? 'Verified' : 'Pending'));
          const listingStatus = String(p.listingStatus || 'Published');
          const serialized = JSON.stringify(p);

          await pool.query(
            `INSERT INTO properties (
               property_id, title, description, type, category, price, display_price, 
               city, locality, bedrooms, bathrooms, area_sq_ft, furnishing, 
               owner_user_id, owner_name, owner_phone, owner_email, 
               sale_deed_verified, verification_status, listing_status, data
             ) VALUES (
               $1, $2, $3, $4, $5, $6, $7, 
               $8, $9, $10, $11, $12, $13, 
               $14, $15, $16, $17, 
               $18, $19, $20, $21
             )
             ON CONFLICT (property_id) DO UPDATE SET
               title = EXCLUDED.title,
               description = EXCLUDED.description,
               type = EXCLUDED.type,
               category = EXCLUDED.category,
               price = EXCLUDED.price,
               display_price = EXCLUDED.display_price,
               city = EXCLUDED.city,
               locality = EXCLUDED.locality,
               bedrooms = EXCLUDED.bedrooms,
               bathrooms = EXCLUDED.bathrooms,
               area_sq_ft = EXCLUDED.area_sq_ft,
               furnishing = EXCLUDED.furnishing,
               owner_user_id = EXCLUDED.owner_user_id,
               owner_name = EXCLUDED.owner_name,
               owner_phone = EXCLUDED.owner_phone,
               owner_email = EXCLUDED.owner_email,
               sale_deed_verified = EXCLUDED.sale_deed_verified,
               verification_status = EXCLUDED.verification_status,
               listing_status = EXCLUDED.listing_status,
               data = EXCLUDED.data`,
            [
              propId,
              title,
              desc,
              type,
              category,
              price,
              displayPrice,
              city,
              locality,
              bedrooms,
              bathrooms,
              areaSqFt,
              furnishing,
              ownerUserId,
              ownerName,
              ownerPhone,
              ownerEmail,
              saleDeedVerified,
              verificationStatus,
              listingStatus,
              serialized,
            ]
          );
        } catch (propErr) {
          console.warn(`[CLOUD SQL SYNC] Failed syncing property ${p.id}:`, propErr);
        }
      }
    }

    // Sync users
    if (data.users && Array.isArray(data.users)) {
      for (const u of data.users) {
        try {
          if (!u.id) continue;
          const uid = String(u.id);
          const email = String(u.email || `${u.id}@user.trussets.internal`);
          const name = String(u.name || '');
          const phone = String(u.phone || '');
          const userType = String(u.userType || 'Property Buyers');
          const location = String(u.location || '');
          const city = String(u.city || '');
          const state = String(u.state || '');
          const profilePhoto = String(u.profilePhoto || '');
          const verified = Boolean(u.verified);
          const status = String(u.status || 'Active');
          const planId = u.planId ? String(u.planId) : null;
          const planName = u.planName ? String(u.planName) : null;
          const planType = u.planType ? String(u.planType) : null;
          const serialized = JSON.stringify(u);

          await pool.query(
            `INSERT INTO users (
               uid, email, name, phone, user_type, location, city, state,
               profile_photo, verified, status, plan_id, plan_name, plan_type, data, updated_at
             ) VALUES (
               $1, $2, $3, $4, $5, $6, $7, $8, 
               $9, $10, $11, $12, $13, $14, $15, NOW()
             )
             ON CONFLICT (uid) DO UPDATE SET
               email = EXCLUDED.email,
               name = EXCLUDED.name,
               phone = EXCLUDED.phone,
               user_type = EXCLUDED.user_type,
               location = EXCLUDED.location,
               city = EXCLUDED.city,
               state = EXCLUDED.state,
               profile_photo = EXCLUDED.profile_photo,
               verified = EXCLUDED.verified,
               status = EXCLUDED.status,
               plan_id = EXCLUDED.plan_id,
               plan_name = EXCLUDED.plan_name,
               plan_type = EXCLUDED.plan_type,
               data = EXCLUDED.data,
               updated_at = NOW()`,
            [
              uid,
              email,
              name,
              phone,
              userType,
              location,
              city,
              state,
              profilePhoto,
              verified,
              status,
              planId,
              planName,
              planType,
              serialized,
            ]
          );
        } catch (userErr) {
          console.warn(`[CLOUD SQL SYNC] Failed syncing user ${u.id}:`, userErr);
        }
      }
    }

    // Sync plans
    const allPlans = [...(data.buyingPlans || []), ...(data.rentalPlans || [])];
    for (const pl of allPlans) {
      if (!pl.id) continue;
      const planId = String(pl.id);
      const name = String(pl.name || 'Plan');
      const desc = String(pl.description || '');
      const type = String(data.buyingPlans?.some((bp) => bp.id === pl.id) ? 'Buying' : 'Rental');
      const price = Math.round(Number(pl.price) || 0);
      const listingsAllowed = Math.round(Number(pl.listingsAllowed) || 1);
      const validityDays = Math.round(Number(pl.validityDays) || 30);
      const status = String(pl.status || 'Active');
      const displayOrder = Math.round(Number(pl.displayOrder) || 1);
      const serialized = JSON.stringify(pl);

      await pool.query(
        `INSERT INTO plans (
           plan_id, name, description, type, price, listings_allowed, validity_days, status, display_order, data
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
         )
         ON CONFLICT (plan_id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           type = EXCLUDED.type,
           price = EXCLUDED.price,
           listings_allowed = EXCLUDED.listings_allowed,
           validity_days = EXCLUDED.validity_days,
           status = EXCLUDED.status,
           display_order = EXCLUDED.display_order,
           data = EXCLUDED.data`,
        [planId, name, desc, type, price, listingsAllowed, validityDays, status, displayOrder, serialized]
      );
    }

    // Sync admins
    if (data.admins && Array.isArray(data.admins)) {
      for (const adm of data.admins) {
        if (!adm.id) continue;
        await pool.query(
          `INSERT INTO admins (
             admin_id, email, name, phone, role, password_hash, salt, data
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8
           )
           ON CONFLICT (admin_id) DO UPDATE SET
             email = EXCLUDED.email,
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             role = EXCLUDED.role,
             password_hash = EXCLUDED.password_hash,
             salt = EXCLUDED.salt,
             data = EXCLUDED.data`,
          [
            String(adm.id),
            String(adm.email),
            String(adm.name),
            String(adm.phone || ''),
            String(adm.role || 'admin'),
            String(adm.passwordHash),
            String(adm.salt),
            JSON.stringify(adm),
          ]
        );
      }
    }

    console.log('[CLOUD SQL SYNC] Database successfully updated with latest changes.');
  } catch (error) {
    console.error('[CLOUD SQL SYNC] Failed pushing to Cloud SQL:', error);
  }
}

export async function initPersistentDatabase(localDb: DatabaseSchema): Promise<void> {
  try {
    console.log('[CLOUD SQL SYNC] Connecting to Cloud SQL database...');
    const cloudData = await pullFromCloudSql();
    if (cloudData && cloudData.properties && cloudData.properties.length > 0) {
      console.log('[CLOUD SQL SYNC] Restoring persistent Cloud SQL records into application runtime...');
      Object.assign(localDb, cloudData);
      const { saveDb } = await import('./db.ts');
      saveDb(localDb, false);
      console.log('[CLOUD SQL SYNC] Cloud SQL restore complete. Authoritative production database active.');
    } else {
      console.log('[CLOUD SQL SYNC] Seeding Cloud SQL database with initial application records...');
      await pushToCloudSql(localDb);
      console.log('[CLOUD SQL SYNC] Seed complete.');
    }
  } catch (err) {
    console.error('[CLOUD SQL SYNC] Failed to initialize Cloud SQL persistent database:', err);
  }
}
