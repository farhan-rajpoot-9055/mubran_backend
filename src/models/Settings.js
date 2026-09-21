import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);

export const DEFAULT_STORE_SETTINGS = {
  storeName: 'Pakistani Ladies Suits',
  tagline: 'Elegant styles for every occasion',
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
      title: 'New Collection',
      subtitle: 'Elegant styles for every occasion',
      ctaText: 'Shop Now',
      ctaLink: '/shop',
    },
    {
      id: 'hero-2',
      image: '',
      title: 'Premium Lawn & Cotton',
      subtitle: 'Handpicked seasonal fabrics, made for you',
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
    title: 'Pakistani Ladies Suits – Premium Lawn, Cotton & Embroidered',
    description:
      'Shop premium Pakistani ladies suits — 2 piece, 3 piece, lawn, cotton and embroidered outfits at the best prices. Order easily on WhatsApp.',
    keywords: 'ladies suits, pakistani suits, lawn, cotton, embroidered, 2 piece suit, 3 piece suit',
  },
};

export const getStoreSettings = async () => {
  let doc = await Settings.findOne({ key: 'store' }).lean();
  if (!doc) {
    doc = { key: 'store', data: { ...DEFAULT_STORE_SETTINGS } };
  }
  return { ...DEFAULT_STORE_SETTINGS, ...(doc.data || {}) };
};

export default Settings;