import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';

export const loginValidation = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres'),
];

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
      message: 'Login realizado com sucesso',
    });
  }

  async me(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: req.user,
    });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  }
}

export const authController = new AuthController();
