import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env';
import { morganStream } from './config/logger';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.cors.origin,
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );

  // Compression middleware
  app.use(compression());

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP request logging
  if (env.node.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: morganStream }));
  }

  // Rate limiting
  app.use(apiLimiter);

  // API routes
  app.use(env.server.apiPrefix, routes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Welcome to the API',
      version: '1.0.0',
      docs: `${env.server.apiPrefix}/docs`,
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
