/**
 * Lightweight In-Memory Cache — Client-Side
 * ──────────────────────────────────────────
 * Improvements over original:
 *  1. LRU eviction (max 100 entries) — prevents unbounded memory growth
 *  2. In-flight request deduplication — prevents cache stampede when multiple
 *     components simultaneously request the same URL (common at 30K users)
 *  3. Stale-while-revalidate pattern — serves stale data instantly while
 *     background-refreshing; users never see a loading state on revisit
 */

const MAX_ENTRIES = 100;

const cache = new Map<string, { data: any; timestamp: number }>();

// Tracks in-flight requests to deduplicate concurrent fetches for the same URL
const inFlight = new Map<string, Promise<any>>();

/** Evict the oldest entry if at capacity (LRU via Map insertion order) */
function evictIfNeeded() {
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
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
        .then(res => (res.ok ? res.json() : Promise.reject(res.statusText)))
        .then(data => {
          evictIfNeeded();
          cache.set(url, { data, timestamp: Date.now() });
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
    .then(async res => {
      if (!res.ok) {
        // On error, serve stale if available
        if (cached) return cached.data as T;
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      }
      const data = await res.json();
      evictIfNeeded();
      cache.set(url, { data, timestamp: Date.now() });
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
