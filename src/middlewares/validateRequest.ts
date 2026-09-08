import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

// Validates { body, query, params } against a Zod schema, replacing the
// request pieces with the parsed (and type-coerced) result on success.
export function validateRequest(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join(".") || "unknown",
          message: e.message,
        }));
        return next(ApiError.badRequest("Validation failed", errors));
      }
      next(err);
    }
  };
}
