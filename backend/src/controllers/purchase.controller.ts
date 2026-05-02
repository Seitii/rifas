import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { purchaseService } from '../services/purchase.service';

export const reserveNumbersValidation = [
  body('raffle_id').isUUID().withMessage('ID da rifa inválido'),
  body('numbers').isArray({ min: 1 }).withMessage('Selecione pelo menos um número'),
  body('numbers.*').isInt({ min: 1 }).withMessage('Número inválido'),
  body('buyer_name').trim().isLength({ min: 2, max: 255 }).withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('buyer_phone').trim().isLength({ min: 8, max: 20 }).withMessage('Telefone inválido'),
];

export class PurchaseController {
  async reserveNumbers(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const result = await purchaseService.reserveNumbers({
      raffle_id: req.body.raffle_id,
      numbers: req.body.numbers,
      buyer_name: req.body.buyer_name,
      buyer_phone: req.body.buyer_phone,
    });

    if (!result.success) {
      res.status(409).json({
        success: false,
        message: result.message,
        data: { conflicted: result.conflicted },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        purchase: result.purchase,
        whatsappUrl: result.whatsappUrl,
      },
      message: 'Números reservados com sucesso! Redirecionando para o WhatsApp...',
    });
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const raffle_id = req.query.raffle_id as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await purchaseService.getAllPurchases({ page, limit, raffle_id, status });

    res.json({ success: true, data: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const purchase = await purchaseService.getPurchaseById(id);

    res.json({ success: true, data: purchase });
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const purchase = await purchaseService.cancelPurchase(id);

    res.json({
      success: true,
      data: purchase,
      message: 'Compra cancelada com sucesso',
    });
  }
}

export const purchaseController = new PurchaseController();
