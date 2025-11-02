import Joi from 'joi';
import { commonSchemas } from '../middleware/validation';

/**
 * Validation schema for user registration
 */
export const registerSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password.messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
  }),
  name: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
  }),
});

/**
 * Validation schema for user login
 */
export const loginSchema = Joi.object({
  email: commonSchemas.email,
  password: Joi.string().required(),
});

/**
 * Validation schema for updating user profile
 */
export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  email: commonSchemas.email.optional(),
}).min(1); // At least one field must be provided

/**
 * Validation schema for changing password
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: commonSchemas.password.invalid(Joi.ref('currentPassword')).messages({
    'any.invalid': 'New password must be different from current password',
  }),
});

/**
 * Validation schema for refresh token
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
