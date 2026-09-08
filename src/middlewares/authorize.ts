import { Request, Response, NextFunction } from "express";
import { UserRole } from "../generated/prisma";
import { ApiError } from "../utils/ApiError";

// Role gate. Must run after `authenticate`.
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
