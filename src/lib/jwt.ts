import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';

export interface ITokenPayload {
  userId: string;
  role: string;
  jti?: string;
}

const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      jti: payload.jti || crypto.randomBytes(16).toString('hex'),
    } as object,
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      issuer: 'event-platform',
      audience: 'event-platform-api',
    } as jwt.SignOptions,
  );
};

const generateRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      jti: crypto.randomBytes(16).toString('hex'),
    } as object,
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'event-platform',
      audience: 'event-platform-api',
    } as jwt.SignOptions,
  );
};

const verifyAccessToken = (token: string): ITokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'event-platform',
      audience: 'event-platform-api',
    } as jwt.VerifyOptions) as ITokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('INVALID_TOKEN');
  }
};

const verifyRefreshToken = (token: string): { userId: string; jti: string } => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'event-platform',
      audience: 'event-platform-api',
    } as jwt.VerifyOptions) as { userId: string; jti: string };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    throw new Error('INVALID_REFRESH_TOKEN');
  }
};

const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

export const JwtHelpers = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractToken,
};
