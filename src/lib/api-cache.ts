// Lightweight In-Memory Fast Cache for instant SPA navigation & zero-lag data fetching
const cache = new Map<string, { data: any; timestamp: number }>();

export async function fetchWithCache<T = any>(
  url: string,
  options?: { ttl?: number; forceRefresh?: boolean }
): Promise<T> {
  const { ttl = 30000, forceRefresh = false } = options || {};
  const cached = cache.get(url);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    if (cached) return cached.data as T;
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }

  const data = await res.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

export function getCachedData<T = any>(url: string): T | null {
  const cached = cache.get(url);
  return cached ? (cached.data as T) : null;
}

export function invalidateCache(urlPrefix?: string) {
  if (!urlPrefix) {
    cache.clear();
    return;
  }
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  }
}
