import rateLimit from "express-rate-limit";

// express-rate-limit v7 defaults its response to a plain string; we override
// with `handler` so rate-limit rejections still match the standard envelope.
function makeLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message,
        code: "RATE_LIMIT_EXCEEDED",
        errors: [],
      });
    },
  });
}

export const generalLimiter = makeLimiter(
  60 * 1000,
  100,
  "Too many requests, please try again later",
);
export const authLimiter = makeLimiter(
  60 * 1000,
  5,
  "Too many authentication attempts, please try again later",
);
export const bookingLimiter = makeLimiter(
  60 * 1000,
  10,
  "Too many booking attempts, please slow down",
);
export const paymentLimiter = makeLimiter(
  60 * 1000,
  3,
  "Too many payment attempts, please try again later",
);
