import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import { authLimiter } from "../../middlewares/rateLimiter";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  authController.register,
);
router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  authController.login,
);
router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  authController.refreshToken,
);
router.post("/logout", authenticate, authController.logout);
router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validateRequest(resetPasswordSchema),
  authController.resetPassword,
);

export const authRoutes = router;
