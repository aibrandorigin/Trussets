import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './routes/api.ts';
import { getDb } from './db.ts';
import { validateSmsConfigAtStartup } from './services/smsService.ts';

export async function startServer() {
  const app = express();
  // In AI Studio / Cloud Run, Nginx owns port 8080 and reverse-proxies to 3000.
  // If process.env.PORT is 8080, Express must bind to 3000 to avoid EADDRINUSE conflict with Nginx.
  const PORT = process.env.APP_PORT
    ? parseInt(process.env.APP_PORT, 10)
    : (process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000);

  // Validate SMS gateway configuration on boot
  validateSmsConfigAtStartup();

  // Initialize DB on boot and synchronize with persistent Cloud SQL database
  try {
    const localDb = getDb();
    console.log('Database initialized successfully.');
    // Import and sync with Cloud SQL database
    import('./cloudSqlSync.ts')
      .then(({ initPersistentDatabase }) => initPersistentDatabase(localDb))
      .catch((err) => console.warn('[CLOUD SQL SYNC] Bootstrap error:', err));
  } catch (err) {
    console.error('Database initialization error:', err);
  }

  // Parsers with generous limit for images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS support for Capacitor Android/iOS native WebView origins (https://localhost, capacitor://localhost)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (
      origin &&
      (origin === 'https://localhost' ||
        origin === 'http://localhost' ||
        origin.startsWith('capacitor://') ||
        origin.endsWith('.run.app') ||
        origin.endsWith('trussets.com'))
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Android App Links verification endpoint (.well-known/assetlinks.json)
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.trussets.app',
          sha256_cert_fingerprints: process.env.ANDROID_SHA256_FINGERPRINT
            ? [process.env.ANDROID_SHA256_FINGERPRINT]
            : ['00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00'],
        },
      },
    ]);
  });

  // Static uploads directory serving
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {}
  }
  app.use('/uploads', express.static(uploadsDir));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Catch-all for unmatched API requests - MUST return JSON, NEVER Vite HTML
  app.all(['/api', '/api/*'], (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Old Admin Route Redirects to Unified Property Plans Module
  app.get(['/admin/rental-property-plans', '/admin/rental-plans'], (req, res) => {
    res.redirect(301, '/admin/property-plans?tab=rental');
  });
  app.get(['/admin/buying-property-plans', '/admin/buying-plans'], (req, res) => {
    res.redirect(301, '/admin/property-plans?tab=buying');
  });

  // Check if running in production mode (dist/index.html built)
  const distPath = path.join(process.cwd(), 'dist');
  const hasBuiltClient = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || hasBuiltClient;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrustSets server running on http://0.0.0.0:${PORT}`);
  });

  return server;
}
