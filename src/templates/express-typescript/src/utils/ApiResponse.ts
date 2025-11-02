import { Response } from 'express';
import { ApiSuccessResponse, PaginationMeta } from '../types';

/**
 * Standardized API response utility class
 */
export class ApiResponse {
  /**
   * Send a success response
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: PaginationMeta
  ): Response {
    const response: ApiSuccessResponse<T> = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a created (201) response
   */
  static created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send a no content (204) response
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send a paginated response
   */
  static paginated<T>(
    res: Response,
    data: T,
    meta: PaginationMeta,
    message = 'Success'
  ): Response {
    return ApiResponse.success(res, data, message, 200, meta);
  }
}
