import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next, options) => {
    throw ApiError.serviceUnavailable(options.message as string);
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, _res, _next, options) => {
    throw ApiError.serviceUnavailable(options.message as string);
  },
});

/**
 * Rate limiter for password reset endpoints
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next, options) => {
    throw ApiError.serviceUnavailable(options.message as string);
  },
});
