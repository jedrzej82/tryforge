import { JwtPayload } from 'jsonwebtoken';

/**
 * Extend Express Request interface with custom properties
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      requestId?: string;
    }
  }
}

/**
 * Custom JWT Payload interface
 */
export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export {};
