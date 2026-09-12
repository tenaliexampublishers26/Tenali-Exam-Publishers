/**
 * Lightweight In-Memory Cache — Client-Side
 * ──────────────────────────────────────────
 * Features:
 *  1. LRU eviction (max 100 entries) — prevents unbounded memory growth
 *  2. In-flight request deduplication — prevents cache stampede
 *  3. Stale-while-revalidate pattern — serves stale data instantly while
 *     background-refreshing; users never see a loading state on revisit
 *  4. Subscriber/listener system — components are notified when background
 *     revalidation completes, enabling automatic UI re-renders without polling
 */

const MAX_ENTRIES = 100;

const cache = new Map<string, { data: any; timestamp: number }>();

// Tracks in-flight requests to deduplicate concurrent fetches for the same URL
const inFlight = new Map<string, Promise<any>>();

// Subscriber registry: url → Set of callbacks
const subscribers = new Map<string, Set<(data: any) => void>>();

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
    // Schedule microtask to avoid calling setState inside fetch .then()
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
  const cached = cache.get(url);
  const now = Date.now();

  // ── Stale-while-revalidate ────────────────────────────────────────────────
  // If data exists (even stale), return it immediately.
  // If stale, kick off a background refresh without making the caller wait.
  if (cached && !forceRefresh) {
    if (now - cached.timestamp < ttl) {
      // Fresh — return immediately with no fetch
      return cached.data as T;
    }

    // Stale — serve immediately, refresh in background
    if (!inFlight.has(url)) {
      const refreshPromise = fetch(url)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
        .then((data) => {
          evictIfNeeded();
          cache.set(url, { data, timestamp: Date.now() });
          notifySubscribers(url, data);
          return data;
        })
        .catch(() => cached.data) // On error, keep serving stale
        .finally(() => inFlight.delete(url));

      inFlight.set(url, refreshPromise);
    }

    return cached.data as T;
  }

  // ── In-flight deduplication ───────────────────────────────────────────────
  // If another component already started the same fetch, wait for it instead
  // of issuing a duplicate network request.
  if (inFlight.has(url)) {
    return inFlight.get(url) as Promise<T>;
  }

  // ── Fresh fetch ───────────────────────────────────────────────────────────
  const fetchPromise = fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        // On error, serve stale if available
        if (cached) return cached.data as T;
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      }
      const data = await res.json();
      evictIfNeeded();
      cache.set(url, { data, timestamp: Date.now() });
      notifySubscribers(url, data);
      return data as T;
    })
    .finally(() => inFlight.delete(url));

  inFlight.set(url, fetchPromise);
  return fetchPromise;
}

export function getCachedData<T = any>(url: string): T | null {
  const cached = cache.get(url);
  return cached ? (cached.data as T) : null;
}

export function getCacheTimestamp(url: string): number | null {
  const cached = cache.get(url);
  return cached ? cached.timestamp : null;
}

export function invalidateCache(urlPrefix?: string) {
  if (!urlPrefix) {
    cache.clear();
    inFlight.clear();
    return;
  }
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  }
}
