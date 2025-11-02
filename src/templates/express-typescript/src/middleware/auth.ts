import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { TokenPayload } from '../types/express';

/**
 * Extract token from Authorization header
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }

    const decoded = jwt.verify(token, env.jwt.secret) as TokenPayload;

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Token expired'));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized('Invalid token'));
    }

    next(error);
  }
};

/**
 * Authorize based on user roles
 * @param roles - Array of allowed roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(token, env.jwt.secret) as TokenPayload;

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};
