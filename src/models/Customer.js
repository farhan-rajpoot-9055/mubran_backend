import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Customer name is required'], trim: true, maxlength: 100 },
    whatsapp: { type: String, trim: true, maxlength: 20, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    city: { type: String, trim: true, maxlength: 60, default: '' },
    address: { type: String, trim: true, maxlength: 500, default: '' },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

customerSchema.index({ whatsapp: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ name: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
export default Customer;