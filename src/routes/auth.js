import { Router } from 'express';
import { body } from 'express-validator';
import { login, getMe, changePassword } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimit.js';

const router = Router();

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 1 }).withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

export default router;