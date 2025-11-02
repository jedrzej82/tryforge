/**
 * Common type definitions for the application
 */

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Async state types
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// User types (example)
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

// Navigation types
export interface NavItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
