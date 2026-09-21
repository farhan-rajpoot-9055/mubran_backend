import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createSlug } from '../utils/helpers.js';

const PAGE_SIZE = 12;

const buildPublicQuery = async (req) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    inStock,
    featured,
    sale,
    published = 'true',
  } = req.query;

  const query = {};
  if (String(published) !== 'false') query.published = true;

  if (q && String(q).trim().length) {
    query.$text = { $search: String(q).trim() };
  }

  if (category) {
    if (mongoose.Types.ObjectId.isValid(String(category))) {
      query.category = mongoose.Types.ObjectId.createFromHexString(String(category));
    } else {
      const resolved = await Category.findOne({ slug: String(category) }).select('_id');
      query.category = resolved ? resolved._id : mongoose.Types.ObjectId.createFromHexString('0'.repeat(24));
    }
  }

  const priceFilter = {};
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (Number.isFinite(min) && min >= 0) priceFilter.$gte = Math.round(min);
  if (Number.isFinite(max) && max >= 0) priceFilter.$lte = Math.round(max);
  if (Object.keys(priceFilter).length) query.price = priceFilter;

  if (String(inStock) === 'true') query.stock = { $gt: 0 };
  if (String(featured) === 'true') query.featured = true;
  if (String(sale) === 'true') {
    query.$and = [{ salePrice: { $gt: 0 } }, { $expr: { $lt: ['$salePrice', '$price'] } }];
  }

  return query;
};

const parseSort = (sort) => {
  switch (sort) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'featured':
      return { featured: -1, createdAt: -1 };
    case 'name_asc':
      return { name: 1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(60, Math.max(1, parseInt(req.query.pageSize, 10) || PAGE_SIZE));
  const query = await buildPublicQuery(req);
  const sort = parseSort(req.query.sort);

  const [items, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, published: true }).populate(
    'category',
    'name slug'
  );
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).select('category');
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.find({
    _id: { $ne: product._id },
    published: true,
    ...(product.category ? { category: product.category } : {}),
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(8);

  res.json({ success: true, data: related });
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ published: true, featured: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(8);
  res.json({ success: true, data: products });
});

export const getNewArrivals = asyncHandler(async (req, res) => {
  const products = await Product.find({ published: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(8);
  res.json({ success: true, data: products });
});

const uniqueSlug = async (slug, excludeId) => {
  let candidate = slug;
  let n = 2;
  let exists = true;
  while (exists) {
    const found = await Product.findOne({ slug: candidate, _id: { $ne: excludeId } }).select('_id');
    if (found) {
      candidate = `${slug}-${n}`;
      n += 1;
    } else {
      exists = false;
    }
  }
  return candidate;
};

const productPayload = (body) => {
  const clean = (v) => String(v || '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .trim();

  const price = parseFloat(body.price);
  const salePrice = body.salePrice === '' || body.salePrice === null || body.salePrice === undefined
    ? null
    : parseFloat(body.salePrice);

  return {
    name: clean(body.name),
    sku: clean(body.sku).toUpperCase(),
    description: clean(body.description),
    price: Number.isFinite(price) ? price : 0,
    salePrice: Number.isFinite(salePrice) ? salePrice : null,
    category: body.category && mongoose.Types.ObjectId.isValid(body.category) ? body.category : null,
    images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
    stock: Math.max(0, parseInt(body.stock, 10) || 0),
    published: body.published === true || body.published === 'true',
    featured: body.featured === true || body.featured === 'true',
    altText: clean(body.altText),
    seo: {
      title: clean(body.seoTitle) || '',
      description: clean(body.seoDescription) || '',
    },
  };
};

export const adminListProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  const q = String(req.query.q || '').trim();
  const category = req.query.category ? String(req.query.category) : '';
  const status = String(req.query.status || '');

  const query = {};
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { sku: { $regex: q, $options: 'i' } },
    ];
  }
  if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
  if (status === 'published') query.published = true;
  if (status === 'draft') query.published = false;
  if (status === 'featured') query.featured = true;
  if (status === 'out_of_stock') query.stock = { $lte: 0 };
  if (status === 'low_stock') query.stock = { $gt: 0, $lte: 10 };

  const [items, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

export const adminGetProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

export const adminCreateProduct = asyncHandler(async (req, res) => {
  const body = productPayload(req.body);
  if (!body.name || !body.sku) throw new ApiError(422, 'Name and SKU are required');

  if (body.category) {
    const catExists = await Category.exists({ _id: body.category });
    if (!catExists) throw new ApiError(400, 'Selected category does not exist');
  }

  const slug = await uniqueSlug(createSlug(body.name) || 'product');
  const product = await Product.create({ ...body, slug });
  res.status(201).json({ success: true, data: product });
});

export const adminUpdateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const body = productPayload({ ...product.toObject(), ...req.body });
  if (body.category) {
    const catExists = await Category.exists({ _id: body.category });
    if (!catExists) throw new ApiError(400, 'Selected category does not exist');
  }

  const nameChanged = body.name && body.name !== product.name;
  let slug = product.slug;
  if (nameChanged) slug = await uniqueSlug(createSlug(body.name) || 'product', product._id);

  const updated = await Product.findByIdAndUpdate(
    product._id,
    { ...body, slug },
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  res.json({ success: true, data: updated });
});

export const adminDeleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, message: 'Product deleted' });
});

export const adminPatchProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const allowed = ['published', 'featured', 'stock', 'price', 'salePrice', 'stockShift', 'name', 'sku'];
  if (typeof req.body.stockShift !== 'undefined' && Number.isFinite(Number(req.body.stockShift))) {
    product.stock = Math.max(0, product.stock + Number(req.body.stockShift));
    delete req.body.stockShift;
  }
  Object.keys(req.body).forEach((key) => {
    if (allowed.includes(key)) {
      if (key === 'published' || key === 'featured') product[key] = req.body[key] === true || req.body[key] === 'true';
      else if (key === 'name' || key === 'sku') product[key] = String(req.body[key]);
      else product[key] = Number(req.body[key]);
    }
  });
  await product.save();
  res.json({ success: true, data: product });
});

export default {
  listProducts,
  getProductBySlug,
  getRelatedProducts,
  getFeaturedProducts,
  getNewArrivals,
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminPatchProduct,
};