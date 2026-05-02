import { Request, Response } from 'express';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import { raffleService } from '../services/raffle.service';
import path from 'path';

export const createRaffleValidation = [
  body('title').trim().isLength({ min: 3, max: 500 }).withMessage('Título deve ter entre 3 e 500 caracteres'),
  body('description').trim().isLength({ min: 10 }).withMessage('Descrição deve ter no mínimo 10 caracteres'),
  body('draw_date').isISO8601().withMessage('Data do sorteio inválida'),
  body('total_numbers').isInt({ min: 1, max: 100000 }).withMessage('Total de números deve estar entre 1 e 100.000'),
  body('price_per_number').isFloat({ min: 0.01 }).withMessage('Preço por número deve ser maior que zero'),
  body('whatsapp_number').trim().notEmpty().withMessage('Número do WhatsApp é obrigatório'),
];

export class RaffleController {
  async getAll(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await raffleService.getAllRaffles({ page, limit, status });

    res.json({ success: true, data: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const raffle = await raffleService.getRaffleById(id);

    res.json({ success: true, data: raffle });
  }

  async create(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Remover arquivo se houve erro de validação
      if (req.files && Array.isArray(req.files)) {
        const fs = await import('fs');
        for (const f of req.files as Express.Multer.File[]) {
          try { fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
        }
      }
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const imagePaths = req.files && Array.isArray(req.files)
      ? (req.files as Express.Multer.File[]).map(f => path.join(process.env.UPLOAD_DIR || 'uploads', f.filename))
      : undefined;

    const raffle = await raffleService.createRaffle(
      {
        title: req.body.title,
        description: req.body.description,
        draw_date: req.body.draw_date,
        total_numbers: parseInt(req.body.total_numbers),
        price_per_number: parseFloat(req.body.price_per_number),
        whatsapp_number: req.body.whatsapp_number,
      },
      req.user!.userId,
      imagePaths
    );

    res.status(201).json({
      success: true,
      data: raffle,
      message: 'Rifa criada com sucesso',
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const imagePaths = req.files && Array.isArray(req.files)
      ? (req.files as Express.Multer.File[]).map(f => path.join(process.env.UPLOAD_DIR || 'uploads', f.filename))
      : undefined;

    const raffle = await raffleService.updateRaffle(id, req.body, imagePaths);

    res.json({
      success: true,
      data: raffle,
      message: 'Rifa atualizada com sucesso',
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await raffleService.deleteRaffle(id);

    res.json({
      success: true,
      message: 'Rifa excluída com sucesso',
    });
  }

  async getNumbers(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const numbers = await raffleService.getRaffleNumbers(id);

    res.json({ success: true, data: numbers });
  }

  async getStats(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const stats = await raffleService.getRaffleStats(id);

    res.json({ success: true, data: stats });
  }
}

export const raffleController = new RaffleController();
