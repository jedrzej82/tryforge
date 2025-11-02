/**
 * API utility functions for making type-safe requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || statusText)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T> {
  data: T
  error?: string
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.statusText,
      await response.text()
    )
  }

  return response.json()
}

/**
 * GET request
 */
export async function get<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'GET',
  })
}

/**
 * POST request
 */
export async function post<T, D = unknown>(
  endpoint: string,
  data?: D,
  options?: RequestInit
): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request
 */
export async function put<T, D = unknown>(
  endpoint: string,
  data?: D,
  options?: RequestInit
): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'DELETE',
  })
}

/**
 * PATCH request
 */
export async function patch<T, D = unknown>(
  endpoint: string,
  data?: D,
  options?: RequestInit
): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}
