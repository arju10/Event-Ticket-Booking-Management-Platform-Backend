import { Request, Response, NextFunction } from 'express';
import { JwtHelpers } from '../lib/jwt.js';
import { AppError } from '../utils/AppError.js';

export const auth = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = JwtHelpers.extractToken(req.headers.authorization);
      if (!token) {
        throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
      }

      const decoded = JwtHelpers.verifyAccessToken(token);
      req.user = { id: decoded.userId, role: decoded.role };

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code || 'ERROR',
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
      });
    }
  };
};
