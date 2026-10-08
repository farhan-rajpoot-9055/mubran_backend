import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fetchPublicCategories, fetchPublicCategoryBySlug } from './categoryController.js';

export const listStoreCategories = asyncHandler(async (req, res) => {
  const data = await fetchPublicCategories(req.storeId);
  res.json({ success: true, data });
});

export const getStoreCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await fetchPublicCategoryBySlug(req.params.slug, req.storeId);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});

export default { listStoreCategories, getStoreCategoryBySlug };
