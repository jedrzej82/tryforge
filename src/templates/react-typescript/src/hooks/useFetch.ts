import { useState, useEffect, useCallback } from 'react';
import type { AsyncState } from '@/types';

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Custom hook for fetching data from an API with TypeScript generics
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @param dependencies - Dependencies array for re-fetching
 * @returns AsyncState with refetch function
 */
export function useFetch<T>(
  url: string,
  options: FetchOptions = {},
  dependencies: unknown[] = []
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as T;
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: errorObj });
    }
  }, [url, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch,
  };
}

/**
 * Custom hook for posting data to an API
 * @returns Function to post data and state
 */
export function usePost<TRequest, TResponse>() {
  const [state, setState] = useState<AsyncState<TResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const post = useCallback(async (url: string, body: TRequest, options: FetchOptions = {}) => {
    setState({ data: null, loading: true, error: null });

    try {
      const response = await fetch(url, {
        method: 'POST',
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as TResponse;
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: errorObj });
      throw errorObj;
    }
  }, []);

  return {
    ...state,
    post,
    reset: () => setState({ data: null, loading: false, error: null }),
  };
}
