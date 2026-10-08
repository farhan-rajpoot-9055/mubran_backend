import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from './config/index.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import errorHandler, { notFoundHandler } from './middlewares/errorHandler.js';
import { UPLOAD_PATH, uploadDir, isServerless } from './middlewares/upload.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';
import storeProductRoutes from './routes/storeProducts.js';
import storeCategoryRoutes from './routes/storeCategories.js';
import storeSettingsRoutes from './routes/storeSettings.js';
import storeOrderRoutes from './routes/storeOrders.js';
import { resolveStore } from './middlewares/tenant.js';

const app = express();

app.set('trust proxy', config.trustProxy);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const corsOrigin = config?.corsOrigin || '*';

const corsOrigins =
  corsOrigin === '*'
    ? true
    : corsOrigin.split(',').map((s) => s.trim());

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serverless deploys (Vercel) never write here — uploads go straight to
// Vercel Blob storage instead (see middlewares/upload.js) and are served
// from their own CDN URL, so there's nothing for this to serve.
if (!isServerless) {
  app.use(UPLOAD_PATH, express.static(uploadDir));
}

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'AMS e-commerce API',
    uptime: process.uptime(),
  });
});

app.get('/api/healthcheck', (_req, res) => {
  res.json({
    success: true,
    service: 'AMS e-commerce API',
    uptime: process.uptime(),
  });
});

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
// Multi-tenant: store-scoped public/storefront API, additive — every route
// above (products/categories/orders/settings/admin) is untouched and keeps
// serving the legacy single-store (storeId: null) data.
app.use('/api/stores/:storeSlug/products', resolveStore, storeProductRoutes);
app.use('/api/stores/:storeSlug/categories', resolveStore, storeCategoryRoutes);
app.use('/api/stores/:storeSlug/settings', resolveStore, storeSettingsRoutes);
app.use('/api/stores/:storeSlug/orders', resolveStore, storeOrderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;