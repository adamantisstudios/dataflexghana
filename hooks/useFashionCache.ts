import { useEffect, useRef, useState } from 'react';

interface CachedData {
  products: any[];
  categories: any[];
  timestamp: number;
}

const CACHE_KEY = 'fashion_avenue_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function useFashionCache() {
  const cacheRef = useRef<CachedData | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Initialize cache from sessionStorage on mount
  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const now = Date.now();
        // Check if cache is still valid (within 30 minutes)
        if (now - data.timestamp < CACHE_DURATION) {
          cacheRef.current = data;
          setIsCached(true);
        } else {
          // Cache expired, remove it
          sessionStorage.removeItem(CACHE_KEY);
          setIsCached(false);
        }
      } catch (error) {
        console.error('[v0] Error parsing cache:', error);
        sessionStorage.removeItem(CACHE_KEY);
        setIsCached(false);
      }
    }
  }, []);

  const getCache = (): CachedData | null => {
    return cacheRef.current;
  };

  const setCache = (products: any[], categories: any[]) => {
    const data: CachedData = {
      products,
      categories,
      timestamp: Date.now(),
    };
    cacheRef.current = data;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  };

  const clearCache = () => {
    cacheRef.current = null;
    sessionStorage.removeItem(CACHE_KEY);
    setIsCached(false);
  };

  return { getCache, setCache, clearCache, isCached };
}
