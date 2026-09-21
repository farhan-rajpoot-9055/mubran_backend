import mongoose from 'mongoose';

const seoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 320 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
    },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    salePrice: { type: Number, min: [0, 'Sale price cannot be negative'], default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
    published: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    altText: { type: String, trim: true, maxlength: 200, default: '' },
    seo: { type: seoSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('discountPercent').get(function () {
  if (!this.salePrice || !this.price || this.salePrice >= this.price) return 0;
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

productSchema.virtual('currentPrice').get(function () {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

productSchema.virtual('coverImage').get(function () {
  return this.images && this.images.length ? this.images[0] : '';
});

productSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    sku: this.sku,
    description: this.description,
    price: this.price,
    salePrice: this.salePrice,
    discountPercent: this.discountPercent,
    category: this.category,
    images: this.images,
    stock: this.stock,
    inStock: this.inStock,
    published: this.published,
    featured: this.featured,
    altText: this.altText,
    seo: this.seo,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

productSchema.index({ category: 1 });
productSchema.index({ published: 1, featured: 1 });
productSchema.index({ name: 'text', description: 'text', sku: 'text' });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

export const Product = mongoose.model('Product', productSchema);
export default Product;