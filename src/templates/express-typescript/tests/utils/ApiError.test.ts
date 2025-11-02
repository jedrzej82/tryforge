import { describe, it, expect } from '@jest/globals';
import { ApiError } from '../../src/utils/ApiError';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an error with correct properties', () => {
      const error = new ApiError(400, 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error');
      expect(error.isOperational).toBe(true);
    });

    it('should include validation errors', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const error = new ApiError(400, 'Validation failed', true, errors);

      expect(error.errors).toEqual(errors);
    });
  });

  describe('static methods', () => {
    it('should create bad request error', () => {
      const error = ApiError.badRequest('Bad request');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
    });

    it('should create unauthorized error', () => {
      const error = ApiError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should create forbidden error', () => {
      const error = ApiError.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should create not found error', () => {
      const error = ApiError.notFound();

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should create conflict error', () => {
      const error = ApiError.conflict('Already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Already exists');
    });

    it('should create internal server error', () => {
      const error = ApiError.internal();

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
      expect(error.isOperational).toBe(false);
    });
  });
});
