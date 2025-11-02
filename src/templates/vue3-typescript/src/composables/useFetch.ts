import { ref, type Ref } from 'vue'

export interface UseFetchOptions extends RequestInit {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export interface UseFetchReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  statusCode: Ref<number | null>
  execute: (config?: RequestInit) => Promise<T | null>
  refetch: () => Promise<T | null>
  reset: () => void
}

/**
 * Composable for making HTTP requests with fetch API
 */
export function useFetch<T = any>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const { immediate = false, onSuccess, onError, ...fetchOptions } = options

  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const statusCode = ref<number | null>(null)

  const execute = async (config: RequestInit = {}): Promise<T | null> => {
    loading.value = true
    error.value = null
    statusCode.value = null

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        ...config,
      })

      statusCode.value = response.status

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      data.value = result

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err

      if (onError) {
        onError(err)
      }

      return null
    } finally {
      loading.value = false
    }
  }

  const refetch = () => execute()

  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
    statusCode.value = null
  }

  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    statusCode,
    execute,
    refetch,
    reset,
  }
}
