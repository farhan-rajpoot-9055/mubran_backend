import { Store } from '../models/Store.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Resolves the store from the :storeSlug route param and attaches it to the
// request. Mount only on store-scoped routes (see routes/storeProducts.js) —
// existing unscoped routes (/api/products etc.) never see this middleware.
export const resolveStore = asyncHandler(async (req, _res, next) => {
  const slug = String(req.params.storeSlug || '').toLowerCase().trim();
  const store = await Store.findOne({ slug, status: 'active' });
  if (!store) throw new ApiError(404, 'Store not found');

  req.store = store;
  req.storeId = store._id;
  next();
});

export default resolveStore;
