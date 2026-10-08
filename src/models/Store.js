import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Store name is required'], trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
      maxlength: 60,
    },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

export const Store = mongoose.model('Store', storeSchema);
export default Store;
