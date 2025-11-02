export interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

export interface Post {
  id: number
  title: string
  content: string
  author: User
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
}
