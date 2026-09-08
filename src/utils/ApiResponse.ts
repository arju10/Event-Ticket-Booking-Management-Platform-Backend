import { Response } from "express";
import { PaginationMeta } from "../types/common.types";

// Every success response in the API goes through one of these two helpers so
// the envelope shape (per the spec) is never hand-rolled in a controller.
export function sendSuccess(
  res: Response,
  statusCode: number,
  message: string,
  data: unknown = null
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function sendPaginated(
  res: Response,
  message: string,
  items: unknown[],
  pagination: PaginationMeta,
  extra: Record<string, unknown> = {}
) {
  return res.status(200).json({
    success: true,
    message,
    data: { items, pagination, ...extra },
    timestamp: new Date().toISOString(),
  });
}
