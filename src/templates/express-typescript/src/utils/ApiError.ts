/**
 * Custom API Error class for handling errors consistently across the application
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: Array<{ field: string; message: string }>,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly for extending built-in classes
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Create a Bad Request (400) error
   */
  static badRequest(message: string, errors?: Array<{ field: string; message: string }>): ApiError {
    return new ApiError(400, message, true, errors);
  }

  /**
   * Create an Unauthorized (401) error
   */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Create a Forbidden (403) error
   */
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Create a Not Found (404) error
   */
  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Create a Conflict (409) error
   */
  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  /**
   * Create an Unprocessable Entity (422) error
   */
  static unprocessableEntity(
    message: string,
    errors?: Array<{ field: string; message: string }>
  ): ApiError {
    return new ApiError(422, message, true, errors);
  }

  /**
   * Create an Internal Server Error (500)
   */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, false);
  }

  /**
   * Create a Service Unavailable (503) error
   */
  static serviceUnavailable(message = 'Service temporarily unavailable'): ApiError {
    return new ApiError(503, message);
  }
}
