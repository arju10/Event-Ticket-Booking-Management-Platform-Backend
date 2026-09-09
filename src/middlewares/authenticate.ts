import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { prisma } from "../config/db";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized();
    }
    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) throw ApiError.invalidToken();
    if (!user.isActive) throw ApiError.forbidden("Account has been suspended");

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.invalidToken());
  }
}
