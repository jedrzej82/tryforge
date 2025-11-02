import { User } from '@prisma/client';

/**
 * User model utilities and types
 */

/**
 * User without sensitive fields (for API responses)
 */
export type SafeUser = Omit<User, 'password'>;

/**
 * Transform user to safe user (exclude password)
 */
export const toSafeUser = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * Transform array of users to safe users
 */
export const toSafeUsers = (users: User[]): SafeUser[] => {
  return users.map(toSafeUser);
};
