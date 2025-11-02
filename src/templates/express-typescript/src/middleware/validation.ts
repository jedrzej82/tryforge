import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

/**
 * Validation source types
 */
type ValidationSource = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 * @param schema - Joi validation schema
 * @param source - Source of data to validate (body, query, or params)
 */
export const validate = (schema: Joi.ObjectSchema, source: ValidationSource = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return next(ApiError.unprocessableEntity('Validation failed', errors));
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};
