import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    // Optional — null means the legacy single-store settings doc (unchanged
    // behavior). One settings doc per store once storeId is set.
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    key: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

settingsSchema.index({ storeId: 1, key: 1 }, { unique: true });

export const Settings = mongoose.model('Settings', settingsSchema);

// Business-agnostic — a freshly created store (any product category, not
// just fashion) starts from these until its owner customizes them via
// Admin → Settings.
export const DEFAULT_STORE_SETTINGS = {
  storeName: 'My Store',
  tagline: 'Quality products, easy ordering',
  currency: 'PKR',
  whatsappNumber: '',
  email: '',
  phone: '',
  address: '',
  logo: '',
  favicon: '',
  announcement: '',
  heroSlides: [
    {
      id: 'hero-1',
      image: '',
      title: 'Welcome to our store',
      subtitle: 'Quality products, easy ordering',
      ctaText: 'Shop Now',
      ctaLink: '/shop',
    },
    {
      id: 'hero-2',
      image: '',
      title: 'New Arrivals',
      subtitle: 'Check out what just landed',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
    },
  ],
  about: '',
  theme: {
    bg: '#fdfaf6',
    bgDeep: '#f7efe6',
    surface: '#ffffff',
    surface2: '#faf3ea',
    ink: '#4a3f3a',
    inkSoft: '#6f6159',
    inkMuted: '#9c8f86',
    primary: '#c47a8d',
    primaryDark: '#b06277',
    primaryDeep: '#9c4f66',
    primarySoft: '#faeef1',
    accent: '#d9a679',
    accentDark: '#c08a55',
    accentSoft: '#faf0e2',
    line: '#f1e8dd',
    lineStrong: '#e3d3c5',
    wa: '#2fbf71',
    waDark: '#1fa35b',
    waSoft: '#e8f7ef',
    danger: '#d57a6d',
    dangerSoft: '#fcefec',
    success: '#3aa06a',
    successSoft: '#e9f7f0',
    warning: '#c2913d',
    warningSoft: '#fbf3de',
  },
  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  },
  seo: {
    title: 'My Store – Shop Online',
    description: 'Browse our full range of products and order easily on WhatsApp.',
    keywords: '',
  },
};

export const getStoreSettings = async (storeId = null) => {
  const doc = await Settings.findOne({ storeId, key: 'store' }).lean();
  return { ...DEFAULT_STORE_SETTINGS, ...(doc?.data || {}) };
};

export default Settings;