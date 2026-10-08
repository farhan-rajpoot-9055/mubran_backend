import { Order } from '../models/Order.js';

export const generateOrderNumber = async (storeId = null) => {
  const year = new Date().getFullYear();
  const prefix = `AMS-${year}-`;
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const count = await Order.countDocuments({ storeId, createdAt: { $gte: startOfYear } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

export default generateOrderNumber;