import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many booking attempts, please slow down',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many payment attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
