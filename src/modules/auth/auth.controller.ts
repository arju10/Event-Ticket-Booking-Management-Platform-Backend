import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/ApiResponse";
import { authService } from "./auth.service";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  sendSuccess(res, 201, "User registered successfully", result);
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendSuccess(res, 200, "Login successful", result);
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  sendSuccess(res, 200, "Token refreshed successfully", result);
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  // Stateless JWT — logout is a client-side token discard. Nothing to
  // invalidate server-side unless a token denylist is added later.
  sendSuccess(res, 200, "Logged out successfully", null);
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, 200, "Password reset link sent to your email", null);
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  sendSuccess(res, 200, "Password reset successfully", null);
});

export const authController = { register, login, refreshToken, logout, forgotPassword, resetPassword };
