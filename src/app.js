import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from './config/index.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import errorHandler, { notFoundHandler } from './middlewares/errorHandler.js';
import { UPLOAD_PATH, uploadDir } from './middlewares/upload.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';

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

app.use(UPLOAD_PATH, express.static(uploadDir));

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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;