import { Router } from 'express';
import storeCategoryController from '../controllers/storeCategoryController.js';

const router = Router();

router.get('/', storeCategoryController.listStoreCategories);
router.get('/:slug', storeCategoryController.getStoreCategoryBySlug);

export default router;
