/**
 * Global type definitions for the application
 */

// User types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Blog post types
export interface BlogPost {
  id: string
  slug: string
  title: string
  description: string
  content: string
  author: User
  publishedAt: string
  updatedAt: string
  tags?: string[]
}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code?: string
  status: number
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  revenue: number
  growth: number
}

// Environment variables (type-safe)
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      NEXT_PUBLIC_APP_URL: string
      NEXT_PUBLIC_API_URL?: string
      DATABASE_URL?: string
      // Add more environment variables as needed
    }
  }
}

export {}
