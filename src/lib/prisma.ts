import { PrismaClient } from '@prisma/client/extension.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient({
  log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
