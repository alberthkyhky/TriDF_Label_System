import { useState, useCallback, useMemo } from 'react';

interface PaginationConfig {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
  maxVisiblePages?: number;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  visiblePages: number[];
}

export function usePagination(config: PaginationConfig = {}) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    totalItems: initialTotalItems = 0,
    maxVisiblePages = 5
  } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1;
  }, [totalItems, pageSize]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize - 1, totalItems - 1);
  }, [startIndex, pageSize, totalItems]);

  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const changePageSize = useCallback((newPageSize: number) => {
    const newTotalPages = Math.ceil(totalItems / newPageSize) || 1;
    const newCurrentPage = Math.min(currentPage, newTotalPages);
    
    setPageSize(newPageSize);
    setCurrentPage(newCurrentPage);
  }, [currentPage, totalItems]);

  const updateTotalItems = useCallback((newTotal: number) => {
    setTotalItems(newTotal);
    
    // Adjust current page if it's now out of bounds
    const newTotalPages = Math.ceil(newTotal / pageSize) || 1;
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [currentPage, pageSize]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
    setTotalItems(initialTotalItems);
  }, [initialPage, initialPageSize, initialTotalItems]);

  const getSlicedData = useCallback(<T>(data: T[]): T[] => {
    return data.slice(startIndex, startIndex + pageSize);
  }, [startIndex, pageSize]);

  const getPageInfo = useCallback(() => {
    return {
      showing: totalItems === 0 ? 0 : startIndex + 1,
      to: totalItems === 0 ? 0 : endIndex + 1,
      of: totalItems,
      page: currentPage,
      pages: totalPages
    };
  }, [startIndex, endIndex, totalItems, currentPage, totalPages]);

  const state: PaginationState = {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    visiblePages
  };

  return {
    ...state,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    changePageSize,
    updateTotalItems,
    reset,
    getSlicedData,
    getPageInfo
  };
}

// Common page size options
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// Utility function to generate pagination info text
export const getPaginationText = (
  showing: number,
  to: number,
  of: number
): string => {
  if (of === 0) return 'No items to show';
  if (showing === to) return `Showing ${showing} of ${of}`;
  return `Showing ${showing}-${to} of ${of}`;
};

export default usePagination;