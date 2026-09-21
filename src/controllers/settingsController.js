import { Settings, DEFAULT_STORE_SETTINGS, getStoreSettings } from '../models/Settings.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { stripHtml } from '../utils/helpers.js';

export const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await getStoreSettings();
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).select('name slug image');
  const {
    heroSlides, announcement, storeName, tagline, whatsappNumber, currency, social, about, email, phone, address, seo, logo, favicon, theme,
  } = settings;
  res.json({
    success: true,
    data: {
      storeName,
      tagline,
      whatsappNumber,
      currency,
      announcement,
      logo,
      favicon,
      heroSlides: (heroSlides || []).filter((s) => s.image || s.title),
      about,
      social,
      email,
      phone,
      address,
      seo,
      theme,
      categories,
    },
  });
});

const cleanUrl = (v) => String(v || '').replace(/["'<>\\]/g, '').trim();

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const cleanColor = (value, fallback) => (HEX_COLOR_RE.test(String(value || '')) ? value : fallback);
const THEME_KEYS = [
  'bg', 'bgDeep', 'surface', 'surface2', 'ink', 'inkSoft', 'inkMuted',
  'primary', 'primaryDark', 'primaryDeep', 'primarySoft',
  'accent', 'accentDark', 'accentSoft', 'line', 'lineStrong',
  'wa', 'waDark', 'waSoft', 'danger', 'dangerSoft',
  'success', 'successSoft', 'warning', 'warningSoft',
];

export const adminGetSettings = asyncHandler(async (req, res) => {
  const settings = await getStoreSettings();
  res.json({ success: true, data: settings });
});

export const adminUpdateSettings = asyncHandler(async (req, res) => {
  const current = await getStoreSettings();
  const body = req.body || {};

  const next = { ...current };

  next.storeName = stripHtml(String(body.storeName ?? current.storeName).slice(0, 100));
  next.tagline = stripHtml(String(body.tagline ?? current.tagline).slice(0, 200));
  next.currency = String(body.currency ?? current.currency).slice(0, 8);
  next.whatsappNumber = cleanUrl(String(body.whatsappNumber ?? current.whatsappNumber));
  next.email = cleanUrl(String(body.email ?? current.email));
  next.phone = cleanUrl(String(body.phone ?? current.phone));
  next.address = stripHtml(String(body.address ?? current.address).slice(0, 300));
  next.announcement = stripHtml(String(body.announcement ?? current.announcement).slice(0, 300));
  next.logo = cleanUrl(body.logo ?? current.logo);
  next.favicon = cleanUrl(body.favicon ?? current.favicon);
  next.about = String(body.about ?? current.about).slice(0, 3000);

  const cleanSlide = (s) => ({
    id: String(s.id || cryptoRandom()),
    image: cleanUrl(s.image),
    title: stripHtml(String(s.title || '').slice(0, 120)),
    subtitle: stripHtml(String(s.subtitle || '').slice(0, 300)),
    ctaText: stripHtml(String(s.ctaText || '').slice(0, 40)),
    ctaLink: cleanUrl(s.ctaLink),
  });

  if (Array.isArray(body.heroSlides)) {
    next.heroSlides = body.heroSlides.map(cleanSlide).filter((s) => s.image || s.title || s.subtitle);
  }

  next.social = {
    instagram: cleanUrl(body.social?.instagram ?? current.social?.instagram),
    facebook: cleanUrl(body.social?.facebook ?? current.social?.facebook),
    tiktok: cleanUrl(body.social?.tiktok ?? current.social?.tiktok),
    youtube: cleanUrl(body.social?.youtube ?? current.social?.youtube),
  };

  next.seo = {
    title: stripHtml(String(body.seo?.title ?? current.seo?.title).slice(0, 160)),
    description: stripHtml(String(body.seo?.description ?? current.seo?.description).slice(0, 320)),
    keywords: stripHtml(String(body.seo?.keywords ?? current.seo?.keywords).slice(0, 400)),
  };

  next.theme = {};
  for (const key of THEME_KEYS) {
    next.theme[key] = cleanColor(body.theme?.[key], current.theme?.[key] ?? DEFAULT_STORE_SETTINGS.theme[key]);
  }

  await Settings.findOneAndUpdate({ key: 'store' }, { data: next }, { upsert: true });
  res.json({ success: true, data: next });
});

const cryptoRandom = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const adminResetDefaultSettings = asyncHandler(async (_req, res) => {
  await Settings.deleteOne({ key: 'store' });
  res.json({ success: true, data: { ...DEFAULT_STORE_SETTINGS } });
});

export default {
  getPublicSettings,
  adminGetSettings,
  adminUpdateSettings,
  adminResetDefaultSettings,
};