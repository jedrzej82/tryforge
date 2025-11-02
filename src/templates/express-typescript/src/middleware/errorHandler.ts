import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiErrorResponse } from '../types';
import { env } from '../config/env';
import logger from '../config/logger';

/**
 * Convert unknown errors to ApiError
 */
const convertToApiError = (err: Error): ApiError => {
  if (err instanceof ApiError) {
    return err;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; meta?: { target?: string[] } };

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target?.join(', ') || 'field';
      return ApiError.conflict(`${target} already exists`);
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return ApiError.notFound('Record not found');
    }
  }

  // Handle validation errors (Prisma)
  if (err.name === 'PrismaClientValidationError') {
    return ApiError.badRequest('Invalid data provided');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token expired');
  }

  // Default to internal server error
  return ApiError.internal(err.message);
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  const apiError = convertToApiError(err);

  // Log error
  logger.error('Error occurred', {
    statusCode: apiError.statusCode,
    message: apiError.message,
    isOperational: apiError.isOperational,
    errors: apiError.errors,
    stack: apiError.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Prepare error response
  const errorResponse: ApiErrorResponse = {
    success: false,
    message: apiError.message,
    errors: apiError.errors,
  };

  // Include stack trace in development
  if (env.node.isDevelopment) {
    errorResponse.stack = apiError.stack;
  }

  return res.status(apiError.statusCode).json(errorResponse);
};

/**
 * Handle 404 not found errors
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection', { reason: reason.message, stack: reason.stack });
  throw reason;
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});
