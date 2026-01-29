import { useState, useCallback, useRef } from 'react';

interface ErrorState {
  message: string;
  code?: string | number;
  timestamp: Date;
  context?: string;
}

interface UseErrorHandlerOptions {
  defaultContext?: string;
  onError?: (error: ErrorState) => void;
  autoReset?: number; // Auto-reset error after X milliseconds
  maxErrors?: number; // Maximum number of errors to keep in history
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [error, setError] = useState<ErrorState | null>(null);
  const [errorHistory, setErrorHistory] = useState<ErrorState[]>([]);
  const timeoutRef = useRef<number | undefined>(undefined);
  
  const { 
    defaultContext = 'general',
    onError,
    autoReset = 0,
    maxErrors = 10
  } = options;

  const handleError = useCallback((
    error: Error | string | any,
    context?: string,
    code?: string | number
  ) => {
    let errorMessage: string;
    let errorCode: string | number | undefined = code;

    // Parse different error types
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.response?.data?.message) {
      // Handle API errors (e.g., Axios responses)
      errorMessage = error.response.data.message;
      errorCode = error.response.status;
    } else if (error?.message) {
      errorMessage = error.message;
      errorCode = error.code || error.status;
    } else {
      errorMessage = 'An unexpected error occurred';
    }

    const errorState: ErrorState = {
      message: errorMessage,
      code: errorCode,
      timestamp: new Date(),
      context: context || defaultContext
    };

    setError(errorState);
    
    // Add to history
    setErrorHistory(prev => {
      const newHistory = [errorState, ...prev];
      return newHistory.slice(0, maxErrors);
    });

    // Call custom error handler
    onError?.(errorState);

    // Auto-reset if configured
    if (autoReset > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setError(null);
      }, autoReset);
    }

    // Log error for debugging
    console.error(`[${context || defaultContext}] Error:`, error);
  }, [defaultContext, onError, autoReset, maxErrors]);

  const clearError = useCallback(() => {
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setErrorHistory([]);
  }, []);

  const retry = useCallback(async (
    retryFunction: () => Promise<any>,
    context?: string
  ) => {
    try {
      clearError();
      const result = await retryFunction();
      return result;
    } catch (error) {
      handleError(error, context || 'retry');
      throw error;
    }
  }, [clearError, handleError]);

  const withErrorHandling = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    context?: string,
    code?: string | number
  ): Promise<T | null> => {
    try {
      const result = await asyncFunction();
      return result;
    } catch (error) {
      handleError(error, context, code);
      return null;
    }
  }, [handleError]);

  const getErrorMessage = useCallback((fallback?: string) => {
    return error?.message || fallback || 'No error';
  }, [error]);

  const hasError = useCallback((context?: string) => {
    if (!error) return false;
    if (!context) return true;
    return error.context === context;
  }, [error]);

  const getLastError = useCallback((context?: string) => {
    if (!context) return errorHistory[0] || null;
    return errorHistory.find(err => err.context === context) || null;
  }, [errorHistory]);

  return {
    error,
    errorHistory,
    handleError,
    clearError,
    clearHistory,
    retry,
    withErrorHandling,
    getErrorMessage,
    hasError,
    getLastError,
    // Convenience properties
    hasAnyError: !!error,
    errorMessage: error?.message || null,
    errorCode: error?.code || null
  };
}

// Common error types and messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
} as const;

export const getErrorMessageByCode = (code: number): string => {
  switch (code) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 408:
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
};

export default useErrorHandler;