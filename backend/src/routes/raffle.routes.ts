import { Router } from 'express';
import { raffleController, createRaffleValidation } from '../controllers/raffle.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Rotas públicas
router.get('/', raffleController.getAll.bind(raffleController));
router.get('/:id', raffleController.getById.bind(raffleController));
router.get('/:id/numbers', raffleController.getNumbers.bind(raffleController));
router.get('/:id/stats', raffleController.getStats.bind(raffleController));

// Rotas protegidas (admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.array('images', 5),
  createRaffleValidation,
  raffleController.create.bind(raffleController)
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.array('images', 5),
  raffleController.update.bind(raffleController)
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  raffleController.delete.bind(raffleController)
);

export default router;
