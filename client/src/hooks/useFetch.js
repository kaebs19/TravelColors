import { useState, useEffect, useCallback } from 'react';

export const useFetch = (fetchFn, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(...args);
      setData(result.data);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || 'حدث خطأ';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, execute, setData };
};
