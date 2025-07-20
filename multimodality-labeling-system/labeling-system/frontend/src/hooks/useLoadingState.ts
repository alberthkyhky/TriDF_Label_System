import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseLoadingStateOptions {
  defaultDelay?: number;
  onLoadingStart?: (key: string) => void;
  onLoadingEnd?: (key: string) => void;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const timeoutsRef = useRef<Record<string, number>>({});
  const { defaultDelay = 0, onLoadingStart, onLoadingEnd } = options;

  const setLoading = useCallback((key: string, isLoading: boolean, delay?: number) => {
    const actualDelay = delay ?? defaultDelay;

    // Clear any existing timeout for this key
    if (timeoutsRef.current[key]) {
      clearTimeout(timeoutsRef.current[key]);
      delete timeoutsRef.current[key];
    }

    if (actualDelay > 0 && isLoading) {
      // Delay the loading state to prevent flickering for fast operations
      timeoutsRef.current[key] = window.setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [key]: true }));
        onLoadingStart?.(key);
        delete timeoutsRef.current[key];
      }, actualDelay);
    } else {
      setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
      
      if (isLoading) {
        onLoadingStart?.(key);
      } else {
        onLoadingEnd?.(key);
      }
    }
  }, [defaultDelay, onLoadingStart, onLoadingEnd]);

  const isLoading = useCallback((key?: string): boolean => {
    if (key) {
      return !!loadingStates[key];
    }
    // Return true if any loading state is active
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFunction: () => Promise<T>,
    delay?: number
  ): Promise<T> => {
    setLoading(key, true, delay);
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      setLoading(key, false, 0);
    }
  }, [setLoading]);

  const reset = useCallback((key?: string) => {
    if (key) {
      // Clear specific timeout and loading state
      if (timeoutsRef.current[key]) {
        clearTimeout(timeoutsRef.current[key]);
        delete timeoutsRef.current[key];
      }
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      // Clear all timeouts and loading states
      Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = {};
      setLoadingStates({});
    }
  }, []);

  const getLoadingStates = useCallback(() => {
    return { ...loadingStates };
  }, [loadingStates]);

  return {
    setLoading,
    isLoading,
    withLoading,
    reset,
    getLoadingStates,
    // Convenience properties for common loading states
    isAnyLoading: isLoading(),
    loadingStates
  };
}

// Common loading state keys (optional constants)
export const LOADING_KEYS = {
  FETCH_TASKS: 'fetchTasks',
  SUBMIT_RESPONSE: 'submitResponse',
  UPLOAD_FILE: 'uploadFile',
  DELETE_ITEM: 'deleteItem',
  SAVE_CHANGES: 'saveChanges',
  LOGIN: 'login',
  LOGOUT: 'logout'
} as const;

export default useLoadingState;