import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    productUrl: { type: String, default: '' },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerWhatsapp: { type: String, trim: true, maxlength: 20, default: '' },
    customerCity: { type: String, trim: true, maxlength: 60, default: '' },
    customerAddress: { type: String, trim: true, maxlength: 500, default: '' },
    items: { type: [orderItemSchema], required: true, validate: [(v) => v.length > 0, 'Order needs at least one item'] },
    subtotal: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PKR' },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'confirmed', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
    source: { type: String, enum: ['whatsapp', 'admin'], default: 'whatsapp' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customer: 1 });

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);
export const Order = mongoose.model('Order', orderSchema);
export default Order;