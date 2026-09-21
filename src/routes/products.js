import { Router } from 'express';
import productController from '../controllers/productController.js';

const router = Router();

router.get('/', productController.listProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/:slug/related', productController.getRelatedProducts);
router.get('/:slug', productController.getProductBySlug);

export default router;