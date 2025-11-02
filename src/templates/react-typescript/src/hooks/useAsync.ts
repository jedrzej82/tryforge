import { useState, useEffect, useCallback } from 'react';
import type { AsyncState } from '@/types';

/**
 * Custom hook for managing async operations with loading and error states
 * @param asyncFunction - Async function to execute
 * @param immediate - Whether to execute immediately on mount (default: true)
 * @returns AsyncState with execute function
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, loading: true, error: null });

      try {
        const data = await asyncFunction(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        setState({ data: null, loading: false, error: errorObj });
        throw errorObj;
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      void execute(...([] as unknown as Args));
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    reset: () => setState({ data: null, loading: false, error: null }),
  };
}
