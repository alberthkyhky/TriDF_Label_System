/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that debounces a value
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced callbacks
 * @param callback - The callback function to debounce
 * @param delay - The debounce delay in milliseconds
 * @param deps - Dependencies array for the callback
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps ? [callback, ...deps] : [callback]);

  const debouncedCallback = useRef(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T
  ).current;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom hook for debounced search functionality
 * @param searchQuery - The current search query
 * @param onSearch - Callback function to execute when search is triggered
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns Object with debounced query and search state
 */
export function useDebouncedSearch(
  searchQuery: string,
  onSearch: (query: string) => void,
  delay: number = 300
) {
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, delay);
  const previousQuery = useRef<string>('');

  useEffect(() => {
    if (debouncedQuery !== previousQuery.current) {
      setIsSearching(true);
      onSearch(debouncedQuery);
      previousQuery.current = debouncedQuery;
      
      // Reset searching state after a short delay
      const resetTimer = setTimeout(() => {
        setIsSearching(false);
      }, 100);

      return () => clearTimeout(resetTimer);
    }
  }, [debouncedQuery, onSearch]);

  return {
    debouncedQuery,
    isSearching
  };
}

export default useDebounce;