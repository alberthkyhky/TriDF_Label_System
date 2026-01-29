import { useState, useCallback } from 'react';

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  loadingMessage?: string;
}

export function useApiCall<T = any>(options: UseApiCallOptions = {}) {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const call = useCallback(async (apiFunction: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiFunction();
      setState({
        data: response,
        loading: false,
        error: null
      });
      
      options.onSuccess?.(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });
      
      options.onError?.(errorMessage);
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    call,
    reset,
    isIdle: !state.loading && !state.data && !state.error,
    isSuccess: !state.loading && !!state.data && !state.error,
    isError: !state.loading && !!state.error
  };
}

export default useApiCall;