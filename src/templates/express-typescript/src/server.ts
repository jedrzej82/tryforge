import { Server } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

let server: Server;

/**
 * Start the server
 */
export const startServer = async (): Promise<Server> => {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    server = app.listen(env.server.port, () => {
      logger.info(`Server running on port ${env.server.port} in ${env.node.env} mode`);
      logger.info(`API available at http://localhost:${env.server.port}${env.server.apiPrefix}`);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error });
    throw error;
  }
};

/**
 * Graceful shutdown
 */
export const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await disconnectDatabase();
        logger.info('Database connections closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
