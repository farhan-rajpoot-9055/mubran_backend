import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  fetchProductPage,
  fetchPublicProductBySlug,
  fetchRelatedProducts,
  fetchFeaturedProducts,
  fetchNewArrivals,
} from './productController.js';

// Store-scoped counterparts of listProducts/getProductBySlug/etc. — same
// query logic (via the shared helpers), just with storeId added to the
// filter so each store only ever sees its own products.

export const listStoreProducts = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await fetchProductPage(req, req.storeId);
  res.json({
    success: true,
    data: items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

export const getStoreProductBySlug = asyncHandler(async (req, res) => {
  const product = await fetchPublicProductBySlug(req.params.slug, req.storeId);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

export const getStoreRelatedProducts = asyncHandler(async (req, res) => {
  const related = await fetchRelatedProducts(req.params.slug, req.storeId);
  if (!related) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: related });
});

export const getStoreFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await fetchFeaturedProducts(req.storeId);
  res.json({ success: true, data: products });
});

export const getStoreNewArrivals = asyncHandler(async (req, res) => {
  const products = await fetchNewArrivals(req.storeId);
  res.json({ success: true, data: products });
});

export default {
  listStoreProducts,
  getStoreProductBySlug,
  getStoreRelatedProducts,
  getStoreFeaturedProducts,
  getStoreNewArrivals,
};
