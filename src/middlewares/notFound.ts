import { Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    errors: [],
    code: "NOT_FOUND",
    timestamp: new Date().toISOString(),
  });
}
