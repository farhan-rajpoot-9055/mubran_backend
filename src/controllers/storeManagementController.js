import crypto from 'crypto';
import { Store } from '../models/Store.js';
import { Admin } from '../models/Admin.js';
import { Settings, DEFAULT_STORE_SETTINGS } from '../models/Settings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createSlug, stripHtml } from '../utils/helpers.js';

// Super-admin-only: create/list/update/activate/suspend stores. Gated by
// requireSuperAdmin in routes/adminStores.js — every function here
// deliberately does NOT scope by req.admin.storeId (super_admin has none;
// this is the one place that manages the store list itself, not a store's
// day-to-day data).

// These path segments are reserved by the legacy single-store frontend
// routes (/shop, /admin, etc.) — a store with one of these slugs would be
// permanently unreachable (shadowed by the static route). Keep in sync with
// the RESERVED_SLUGS list in the frontend's App.jsx.
const RESERVED_SLUGS = ['shop', 'cart', 'about', 'contact', 'category', 'products', 'admin', 'login', 'api'];

const uniqueSlug = async (slug) => {
  let candidate = RESERVED_SLUGS.includes(slug) ? `${slug}-store` : slug || 'store';
  let n = 2;
  while (await Store.exists({ slug: candidate })) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
};

const genPassword = () => crypto.randomBytes(9).toString('base64url'); // 12 chars

export const adminListStores = asyncHandler(async (_req, res) => {
  const stores = await Store.find().sort({ createdAt: -1 });
  const owners = await Admin.find({ storeId: { $in: stores.map((s) => s._id) } }).select('name email storeId');
  const ownerByStore = Object.fromEntries(owners.map((o) => [String(o.storeId), o]));
  const data = stores.map((s) => ({
    ...s.toObject(),
    owner: ownerByStore[String(s._id)]
      ? { name: ownerByStore[String(s._id)].name, email: ownerByStore[String(s._id)].email }
      : null,
  }));
  res.json({ success: true, data });
});

export const adminGetStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, 'Store not found');
  const owner = await Admin.findOne({ storeId: store._id }).select('name email active');
  res.json({ success: true, data: { ...store.toObject(), owner } });
});

export const adminCreateStore = asyncHandler(async (req, res) => {
  const name = stripHtml(String(req.body.name || '').slice(0, 100));
  const ownerName = stripHtml(String(req.body.ownerName || '').slice(0, 100));
  const ownerEmail = String(req.body.ownerEmail || '').toLowerCase().trim();
  if (!name) throw new ApiError(422, 'Store name is required');
  if (!ownerName) throw new ApiError(422, 'Owner name is required');
  if (!/^\S+@\S+\.\S+$/.test(ownerEmail)) throw new ApiError(422, 'A valid owner email is required');
  if (await Admin.findOne({ email: ownerEmail })) {
    throw new ApiError(409, 'An admin with this email already exists');
  }

  const slug = await uniqueSlug(createSlug(req.body.slug || name) || 'store');
  const store = await Store.create({ name, slug, status: 'active' });

  const password = genPassword();
  try {
    await Admin.create({
      name: ownerName,
      email: ownerEmail,
      password,
      role: 'admin',
      storeId: store._id,
    });
    // Seed the storefront's display name from what was just entered, so the
    // new store isn't stuck showing the generic "My Store" placeholder until
    // the owner logs in and re-types the same name in Settings. Everything
    // else (theme, hero slides, SEO copy, about text) still starts from
    // DEFAULT_STORE_SETTINGS for the owner to customize.
    await Settings.create({
      storeId: store._id,
      key: 'store',
      data: { ...DEFAULT_STORE_SETTINGS, storeName: name, seo: { ...DEFAULT_STORE_SETTINGS.seo, title: `${name} – Shop Online` } },
    });
  } catch (err) {
    await Store.findByIdAndDelete(store._id);
    await Settings.deleteOne({ storeId: store._id, key: 'store' });
    throw err;
  }

  res.status(201).json({
    success: true,
    data: { store, owner: { name: ownerName, email: ownerEmail, temporaryPassword: password } },
  });
});

export const adminUpdateStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, 'Store not found');

  if (req.body.name !== undefined) {
    const name = stripHtml(String(req.body.name).slice(0, 100));
    if (!name) throw new ApiError(422, 'Store name is required');
    store.name = name;
  }
  if (req.body.slug !== undefined && req.body.slug !== store.slug) {
    store.slug = await uniqueSlug(createSlug(req.body.slug) || store.slug);
  }

  await store.save();
  res.json({ success: true, data: store });
});

export const adminSetStoreStatus = asyncHandler(async (req, res) => {
  const status = String(req.body.status || '');
  if (!['active', 'suspended'].includes(status)) throw new ApiError(422, 'Invalid status');

  const store = await Store.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!store) throw new ApiError(404, 'Store not found');
  res.json({ success: true, data: store });
});

export default {
  adminListStores,
  adminGetStore,
  adminCreateStore,
  adminUpdateStore,
  adminSetStoreStatus,
};
