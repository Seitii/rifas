import { Router } from 'express';
import { purchaseController, reserveNumbersValidation } from '../controllers/purchase.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rota pública — usuário faz a reserva
router.post(
  '/reserve',
  reserveNumbersValidation,
  purchaseController.reserveNumbers.bind(purchaseController)
);

// Rotas protegidas (admin)
router.get(
  '/',
  authenticate,
  requireAdmin,
  purchaseController.getAll.bind(purchaseController)
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  purchaseController.getById.bind(purchaseController)
);

router.delete(
  '/:id/cancel',
  authenticate,
  requireAdmin,
  purchaseController.cancel.bind(purchaseController)
);

export default router;
