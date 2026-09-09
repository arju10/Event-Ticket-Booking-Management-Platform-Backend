import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";


export function isResourceOwner(
  getOwnerId: (req: Request) => Promise<string | null>,
) {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user) return next(ApiError.unauthorized());
      if (req.user.role === "ADMIN") return next();

      const ownerId = await getOwnerId(req);
      if (!ownerId) return next(ApiError.notFound());
      if (ownerId !== req.user.id)
        return next(ApiError.forbidden("You do not own this resource"));
      next();
    },
  );
}
