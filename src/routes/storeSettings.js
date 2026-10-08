import { Router } from 'express';
import storeSettingsController from '../controllers/storeSettingsController.js';

const router = Router();

router.get('/public', storeSettingsController.getStorePublicSettings);

export default router;
