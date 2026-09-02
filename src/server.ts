import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './lib/logger.js';
import prisma from './lib/prisma.js';
import { config } from './config/index.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: config.cors.clientUrl, credentials: true }));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', generalLimiter);

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.env}`);
      logger.info(`📍 API: http://localhost:${config.port}/api/${config.apiVersion}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();



