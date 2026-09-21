import { Router } from 'express';
import { getPublicSettings } from '../controllers/settingsController.js';

const router = Router();

router.get('/public', getPublicSettings);

export default router;
