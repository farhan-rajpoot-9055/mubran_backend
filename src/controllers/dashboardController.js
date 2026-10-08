import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { Customer } from '../models/Customer.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const storeId = req.admin.storeId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    featuredProducts,
    totalCategories,
    activeCategories,
    totalCustomers,
    totalOrders,
    pendingOrders,
    monthOrders,
    monthRevenue,
    lowStockProducts,
    outOfStockProducts,
  ] = await Promise.all([
    Product.countDocuments({ storeId }),
    Product.countDocuments({ storeId, published: true }),
    Product.countDocuments({ storeId, published: false }),
    Product.countDocuments({ storeId, featured: true }),
    Category.countDocuments({ storeId }),
    Category.countDocuments({ storeId, active: true }),
    Customer.countDocuments({ storeId }),
    Order.countDocuments({ storeId }),
    Order.countDocuments({ storeId, status: { $in: ['pending', 'in_review'] } }),
    Order.countDocuments({ storeId, createdAt: { $gte: monthStart } }),
    Order.aggregate([
      { $match: { storeId, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$subtotal' } } },
    ]),
    Product.countDocuments({ storeId, stock: { $gt: 0, $lte: 10 } }),
    Product.countDocuments({ storeId, stock: { $lte: 0 } }),
  ]);

  const stockAgg = await Product.aggregate([
    { $match: { storeId } },
    { $group: { _id: null, totalStock: { $sum: '$stock' } } },
  ]);
  const totalStock = stockAgg[0]?.totalStock || 0;

  const recentOrders = await Order.find({ storeId }).sort({ createdAt: -1 }).limit(5).select('orderNumber customerName subtotal status createdAt');

  res.json({
    success: true,
    data: {
      totals: {
        products: totalProducts,
        published: publishedProducts,
        drafts: draftProducts,
        featured: featuredProducts,
        categories: totalCategories,
        activeCategories,
        customers: totalCustomers,
        orders: totalOrders,
        pendingOrders,
        monthOrders,
        monthRevenue: monthRevenue[0]?.total || 0,
        totalStock,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      recentOrders,
    },
  });
});

export default { getDashboardStats };