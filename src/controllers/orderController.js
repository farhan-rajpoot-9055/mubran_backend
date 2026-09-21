import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateOrderNumber } from '../services/orderNumber.js';
import { stripHtml } from '../utils/helpers.js';

export const createWhatsappOrder = asyncHandler(async (req, res) => {
  const { name, whatsapp, city, address, notes, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(422, 'Order must contain at least one item');
  }

  const customerName = stripHtml(String(name || '').slice(0, 100));
  if (!customerName) throw new ApiError(422, 'Customer name is required');

  const enriched = [];
  let subtotal = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.min(99, parseInt(item.quantity, 10) || 1));
    let product = null;
    let snapshot = {};

    if (item.productId && String(item.productId).match(/^[a-f\d]{24}$/i)) {
      product = await Product.findById(item.productId);
    } else if (item.sku) {
      product = await Product.findOne({ sku: String(item.sku).toUpperCase() });
    }

    if (!product) continue;

    if (product.stock <= 0) {
      throw new ApiError(409, `${product.name} is out of stock`);
    }
    if (product.stock < qty) {
      throw new ApiError(409, `Only ${product.stock} unit(s) of ${product.name} are available`);
    }

    const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
    snapshot = {
      product: product._id,
      name: product.name,
      sku: product.sku,
      price,
      quantity: qty,
      image: product.images?.[0] || '',
    };
    enriched.push(snapshot);
    subtotal += price * qty;
  }

  if (enriched.length === 0) {
    throw new ApiError(422, 'No valid products in the order');
  }

  let customer = null;
  const whatsappClean = stripHtml(String(whatsapp || '').replace(/\D/g, '').slice(0, 20));
  const emailClean = stripHtml(String(req.body.email || '').slice(0, 120));

  if (whatsappClean) {
    customer = await Customer.findOne({ whatsapp: whatsappClean });
    if (!customer) {
      customer = await Customer.create({
        name: customerName,
        whatsapp: whatsappClean,
        city: stripHtml(String(city || '').slice(0, 60)),
        address: stripHtml(String(address || '').slice(0, 500)),
        email: emailClean,
      });
    } else {
      customer.name = customerName;
      if (city) customer.city = customer.city || stripHtml(String(city).slice(0, 60));
      if (address) customer.address = customer.address || stripHtml(String(address).slice(0, 500));
      await customer.save();
    }
  }

  const orderNumber = await generateOrderNumber();
  const order = await Order.create({
    orderNumber,
    customer: customer?._id || null,
    customerName,
    customerWhatsapp: whatsappClean,
    customerCity: stripHtml(String(city || '').slice(0, 60)),
    customerAddress: stripHtml(String(address || '').slice(0, 500)),
    items: enriched,
    subtotal,
    source: 'whatsapp',
    notes: stripHtml(String(notes || '').slice(0, 2000)),
  });

  res.status(201).json({
    success: true,
    message: 'Order request received',
    data: { order, whatsappMessage: buildWhatsappSummary(order) },
  });
});

export const buildWhatsappSummary = (order) => {
  const lines = ['Assalam-o-Alaikum,', '', 'I want to order the following items:', ''];
  order.items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.name}`);
    lines.push(`   SKU: ${it.sku}`);
    lines.push(`   Qty: ${it.quantity}  x  PKR ${it.price.toLocaleString('en-PK')}`);
    lines.push('');
  });
  lines.push(`Estimated Subtotal: PKR ${order.subtotal.toLocaleString('en-PK')}`);
  lines.push('');
  lines.push('Please confirm availability and order details.');
  lines.push('');
  lines.push('Thank you.');
  return lines.join('\n');
};

export const adminListOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  const status = String(req.query.status || '');
  const q = String(req.query.q || '').trim();

  const query = {};
  if (status) query.status = status;
  if (q) {
    query.$or = [
      { orderNumber: { $regex: q, $options: 'i' } },
      { customerName: { $regex: q, $options: 'i' } },
      { customerWhatsapp: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Order.find(query)
      .populate('customer', 'name whatsapp phone city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Order.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

export const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, data: order });
});

export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  const status = String(req.body.status || '');
  const allowed = ['pending', 'in_review', 'confirmed', 'fulfilled', 'cancelled'];
  if (!allowed.includes(status)) throw new ApiError(422, 'Invalid order status');
  order.status = status;
  order.notes = String(req.body.notes ?? order.notes ?? '').slice(0, 2000);
  await order.save();
  res.json({ success: true, data: order });
});

export const adminDeleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, message: 'Order deleted' });
});

export default {
  createWhatsappOrder,
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminDeleteOrder,
};