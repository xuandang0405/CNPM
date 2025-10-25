import { useState, useCallback } from 'react';

/**
 * Custom hook for data fetching with error handling and retry
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Object} options - Options { retries: 2, retryDelay: 1000 }
 * @returns {Object} { data, loading, error, refetch, retry }
 */
export function useDataFetch(fetchFn, options = {}) {
  const { retries = 2, retryDelay = 1000 } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithRetry = useCallback(async (attemptsLeft = retries) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFn();
      setData(result);
      setError(null);
      return result;
      
    } catch (err) {
      console.error('Fetch error:', err);
      
      if (attemptsLeft > 0) {
        console.log(`Retrying... (${attemptsLeft} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchWithRetry(attemptsLeft - 1);
      }
      
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối với server');
      setData(null);
      throw err;
      
    } finally {
      setLoading(false);
    }
  }, [fetchFn, retries, retryDelay]);

  const refetch = useCallback(() => {
    return fetchWithRetry(retries);
  }, [fetchWithRetry, retries]);

  const retry = useCallback(() => {
    return refetch();
  }, [refetch]);

  return { data, loading, error, refetch, retry };
}

/**
 * Higher-order function to wrap API calls with retry logic
 * @param {Function} apiFn - API function to wrap
 * @param {Object} options - Options { retries: 2, retryDelay: 1000 }
 * @returns {Function} Wrapped function with retry logic
 */
export function withRetry(apiFn, options = {}) {
  const { retries = 2, retryDelay = 1000 } = options;
  
  return async function(...args) {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await apiFn(...args);
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          console.log(`API call failed, retrying... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError;
  };
}
