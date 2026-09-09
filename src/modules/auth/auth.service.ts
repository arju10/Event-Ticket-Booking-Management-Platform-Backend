import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  JwtPayload,
} from "../../utils/jwt";
import { RegisterInput, LoginInput } from "./auth.validation";
import { AuthTokens, AuthUserResponse } from "./auth.interface";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: JwtPayload["role"];
}): AuthUserResponse {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

async function register(
  input: RegisterInput,
): Promise<{ user: AuthUserResponse } & AuthTokens> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw ApiError.badRequest("Validation failed", [
      { field: "email", message: "Email already exists" },
    ]);
  }

  const hashed = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashed,
      name: input.name,
      phone: input.phone,
      role: input.role,
    },
  });

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return {
    user: toAuthUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

async function login(
  input: LoginInput,
): Promise<{ user: AuthUserResponse } & AuthTokens & { expiresIn: number }> {
  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null },
  });
  if (!user) throw new ApiError(401, "Invalid credentials", "AUTH_ERROR");

  const valid = await comparePassword(input.password, user.password);
  if (!valid) throw new ApiError(401, "Invalid credentials", "AUTH_ERROR");

  if (!user.isActive) throw ApiError.forbidden("Account has been suspended");

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return {
    user: toAuthUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 3600,
  };
}

async function refreshToken(
  token: string,
): Promise<AuthTokens & { expiresIn: number }> {
  let decoded: JwtPayload;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.invalidToken();
  }

  const user = await prisma.user.findFirst({
    where: { id: decoded.id, deletedAt: null },
  });
  if (!user || !user.isActive) throw ApiError.invalidToken();

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 3600,
  };
}

// Stateless reset flow: a short-lived JWT (signed with the refresh secret,
// scoped by a distinct `purpose` claim) stands in for the reset token so no
// extra DB table is needed. In production this would be emailed via
// nodemailer/Resend rather than returned directly.
async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  // Always resolve successfully regardless of whether the email exists, to
  // avoid leaking which emails are registered.
  if (!user) {
    logger.info(`Password reset requested for unknown email: ${email}`);
    return;
  }

  const resetToken = jwt.sign(
    { id: user.id, purpose: "password_reset" },
    env.jwt.refreshSecret,
    {
      expiresIn: "15m",
    },
  );

  // TODO: send resetToken via email (nodemailer/Resend) instead of logging.
  logger.info(`Password reset token for ${email}: ${resetToken}`);
}

async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  let decoded: { id: string; purpose: string };
  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret) as {
      id: string;
      purpose: string;
    };
  } catch {
    throw ApiError.badRequest("Reset token is invalid or expired");
  }
  if (decoded.purpose !== "password_reset")
    throw ApiError.badRequest("Invalid reset token");

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: decoded.id },
    data: { password: hashed },
  });
}

export const authService = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
};
