import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin',
    },
    // The store this admin owns/manages. Required for role 'admin' (a store
    // owner), must be null for 'super_admin' (the platform-wide manager) —
    // enforced below so a stray/missing value fails validation clearly
    // instead of surfacing as a confusing 403 later.
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminSchema.pre('validate', function (next) {
  if (this.role === 'super_admin' && this.storeId) {
    return next(new Error('super_admin accounts must not have a storeId'));
  }
  if (this.role === 'admin' && !this.storeId) {
    return next(new Error('admin accounts must have a storeId'));
  }
  next();
});

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

adminSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    storeId: this.storeId,
    active: this.active,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Admin = mongoose.model('Admin', adminSchema);
export default Admin;