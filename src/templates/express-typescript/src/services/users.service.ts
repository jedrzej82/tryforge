import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import prisma from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { toSafeUser, toSafeUsers, SafeUser } from '../models/user.model';
import { PaginationParams, PaginationMeta } from '../types';

/**
 * Users Service
 * Handles user CRUD operations
 */
export class UsersService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return toSafeUser(user);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return toSafeUser(user);
  }

  /**
   * Get all users with pagination
   */
  async getUsers(
    params: PaginationParams
  ): Promise<{ users: SafeUser[]; meta: PaginationMeta }> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      users: toSafeUsers(users),
      meta,
    };
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<Pick<User, 'name' | 'email'>>): Promise<SafeUser> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    // If email is being updated, check if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailTaken) {
        throw ApiError.conflict('Email already in use');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return toSafeUser(updatedUser);
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, env.security.bcryptRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await prisma.user.delete({
      where: { id },
    });
  }
}

export default new UsersService();
