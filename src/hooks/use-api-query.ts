import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiResult, DataSource } from '@/services/api';

/** Data older than this is shown with a "stale" note. */
export const STALE_AFTER_MS = 5 * 60 * 1000;

/** 'offline': a refresh failed but earlier data is still shown (with its time). */
export type QueryState = 'loading' | 'ready' | 'empty' | 'error' | 'stale' | 'offline';

interface QueryResult<T> {
  data: T | null;
  source: DataSource | null;
  receivedAt: string | null;
  state: QueryState;
  error: string | null;
  refreshing: boolean;
  /** Re-fetch, keeping current data visible (pull-to-refresh). */
  refresh: () => Promise<void>;
  /** Replace local data, e.g. with the record returned by a mutation. */
  setData: (data: T) => void;
}

/**
 * Loads data from the api layer and derives a UI state.
 * `isEmpty` decides when a successful result should render the empty state.
 */
export function useApiQuery<T>(
  fetcher: () => Promise<ApiResult<T>>,
  deps: React.DependencyList,
  isEmpty: (data: T) => boolean = (data) => Array.isArray(data) && data.length === 0
): QueryResult<T> {
  const [result, setResult] = useState<ApiResult<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // receivedAt value of the result that has gone stale (set by a timer).
  const [staleFor, setStaleFor] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const receivedAt = result?.receivedAt ?? null;
  useEffect(() => {
    if (!receivedAt) return;
    const remaining = new Date(receivedAt).getTime() + STALE_AFTER_MS - Date.now();
    const timer = setTimeout(() => setStaleFor(receivedAt), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [receivedAt]);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      setResult(await fetcherRef.current());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => load(true), [load]);
  const setData = useCallback(
    (data: T) => setResult((prev) => (prev ? { ...prev, data } : prev)),
    []
  );

  let state: QueryState;
  if (loading && !result) state = 'loading';
  else if (error && !result) state = 'error';
  else if (error && result) state = 'offline';
  else if (!result || isEmpty(result.data)) state = 'empty';
  else if (staleFor === result.receivedAt) state = 'stale';
  else state = 'ready';

  return {
    data: result?.data ?? null,
    source: result?.source ?? null,
    receivedAt,
    state,
    error,
    refreshing,
    refresh,
    setData,
  };
}

/**
 * Same states for screens that load by hand: keeps showing earlier data when
 * a refresh fails ('offline') instead of replacing it with an error.
 */
export function deriveQueryState(opts: {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  isEmpty: boolean;
}): QueryState {
  if (opts.loading && !opts.hasData) return 'loading';
  if (opts.error && !opts.hasData) return 'error';
  if (opts.error) return 'offline';
  if (opts.isEmpty) return 'empty';
  return 'ready';
}
