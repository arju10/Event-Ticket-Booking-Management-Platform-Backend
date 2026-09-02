import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/ApiError";
import { catchAsync } from "@/utils/catchAsync";

// Generic ownership check: given a lookup function that returns the owning
// userId for a resource, ensures the caller either owns it or is an ADMIN
// (admins bypass ownership but the bypass is still audit-logged by the
// calling service). Must run after `authenticate`.
export function isResourceOwner(getOwnerId: (req: Request) => Promise<string | null>) {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === "ADMIN") return next();

    const ownerId = await getOwnerId(req);
    if (!ownerId) return next(ApiError.notFound());
    if (ownerId !== req.user.id) return next(ApiError.forbidden("You do not own this resource"));
    next();
  });
}
