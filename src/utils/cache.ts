/**
 * Simple in-memory cache with TTL support
 * Used to cache API responses to reduce network requests
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class Cache<T = any> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Check if a key exists in cache and hasn't expired
   */
  has(key: string): boolean {
    if (!this.store.has(key)) return false;

    const entry = this.store.get(key)!;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache size (number of entries)
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.store.delete(key);
      }
    }
  }
}

// Create singleton cache instances for different data types
export const transformationCache = new Cache(300); // 5 minutes
export const symbolCache = new Cache(300); // 5 minutes
export const indexCache = new Cache(600); // 10 minutes

/**
 * Wrapper for fetching with caching
 */
export const cachedFetch = async <T>(
  key: string,
  cache: Cache<T>,
  fetchFn: () => Promise<T>
): Promise<T> => {
  // Check cache first
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  const result = await fetchFn();
  cache.set(key, result);
  return result;
};

export default Cache;
