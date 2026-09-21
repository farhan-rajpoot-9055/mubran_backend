import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/index.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new ApiError(401, 'Not authorized. Please log in.');

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch {
    throw new ApiError(401, 'Session expired or invalid. Please log in again.');
  }

  const admin = await Admin.findById(payload.id);
  if (!admin || !admin.active) throw new ApiError(401, 'Account no longer active.');

  req.admin = admin;
  next();
});

export const adminOnly = (req, _res, next) => {
  if (req.admin && req.admin.role === 'admin') return next();
  next();
};

export const superAdminOnly = (req, _res, next) => {
  if (req.admin && req.admin.role === 'super_admin') return next();
  return next(new ApiError(403, 'Insufficient permissions.'));
};

export default protect;