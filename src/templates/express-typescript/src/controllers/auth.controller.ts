import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { LoginCredentials, RegisterCredentials } from '../types';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const credentials: RegisterCredentials = req.body;

    const { user } = await authService.register(credentials);

    return ApiResponse.created(res, { user }, 'User registered successfully');
  });

  /**
   * Login user
   * POST /auth/login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const credentials: LoginCredentials = req.body;

    const { user, tokens } = await authService.login(credentials);

    return ApiResponse.success(
      res,
      { user, tokens },
      'Login successful'
    );
  });

  /**
   * Refresh access token
   * POST /auth/refresh-token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { refreshToken } = req.body as { refreshToken: string };

    const tokens = await authService.refreshToken(refreshToken);

    return ApiResponse.success(res, { tokens }, 'Token refreshed successfully');
  });

  /**
   * Get current user profile
   * GET /auth/me
   */
  getMe = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const user = req.user;

    return ApiResponse.success(res, { user }, 'User profile retrieved successfully');
  });

  /**
   * Logout user
   * POST /auth/logout
   */
  logout = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
    // In a production app, you might want to blacklist the token here
    // or remove it from a session store

    return ApiResponse.success(res, null, 'Logout successful');
  });
}

export default new AuthController();
