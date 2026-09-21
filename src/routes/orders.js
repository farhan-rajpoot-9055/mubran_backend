import { Router } from 'express';
import { body } from 'express-validator';
import orderController from '../controllers/orderController.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const itemsValidator = body('items')
  .isArray({ min: 1 })
  .withMessage('Order must contain at least one item')
  .custom((items) =>
    items.every((it) => (it.productId && String(it.productId).length === 24) || it.sku)
  )
  .withMessage('Each item needs a valid productId or SKU');

router.post(
  '/whatsapp',
  [body('name').isLength({ min: 1, max: 100 }).withMessage('Name is required'), itemsValidator],
  validate,
  orderController.createWhatsappOrder
);

export default router;