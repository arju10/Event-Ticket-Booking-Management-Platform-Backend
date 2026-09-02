import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    next();
  };
};

export const isResourceOwner = (getOwnerId: (req: Request) => Promise<string>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = await getOwnerId(req);
      if (req.user?.role === 'ADMIN') {
        return next();
      }
      if (req.user?.id !== ownerId) {
        throw new AppError(403, 'You are not the owner of this resource', 'FORBIDDEN');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
