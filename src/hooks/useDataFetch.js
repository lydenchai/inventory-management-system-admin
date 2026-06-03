import { useState, useCallback, useRef } from "react";

export default function useDataFetch(fetchFn, initialFilters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Use refs so fetchData always reads latest values without causing re-renders
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  filtersRef.current = filters;
  paginationRef.current = pagination;

  const fetchData = useCallback(async () => {
    const currentFilters = filtersRef.current;
    const currentPage = paginationRef.current.page;
    const currentLimit = paginationRef.current.limit;

    setLoading(true);
    setError("");
    try {
      const params = {
        page: currentPage,
        limit: currentLimit,
        ...currentFilters,
      };

      // Clean up empty string / null / undefined filters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const res = await fetchFn(params);
      setData(res.data?.data || []);
      if (res.data?.pagination) {
        setPagination((prev) => ({
          ...prev,
          ...res.data.pagination,
          page: currentPage,
          limit: currentLimit,
        }));
      }
      return res;
    } catch (err) {
      const errorMsg =
        err?.response?.data?.error || err.message || "Failed to fetch data";
      setError(errorMsg);
      return { error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const updatePage = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const resetFilters = (overrideFilters) => {
    const next =
      overrideFilters !== undefined
        ? { ...initialFilters, ...overrideFilters }
        : initialFilters;
    setFilters(next);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return {
    data,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setData,
    setLoading,
    setError,
  };
}
