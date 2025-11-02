import { startServer } from './server';
import logger from './config/logger';

/**
 * Application entry point
 */
startServer()
  .then(() => {
    logger.info('Application started successfully');
  })
  .catch((error) => {
    logger.error('Failed to start application', { error });
    process.exit(1);
  });
