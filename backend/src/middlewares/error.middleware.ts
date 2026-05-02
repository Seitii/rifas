import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Erro capturado:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Erros do PostgreSQL
  if ((err as any).code) {
    const pgCode = (err as any).code;

    if (pgCode === '23505') {
      res.status(409).json({
        success: false,
        message: 'Conflito: registro duplicado',
      });
      return;
    }

    if (pgCode === '23503') {
      res.status(400).json({
        success: false,
        message: 'Referência inválida',
      });
      return;
    }
  }

  // Erros de validação
  if (err.message.includes('inválid') || err.message.includes('não encontrad')) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Erro genérico 500
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.url}`,
  });
};
