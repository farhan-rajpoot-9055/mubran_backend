import { Router } from 'express';
import storeProductController from '../controllers/storeProductController.js';

const router = Router();

router.get('/', storeProductController.listStoreProducts);
router.get('/featured', storeProductController.getStoreFeaturedProducts);
router.get('/new-arrivals', storeProductController.getStoreNewArrivals);
router.get('/:slug/related', storeProductController.getStoreRelatedProducts);
router.get('/:slug', storeProductController.getStoreProductBySlug);

export default router;
