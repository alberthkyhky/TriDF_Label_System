import { useState, useCallback, useRef, useEffect } from 'react';

interface MediaCacheItem {
  url: string;
  blob: Blob;
  timestamp: Date;
  taskId: string;
}

interface UseMediaAuthenticationOptions {
  cacheTimeout?: number; // Cache timeout in milliseconds
  maxCacheSize?: number; // Maximum number of cached items
  retryAttempts?: number;
  retryDelay?: number;
}

export function useMediaAuthentication(options: UseMediaAuthenticationOptions = {}) {
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [errorUrls, setErrorUrls] = useState<Set<string>>(new Set());
  const cacheRef = useRef<Map<string, MediaCacheItem>>(new Map());
  
  const {
    cacheTimeout = 5 * 60 * 1000, // 5 minutes default
    maxCacheSize = 50,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  // Clean up expired cache items
  const cleanCache = useCallback(() => {
    const now = new Date();
    const cache = cacheRef.current;
    
    Array.from(cache.entries()).forEach(([key, item]) => {
      if (now.getTime() - item.timestamp.getTime() > cacheTimeout) {
        // Revoke object URL to free memory
        URL.revokeObjectURL(item.url);
        cache.delete(key);
      }
    });
    
    // If cache is still too large, remove oldest items
    if (cache.size > maxCacheSize) {
      const sortedItems = Array.from(cache.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const itemsToRemove = sortedItems.slice(0, cache.size - maxCacheSize);
      itemsToRemove.forEach(([key, item]) => {
        URL.revokeObjectURL(item.url);
        cache.delete(key);
      });
    }
  }, [cacheTimeout, maxCacheSize]);

  // Clean cache periodically
  useEffect(() => {
    const interval = setInterval(cleanCache, 60000); // Clean every minute
    return () => clearInterval(interval);
  }, [cleanCache]);

  const fetchAuthenticatedMedia = useCallback(async (
    filePath: string,
    taskId: string,
    attempt = 1
  ): Promise<string> => {
    const cacheKey = `${taskId}-${filePath}`;
    const cache = cacheRef.current;
    
    // Check cache first
    const cachedItem = cache.get(cacheKey);
    if (cachedItem) {
      const isExpired = new Date().getTime() - cachedItem.timestamp.getTime() > cacheTimeout;
      if (!isExpired) {
        return cachedItem.url;
      } else {
        // Remove expired item
        URL.revokeObjectURL(cachedItem.url);
        cache.delete(cacheKey);
      }
    }

    setLoadingUrls(prev => new Set(prev).add(cacheKey));
    setErrorUrls(prev => {
      const newSet = new Set(prev);
      newSet.delete(cacheKey);
      return newSet;
    });

    try {
      // Get auth token
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/v1/media/${taskId}/serve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_path: filePath })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied to this media file.');
        }
        if (response.status === 404) {
          throw new Error('Media file not found.');
        }
        throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Cache the result
      cleanCache(); // Clean before adding new item
      cache.set(cacheKey, {
        url: objectUrl,
        blob,
        timestamp: new Date(),
        taskId
      });

      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });

      return objectUrl;

    } catch (error) {
      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });

      // Retry logic
      if (attempt < retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        return fetchAuthenticatedMedia(filePath, taskId, attempt + 1);
      }

      setErrorUrls(prev => new Set(prev).add(cacheKey));
      throw error;
    }
  }, [cacheTimeout, cleanCache, retryAttempts, retryDelay]);

  const preloadMedia = useCallback(async (
    filePaths: string[],
    taskId: string
  ): Promise<void> => {
    const promises = filePaths.map(filePath => 
      fetchAuthenticatedMedia(filePath, taskId).catch(console.error)
    );
    await Promise.allSettled(promises);
  }, [fetchAuthenticatedMedia]);

  const clearCache = useCallback((taskId?: string) => {
    const cache = cacheRef.current;
    
    if (taskId) {
      // Clear cache for specific task
      Array.from(cache.entries()).forEach(([key, item]) => {
        if (item.taskId === taskId) {
          URL.revokeObjectURL(item.url);
          cache.delete(key);
        }
      });
    } else {
      // Clear all cache
      Array.from(cache.entries()).forEach(([, item]) => {
        URL.revokeObjectURL(item.url);
      });
      cache.clear();
    }
    
    setLoadingUrls(new Set());
    setErrorUrls(new Set());
  }, []);

  const isLoading = useCallback((filePath: string, taskId: string): boolean => {
    const cacheKey = `${taskId}-${filePath}`;
    return loadingUrls.has(cacheKey);
  }, [loadingUrls]);

  const hasError = useCallback((filePath: string, taskId: string): boolean => {
    const cacheKey = `${taskId}-${filePath}`;
    return errorUrls.has(cacheKey);
  }, [errorUrls]);

  const getCachedUrl = useCallback((filePath: string, taskId: string): string | null => {
    const cacheKey = `${taskId}-${filePath}`;
    const cachedItem = cacheRef.current.get(cacheKey);
    
    if (!cachedItem) return null;
    
    const isExpired = new Date().getTime() - cachedItem.timestamp.getTime() > cacheTimeout;
    if (isExpired) {
      URL.revokeObjectURL(cachedItem.url);
      cacheRef.current.delete(cacheKey);
      return null;
    }
    
    return cachedItem.url;
  }, [cacheTimeout]);

  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      maxSize: maxCacheSize,
      loadingCount: loadingUrls.size,
      errorCount: errorUrls.size
    };
  }, [maxCacheSize, loadingUrls.size, errorUrls.size]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const cache = cacheRef.current;
      Array.from(cache.entries()).forEach(([, item]) => {
        URL.revokeObjectURL(item.url);
      });
      cache.clear();
    };
  }, []);

  return {
    fetchAuthenticatedMedia,
    preloadMedia,
    clearCache,
    isLoading,
    hasError,
    getCachedUrl,
    getCacheStats
  };
}

export default useMediaAuthentication;