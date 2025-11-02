import { Router } from 'express';
import usersController from '../controllers/users.controller';
import { validate, commonSchemas } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { updateUserSchema, changePasswordSchema } from '../validators/user.validator';
import Joi from 'joi';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (paginated)
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authorize('ADMIN'),
  validate(commonSchemas.pagination, 'query'),
  usersController.getUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(Joi.object({ id: commonSchemas.id }), 'params'),
  usersController.getUserById
);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Own profile or Admin)
 */
router.patch(
  '/:id',
  validate(Joi.object({ id: commonSchemas.id }), 'params'),
  validate(updateUserSchema),
  usersController.updateUser
);

/**
 * @route   PATCH /api/v1/users/:id/password
 * @desc    Change user password
 * @access  Private (Own profile only)
 */
router.patch(
  '/:id/password',
  validate(Joi.object({ id: commonSchemas.id }), 'params'),
  validate(changePasswordSchema),
  usersController.changePassword
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate(Joi.object({ id: commonSchemas.id }), 'params'),
  usersController.deleteUser
);

export default router;
