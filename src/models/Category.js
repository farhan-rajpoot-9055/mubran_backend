import mongoose from 'mongoose';

const seoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 320 },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    // Optional — see storeId comment in Product.js for why (keeps legacy
    // single-store categories, which have no storeId, working unchanged).
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 80 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    image: { type: String, default: '' },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

categorySchema.index({ name: 1 });
categorySchema.index({ storeId: 1, slug: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
export default Category;