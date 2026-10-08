import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { Store } from '../models/Store.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/index.js';

const signToken = (admin) =>
  jwt.sign({ id: admin._id, role: admin.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

// The frontend needs the store's slug (not just its id) to build links to
// the admin's own storefront and to label the admin panel correctly.
const withStoreSlug = async (admin) => {
  const safe = admin.toSafeJSON();
  if (!admin.storeId) return safe;
  const store = await Store.findById(admin.storeId).select('slug name');
  return { ...safe, storeSlug: store?.slug || null, storeName: store?.name || null };
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email: String(email || '').toLowerCase().trim() }).select(
    '+password'
  );

  if (!admin || !admin.active || !(await admin.comparePassword(String(password || '')))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  admin.lastLoginAt = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = signToken(admin);
  res.json({ success: true, token, admin: await withStoreSlug(admin) });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: await withStoreSlug(req.admin) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!admin || !(await admin.comparePassword(String(currentPassword || '')))) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  admin.password = newPassword;
  await admin.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

export default { login, getMe, changePassword };