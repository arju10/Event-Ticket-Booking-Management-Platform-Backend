import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  database: {
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  },

  cors: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  bkash: {
    appKey: process.env.BKASH_APP_KEY || '',
    appSecret: process.env.BKASH_APP_SECRET || '',
    username: process.env.BKASH_USERNAME || '',
    password: process.env.BKASH_PASSWORD || '',
    baseUrl: process.env.BKASH_BASE_URL || '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
