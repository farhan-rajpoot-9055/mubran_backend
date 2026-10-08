import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    // Optional — see storeId comment in Product.js. Also scopes the
    // findOne({whatsapp}) repeat-customer dedupe in orderController.js so
    // the same phone number at two different stores isn't merged.
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
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

customerSchema.index({ storeId: 1, whatsapp: 1 });
customerSchema.index({ whatsapp: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ name: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
export default Customer;