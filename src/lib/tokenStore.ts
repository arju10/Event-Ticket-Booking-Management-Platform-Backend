import crypto from 'crypto';
import prisma from './prisma.js';

const hashToken = async (token: string): Promise<string> => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const saveRefreshToken = async (userId: string, token: string, expiresAt: Date): Promise<void> => {
  const hashedToken = await hashToken(token);
  await prisma.refreshToken.create({
    data: { userId, token: hashedToken, expiresAt, isRevoked: false },
  });
};

const validateRefreshToken = async (userId: string, token: string): Promise<boolean> => {
  const hashedToken = await hashToken(token);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      userId,
      token: hashedToken,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  });
  return !!stored;
};

const revokeRefreshToken = async (userId: string, token: string): Promise<void> => {
  const hashedToken = await hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { userId, token: hashedToken },
    data: { isRevoked: true },
  });
};

const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
};

export const TokenStore = {
  saveRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
