import { PrismaClient } from '@prisma/client';
import logger from './logger';

/**
 * Prisma Client instance with logging configuration
 */
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log Prisma queries in development
prisma.$on('query', (e) => {
  logger.debug('Prisma Query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

// Log Prisma errors
prisma.$on('error', (e) => {
  logger.error('Prisma Error', {
    message: e.message,
    target: e.target,
  });
});

// Log Prisma warnings
prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning', {
    message: e.message,
    target: e.target,
  });
});

/**
 * Connect to database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw error;
  }
};

/**
 * Disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection failed', { error });
    throw error;
  }
};

export default prisma;
