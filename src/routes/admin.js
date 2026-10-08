import { Router } from 'express';
import { protect, requireSuperAdmin } from '../middlewares/auth.js';
import productController from '../controllers/productController.js';
import categoryController from '../controllers/categoryController.js';
import orderController from '../controllers/orderController.js';
import customerController from '../controllers/customerController.js';
import settingsController from '../controllers/settingsController.js';
import dashboardController from '../controllers/dashboardController.js';
import uploadController from '../controllers/uploadController.js';
import storeManagementController from '../controllers/storeManagementController.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.use(protect);

// Platform-only: super admin managing the store list itself (not a store's
// own data — every route below this uses req.admin.storeId to scope to the
// logged-in admin's own store instead).
router.get('/stores', requireSuperAdmin, storeManagementController.adminListStores);
router.get('/stores/:id', requireSuperAdmin, storeManagementController.adminGetStore);
router.post('/stores', requireSuperAdmin, storeManagementController.adminCreateStore);
router.put('/stores/:id', requireSuperAdmin, storeManagementController.adminUpdateStore);
router.patch('/stores/:id/status', requireSuperAdmin, storeManagementController.adminSetStoreStatus);

router.get('/dashboard', dashboardController.getDashboardStats);

router.get('/products', productController.adminListProducts);
router.get('/products/:id', productController.adminGetProduct);
router.post('/products', productController.adminCreateProduct);
router.put('/products/:id', productController.adminUpdateProduct);
router.patch('/products/:id', productController.adminPatchProduct);
router.delete('/products/:id', productController.adminDeleteProduct);

router.get('/categories', categoryController.adminListCategories);
router.get('/categories/:id', categoryController.adminGetCategory);
router.post('/categories', categoryController.adminCreateCategory);
router.put('/categories/:id', categoryController.adminUpdateCategory);
router.patch('/categories/:id', categoryController.adminPatchCategory);
router.delete('/categories/:id', categoryController.adminDeleteCategory);

router.get('/orders', orderController.adminListOrders);
router.get('/orders/:id', orderController.adminGetOrder);
router.patch('/orders/:id', orderController.adminUpdateOrderStatus);
router.delete('/orders/:id', orderController.adminDeleteOrder);

router.get('/customers', customerController.adminListCustomers);
router.get('/customers/:id', customerController.adminGetCustomer);
router.put('/customers/:id', customerController.adminUpdateCustomer);
router.delete('/customers/:id', customerController.adminDeleteCustomer);

router.get('/settings', settingsController.adminGetSettings);
router.put('/settings', settingsController.adminUpdateSettings);
router.post('/settings/reset', settingsController.adminResetDefaultSettings);

router.post('/upload', upload.single('image'), uploadController.uploadImage);

export default router;