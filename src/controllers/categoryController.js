import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createSlug } from '../utils/helpers.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  const counts = await Product.aggregate([
    { $match: { published: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  const data = categories.map((c) => ({
    ...c.toObject(),
    productCount: countMap[String(c._id)] || 0,
  }));
  res.json({ success: true, data });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, active: true });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});

export const adminListCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  const data = categories.map((c) => ({
    ...c.toObject(),
    productCount: countMap[String(c._id)] || 0,
  }));
  res.json({ success: true, data });
});

export const adminGetCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});

const uniqueSlug = async (slug, excludeId) => {
  let candidate = slug;
  let n = 2;
  while (await Category.exists({ slug: candidate, _id: { $ne: excludeId } })) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
};

const categoryPayload = (body) => {
  const clean = (v) => String(v || '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .trim();
  return {
    name: clean(body.name),
    description: clean(body.description),
    image: String(body.image || '').replace(/<[^>]*>/g, '').trim(),
    active: body.active === true || body.active === 'true',
    sortOrder: parseInt(body.sortOrder, 10) || 0,
    seo: {
      title: clean(body.seoTitle),
      description: clean(body.seoDescription),
    },
  };
};

export const adminCreateCategory = asyncHandler(async (req, res) => {
  const payload = categoryPayload(req.body);
  if (!payload.name) throw new ApiError(422, 'Category name is required');
  const slug = await uniqueSlug(createSlug(payload.name) || 'category');
  const category = await Category.create({ ...payload, slug });
  res.status(201).json({ success: true, data: category });
});

export const adminUpdateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  const payload = categoryPayload({ ...category.toObject(), ...req.body });
  const nameChanged = payload.name && payload.name !== category.name;
  let slug = category.slug;
  if (nameChanged) slug = await uniqueSlug(createSlug(payload.name) || 'category', category._id);

  const updated = await Category.findByIdAndUpdate(
    category._id,
    { ...payload, slug },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: updated });
});

export const adminDeleteCategory = asyncHandler(async (req, res) => {
  const productsUsing = await Product.countDocuments({ category: req.params.id });
  if (productsUsing > 0) {
    throw new ApiError(409, `Cannot delete category — ${productsUsing} product(s) still use it`);
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deleted' });
});

export const adminPatchCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  if (typeof req.body.active !== 'undefined') {
    const active = req.body.active === true || req.body.active === 'true';
    await Category.updateOne({ _id: category._id }, { active });
  }
  const updated = await Category.findById(category._id);
  res.json({ success: true, data: updated });
});

export default {
  listCategories,
  getCategoryBySlug,
  adminListCategories,
  adminGetCategory,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminPatchCategory,
};