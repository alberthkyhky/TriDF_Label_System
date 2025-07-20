// API and Data Management Hooks
export { useApiCall } from './useApiCall';
export { useLoadingState, LOADING_KEYS } from './useLoadingState';
export { useErrorHandler, ERROR_MESSAGES, getErrorMessageByCode } from './useErrorHandler';

// Form and Validation Hooks
export { useFormValidation, validationRules } from './useFormValidation';

// Media and Authentication Hooks
export { useMediaAuthentication } from './useMediaAuthentication';

// UI and Interaction Hooks
export { usePagination, PAGE_SIZE_OPTIONS, getPaginationText } from './usePagination';

// Re-export defaults for convenience
export { default as useApiCallDefault } from './useApiCall';
export { default as useLoadingStateDefault } from './useLoadingState';
export { default as useErrorHandlerDefault } from './useErrorHandler';
export { default as useFormValidationDefault } from './useFormValidation';
export { default as useMediaAuthenticationDefault } from './useMediaAuthentication';
export { default as usePaginationDefault } from './usePagination';

// Common constants and utilities
export const HOOK_DEFAULTS = {
  API_TIMEOUT: 10000,
  CACHE_TIMEOUT: 5 * 60 * 1000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const;

// Hook combination patterns (to be used in components)
export const createCombinedState = () => ({
  // Use this pattern in components to combine multiple hooks
  // Example: const { ...apiState, ...loadingState, ...errorState } = createCombinedState();
});