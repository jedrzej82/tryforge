import { ref, type Ref } from 'vue'
import type { AsyncState } from '@/types'

export interface UseAsyncReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

/**
 * Composable for handling async operations with loading and error states
 */
export function useAsync<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async (...args: any[]): Promise<T | null> => {
    loading.value = true
    error.value = null

    try {
      const result = await asyncFn(...args)
      data.value = result
      return result
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      return null
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
  }

  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}
