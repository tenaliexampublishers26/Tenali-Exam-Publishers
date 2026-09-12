/**
 * Lightweight In-Memory & Session-Backed Cache — Client-Side
 * ──────────────────────────────────────────────────────────
 * Features:
 *  1. LRU eviction (max 100 entries) — prevents unbounded memory growth
 *  2. In-flight request deduplication — prevents cache stampede
 *  3. Stale-while-revalidate pattern — serves stale data instantly while
 *     background-refreshing; users never see a loading state on revisit
 *  4. Subscriber/listener system — components are notified when background
 *     revalidation completes, enabling automatic UI re-renders without polling
 *  5. SessionStorage fallback — instantly pre-seeds cache on page navigation/re-open
 *  6. 8-second fetch timeout — prevents hanging requests from stalling the UI
 */

const MAX_ENTRIES = 100;
const FETCH_TIMEOUT_MS = 8000;

const cache = new Map<string, { data: any; timestamp: number }>();

// Tracks in-flight requests to deduplicate concurrent fetches for the same URL
const inFlight = new Map<string, Promise<any>>();

// Subscriber registry: url → Set of callbacks
const subscribers = new Map<string, Set<(data: any) => void>>();

/** Helper to read from sessionStorage */
function getStorage(key: string): { data: any; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`tep_cache_${key}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage errors
  }
  return null;
}

/** Helper to write to sessionStorage */
function setStorage(key: string, value: { data: any; timestamp: number }) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`tep_cache_${key}`, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

/** Evict the oldest entry if at capacity (LRU via Map insertion order) */
function evictIfNeeded() {
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

/** Notify all listeners registered for a given URL */
function notifySubscribers(url: string, data: any) {
  const subs = subscribers.get(url);
  if (subs && subs.size > 0) {
    queueMicrotask(() => {
      subs.forEach((cb) => {
        try {
          cb(data);
        } catch {
          // Subscriber may have been GC'd or unmounted — ignore
        }
      });
    });
  }
}

/**
 * Fetch with an explicit timeout to prevent 3-5 minute network hangs.
 */
async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Subscribe to cache updates for a given URL.
 * The callback is invoked whenever the cache entry for `url` is written
 * (including background stale-while-revalidate refreshes).
 * Returns an unsubscribe function.
 */
export function subscribeToCacheUpdate(
  url: string,
  callback: (data: any) => void
): () => void {
  if (!subscribers.has(url)) {
    subscribers.set(url, new Set());
  }
  subscribers.get(url)!.add(callback);

  return () => {
    const subs = subscribers.get(url);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        subscribers.delete(url);
      }
    }
  };
}

export async function fetchWithCache<T = any>(
  url: string,
  options?: { ttl?: number; forceRefresh?: boolean }
): Promise<T> {
  const { ttl = 30000, forceRefresh = false } = options || {};
  
  // Try memory cache first, then session storage
  let cached = cache.get(url);
  if (!cached) {
    const stored = getStorage(url);
    if (stored) {
      cache.set(url, stored);
      cached = stored;
    }
  }

  const now = Date.now();

  // ── Stale-while-revalidate ────────────────────────────────────────────────
  // If data exists (even stale), return it immediately.
  // If stale, kick off a background refresh without making the caller wait.
  if (cached && !forceRefresh) {
    if (now - cached.timestamp < ttl) {
      // Fresh — return immediately with no fetch
      return cached.data as T;
    }

    // Stale — serve immediately, refresh in background with timeout
    if (!inFlight.has(url)) {
      const refreshPromise = fetchWithTimeout(url)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
        .then((data) => {
          evictIfNeeded();
          const entry = { data, timestamp: Date.now() };
          cache.set(url, entry);
          setStorage(url, entry);
          notifySubscribers(url, data);
          return data;
        })
        .catch(() => cached?.data) // On error/timeout, keep serving stale
        .finally(() => inFlight.delete(url));

      inFlight.set(url, refreshPromise);
    }

    return cached.data as T;
  }

  // ── In-flight deduplication ───────────────────────────────────────────────
  if (inFlight.has(url)) {
    return inFlight.get(url) as Promise<T>;
  }

  // ── Fresh fetch (with strict 8s timeout) ──────────────────────────────────
  const fetchPromise = fetchWithTimeout(url)
    .then(async (res) => {
      if (!res.ok) {
        if (cached) return cached.data as T;
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      }
      const data = await res.json();
      evictIfNeeded();
      const entry = { data, timestamp: Date.now() };
      cache.set(url, entry);
      setStorage(url, entry);
      notifySubscribers(url, data);
      return data as T;
    })
    .catch((err) => {
      if (cached) return cached.data as T;
      throw err;
    })
    .finally(() => inFlight.delete(url));

  inFlight.set(url, fetchPromise);
  return fetchPromise;
}

export function getCachedData<T = any>(url: string): T | null {
  const cached = cache.get(url);
  if (cached) return cached.data as T;
  const stored = getStorage(url);
  if (stored) {
    cache.set(url, stored);
    return stored.data as T;
  }
  return null;
}

export function getCacheTimestamp(url: string): number | null {
  const cached = cache.get(url);
  if (cached) return cached.timestamp;
  const stored = getStorage(url);
  if (stored) {
    cache.set(url, stored);
    return stored.timestamp;
  }
  return null;
}

export function invalidateCache(urlPrefix?: string) {
  if (!urlPrefix) {
    cache.clear();
    inFlight.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith('tep_cache_')) sessionStorage.removeItem(k);
        });
      } catch {}
    }
    return;
  }
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
      if (typeof window !== 'undefined') {
        try { sessionStorage.removeItem(`tep_cache_${key}`); } catch {}
      }
    }
  }
}

