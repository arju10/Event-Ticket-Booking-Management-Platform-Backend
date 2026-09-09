import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { Prisma } from "../generated/prisma/client";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500)
      logger.error(err.message, { stack: err.stack, path: req.path });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: `A record with this ${(err.meta?.target as string[])?.join(", ") ?? "value"} already exists`,
        errors: [],
        code: "CONFLICT",
        timestamp: new Date().toISOString(),
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
        errors: [],
        code: "NOT_FOUND",
        timestamp: new Date().toISOString(),
      });
    }
  }

  logger.error("Unhandled error", { err, path: req.path });
  return res.status(500).json({
    success: false,
    message: "Something went wrong",
    errors: [],
    code: "INTERNAL_SERVER_ERROR",
    timestamp: new Date().toISOString(),
  });
}
