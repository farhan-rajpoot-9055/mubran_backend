import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import productController from '../controllers/productController.js';
import categoryController from '../controllers/categoryController.js';
import orderController from '../controllers/orderController.js';
import customerController from '../controllers/customerController.js';
import settingsController from '../controllers/settingsController.js';
import dashboardController from '../controllers/dashboardController.js';
import uploadController from '../controllers/uploadController.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.use(protect);

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