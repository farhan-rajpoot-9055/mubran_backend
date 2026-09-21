import dotenv from 'dotenv';

dotenv.config();

const bool = (v, def = false) => {
  if (v === undefined) return def;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',

  mongoUri: process.env.MONGODB_URI || '',

  jwt: {
    secret: process.env.JWT_SECRET || 'insecure-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  admin: {
    name: process.env.ADMIN_NAME || 'Store Owner',
    email: (process.env.ADMIN_EMAIL || 'admin@store.com').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin123456!',
  },

  store: {
    name: process.env.STORE_NAME || 'Pakistani Ladies Suits',
    whatsapp: process.env.STORE_WHATSAPP || '923001234567',
    currency: process.env.STORE_CURRENCY || 'PKR',
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
  get trustProxy() {
    const raw = process.env.TRUST_PROXY;
    if (raw === undefined) return this.isProd ? 1 : false;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (/^\d+$/.test(raw)) return parseInt(raw, 10);
    return false;
  },
};

export default config;