import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Token de autenticação não fornecido',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado',
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Não autenticado',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Requer permissão de administrador.',
    });
    return;
  }

  next();
};
