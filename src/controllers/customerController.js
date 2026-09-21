import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { stripHtml } from '../utils/helpers.js';

export const adminListCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  const q = String(req.query.q || '').trim();

  const query = {};
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { whatsapp: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { city: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Customer.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    Customer.countDocuments(query),
  ]);

  const orderCounts = await Order.aggregate([
    { $match: { customer: { $in: items.map((c) => c._id) } } },
    { $group: { _id: '$customer', orders: { $sum: 1 }, totalSpent: { $sum: '$subtotal' } } },
  ]);
  const map = Object.fromEntries(orderCounts.map((o) => [String(o._id), o]));

  const data = items.map((c) => ({
    ...c.toObject(),
    orderCount: map[String(c._id)]?.orders || 0,
    totalSpent: map[String(c._id)]?.totalSpent || 0,
  }));

  res.json({
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

export const adminGetCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { ...customer.toObject(), orders } });
});

export const adminUpdateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const clean = (v, max) => stripHtml(String(v ?? '').slice(0, max));
  customer.name = clean(req.body.name, 100) || customer.name;
  if (req.body.whatsapp !== undefined) customer.whatsapp = clean(req.body.whatsapp.replace(/\D/g, ''), 20);
  if (req.body.email !== undefined) customer.email = clean(req.body.email, 120);
  if (req.body.phone !== undefined) customer.phone = clean(req.body.phone, 20);
  if (req.body.city !== undefined) customer.city = clean(req.body.city, 60);
  if (req.body.address !== undefined) customer.address = clean(req.body.address, 500);
  if (req.body.notes !== undefined) customer.notes = clean(req.body.notes, 1000);

  await customer.save();
  res.json({ success: true, data: customer });
});

export const adminDeleteCustomer = asyncHandler(async (req, res) => {
  const orderCount = await Order.countDocuments({ customer: req.params.id });
  if (orderCount > 0) {
    throw new ApiError(409, 'Customer has order history and cannot be deleted');
  }
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, message: 'Customer deleted' });
});

export default {
  adminListCustomers,
  adminGetCustomer,
  adminUpdateCustomer,
  adminDeleteCustomer,
};