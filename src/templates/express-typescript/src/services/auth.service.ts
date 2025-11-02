import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import prisma from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { toSafeUser } from '../models/user.model';
import { LoginCredentials, RegisterCredentials, AuthTokens, JwtPayloadData } from '../types';

/**
 * Authentication Service
 * Handles user registration, login, and token management
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<{ user: Omit<User, 'password'> }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(credentials.password, env.security.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: credentials.email,
        password: hashedPassword,
        name: credentials.name,
      },
    });

    return { user: toSafeUser(user) };
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: toSafeUser(user),
      tokens,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(payload: JwtPayloadData): AuthTokens {
    const accessToken = jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as JwtPayloadData;

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      // Generate new tokens
      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JwtPayloadData {
    try {
      return jwt.verify(token, env.jwt.secret) as JwtPayloadData;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid token');
      }
      throw error;
    }
  }
}

export default new AuthService();
