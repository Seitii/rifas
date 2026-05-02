import { Router } from 'express';
import { authController, loginValidation, changePasswordValidation } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginValidation, authController.login.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));
router.put('/change-password', authenticate, requireAdmin, changePasswordValidation, authController.changePassword.bind(authController));

export default router;
