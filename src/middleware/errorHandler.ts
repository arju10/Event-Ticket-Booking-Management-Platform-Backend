import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import logger from '../lib/logger.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      code: err.code || 'ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      code: 'CONFLICT',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
};
