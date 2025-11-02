import { Request, Response } from 'express';
import usersService from '../services/users.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { PaginationParams } from '../types';

/**
 * Users Controller
 * Handles HTTP requests for user management endpoints
 */
export class UsersController {
  /**
   * Get all users with pagination
   * GET /users
   */
  getUsers = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const params: PaginationParams = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const { users, meta } = await usersService.getUsers(params);

    return ApiResponse.paginated(res, { users }, meta, 'Users retrieved successfully');
  });

  /**
   * Get user by ID
   * GET /users/:id
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    const user = await usersService.getUserById(id);

    return ApiResponse.success(res, { user }, 'User retrieved successfully');
  });

  /**
   * Update user
   * PATCH /users/:id
   */
  updateUser = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updateData = req.body as { name?: string; email?: string };

    const user = await usersService.updateUser(id, updateData);

    return ApiResponse.success(res, { user }, 'User updated successfully');
  });

  /**
   * Change user password
   * PATCH /users/:id/password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    await usersService.changePassword(id, currentPassword, newPassword);

    return ApiResponse.success(res, null, 'Password changed successfully');
  });

  /**
   * Delete user
   * DELETE /users/:id
   */
  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    await usersService.deleteUser(id);

    return ApiResponse.noContent(res);
  });
}

export default new UsersController();
