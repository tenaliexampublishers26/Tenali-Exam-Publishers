'use client';

/**
 * useAutoRefresh — Generic auto-refresh hook for admin data panels
 * ─────────────────────────────────────────────────────────────────
 * Combines:
 *  - fetchWithCache (stale-while-revalidate + in-flight dedup)
 *  - cache subscriber (re-renders when background refresh completes)
 *  - setInterval polling (proactive refresh on a configurable interval)
 *  - Visibility API gate (pauses polling when tab is hidden → saves bandwidth)
 *
 * Usage:
 *   const { data, loading, error, lastRefreshed, countdown, manualRefresh, isRefreshing, enabled, setEnabled } =
 *     useAutoRefresh({ url: '/api/admin/analytics', interval: 30_000 });
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchWithCache,
  getCachedData,
  getCacheTimestamp,
  subscribeToCacheUpdate,
} from '@/lib/api-cache';

interface UseAutoRefreshOptions<T> {
  /** The API URL to poll */
  url: string;
  /** How long before the cache is considered stale (ms). Default: same as interval */
  ttl?: number;
  /** How often to auto-refresh (ms). Default: 30_000 */
  interval?: number;
  /** Normalizer applied to raw JSON before storing in state */
  normalize?: (raw: any) => T;
  /** Called with the normalized data on each refresh */
  onData?: (data: T) => void;
  /** Start with auto-refresh enabled. Default: true */
  defaultEnabled?: boolean;
}

interface UseAutoRefreshResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  isRefreshing: boolean;
  lastRefreshed: number | null; // Unix ms timestamp
  /** Seconds until next auto-refresh (1–interval/1000) */
  countdown: number;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  manualRefresh: () => Promise<void>;
}

export function useAutoRefresh<T = any>({
  url,
  ttl,
  interval = 30_000,
  normalize,
  onData,
  defaultEnabled = true,
}: UseAutoRefreshOptions<T>): UseAutoRefreshResult<T> {
  // Pre-seed from cache to avoid flash of loading state on re-mount
  const cachedRaw = getCachedData(url);
  const cachedTs = getCacheTimestamp(url);
  const seed = cachedRaw ? (normalize ? normalize(cachedRaw) : (cachedRaw as T)) : null;

  const [data, setData] = useState<T | null>(seed);
  const [loading, setLoading] = useState(!cachedRaw);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(cachedTs);
  const [countdown, setCountdown] = useState(Math.round(interval / 1000));
  const [enabled, setEnabled] = useState(defaultEnabled);
  const effectiveTtl = ttl ?? interval;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRefreshAt = useRef<number>(Date.now() + interval);
  const isRefreshingRef = useRef(false);

  // Maximum 4-second loading guard: never stay in full-page skeleton loading forever
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [loading]);

  // ── Core fetch function ────────────────────────────────────────────────────
  const doFetch = useCallback(
    async (force = false) => {
      if (isRefreshingRef.current && !force) return;
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      try {
        const raw = await fetchWithCache<any>(url, { ttl: effectiveTtl, forceRefresh: force });
        const normalized = normalize ? normalize(raw) : (raw as T);
        setData(normalized);
        setLastRefreshed(Date.now());
        setError('');
        onData?.(normalized);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load data');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        isRefreshingRef.current = false;
        // Reset countdown after each refresh
        nextRefreshAt.current = Date.now() + interval;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, effectiveTtl, interval]
  );

  const manualRefresh = useCallback(() => doFetch(true), [doFetch]);

  // ── Cache subscriber — re-render when background SWR completes ────────────
  useEffect(() => {
    const unsub = subscribeToCacheUpdate(url, (raw) => {
      const normalized = normalize ? normalize(raw) : (raw as T);
      setData(normalized);
      setLastRefreshed(Date.now());
      setError('');
      onData?.(normalized);
      nextRefreshAt.current = Date.now() + interval;
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, interval]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    doFetch(false);
  }, [doFetch]);

  // ── Polling interval ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    nextRefreshAt.current = Date.now() + interval;

    intervalRef.current = setInterval(() => {
      // Gate: skip if tab is hidden to save bandwidth
      if (document.visibilityState === 'hidden') return;
      doFetch(true);
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, interval, doFetch]);

  // ── Countdown ticker (updates every second) ───────────────────────────────
  useEffect(() => {
    if (!enabled) {
      setCountdown(Math.round(interval / 1000));
      return;
    }

    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((nextRefreshAt.current - Date.now()) / 1000));
      setCountdown(remaining);
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, interval]);

  // ── Visibility API — resume when tab comes back ───────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        // If overdue by more than half the interval, refresh immediately
        if (Date.now() > nextRefreshAt.current - interval / 2) {
          doFetch(true);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [enabled, interval, doFetch]);

  return {
    data,
    loading,
    error,
    isRefreshing,
    lastRefreshed,
    countdown,
    enabled,
    setEnabled,
    manualRefresh,
  };
}
