/**
 * Server-Side LRU Cache
 * ─────────────────────
 * A lightweight, zero-dependency in-memory cache for server components and
 * API route handlers. Features:
 *  - LRU (Least Recently Used) eviction to bound memory usage
 *  - Per-entry TTL expiry
 *  - Tag-based group invalidation (e.g., invalidate all 'products' entries)
 *  - Stale-while-revalidate: returns stale data while background refresh runs
 *
 * At 30K concurrent users, this prevents thousands of identical DB queries
 * from reaching Supabase during the same revalidation window.
 */

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  tags: string[];
  isStale: boolean;
}

class LRUServerCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize = 500, defaultTTLMs = 60_000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLMs;
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Move to end (mark as recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry as CacheEntry<T>;
  }

  set<T>(key: string, data: T, options: { ttl?: number; tags?: string[] } = {}): void {
    const { ttl = this.defaultTTL, tags = [] } = options;
    const now = Date.now();

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      createdAt: now,
      expiresAt: now + ttl,
      tags,
      isStale: false,
    });
  }

  isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  /**
   * Invalidate all cache entries that contain any of the given tags.
   * Use this when an admin updates a product to immediately clear product caches.
   */
  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton — persists across requests within the same Node.js process
// In serverless, this persists for the lifetime of the warm lambda instance
const globalForCache = globalThis as unknown as {
  __serverCache: LRUServerCache | undefined;
};

export const serverCache = globalForCache.__serverCache ?? new LRUServerCache(500, 60_000);

if (process.env.NODE_ENV !== 'production') {
  globalForCache.__serverCache = serverCache;
}

/**
 * Wrap any async data-fetching function with cache.
 *
 * @example
 * const products = await withServerCache(
 *   'all-products',
 *   () => sql`SELECT * FROM products`,
 *   { ttl: 30_000, tags: ['products'] }
 * );
 */
export async function withServerCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; tags?: string[]; staleWhileRevalidate?: boolean } = {}
): Promise<T> {
  const { staleWhileRevalidate = true } = options;
  const entry = serverCache.get<T>(key);

  if (entry) {
    const expired = Date.now() > entry.expiresAt;

    if (!expired) {
      // Fresh — return immediately
      return entry.data;
    }

    if (staleWhileRevalidate && !entry.isStale) {
      // Mark as stale and kick off background refresh
      entry.isStale = true;
      fetcher()
        .then((freshData) => serverCache.set(key, freshData, options))
        .catch(() => {
          // Background refresh failed — keep serving stale data
          if (entry) entry.isStale = false;
        });
      // Return stale data immediately — zero latency for user
      return entry.data;
    }
  }

  // Cache miss or forced revalidation — fetch and cache
  const data = await fetcher();
  serverCache.set(key, data, options);
  return data;
}

/**
 * Invalidate all product-related caches.
 * Call this after any admin product update/create/delete.
 */
export function invalidateProductCache(): void {
  serverCache.invalidateByTag('products');
}
