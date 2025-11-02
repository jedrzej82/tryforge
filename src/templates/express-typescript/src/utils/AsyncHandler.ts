import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrapper for async route handlers to catch errors and pass them to error middleware
 * @param fn - Async request handler function
 * @returns Wrapped request handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
