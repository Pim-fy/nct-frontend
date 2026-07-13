// src/hooks/useApi.js
import { useState, useCallback } from 'react';

/**
 * API 호출 상태(loading / error / data)를 관리하는 범용 훅
 * @param {Function} apiFunc - axios 기반 API 함수
 */
export const useApi = (apiFunc) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
};
