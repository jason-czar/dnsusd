/**
 * In-Memory Cache for Alias Resolution
 * Stores resolved aliases with TTL to reduce external API calls
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 300000; // 5 minutes in milliseconds

  /**
   * Generate cache key from alias and chain
   */
  private generateKey(alias: string, chain?: string): string {
    return `${alias}:${chain || 'all'}`.toLowerCase();
  }

  /**
   * Get cached value if not expired
   */
  get(alias: string, chain?: string): any | null {
    const key = this.generateKey(alias, chain);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] HIT for ${key}`);
    return entry.data;
  }

  /**
   * Set cache value with TTL
   */
  set(alias: string, data: any, chain?: string, ttlMs?: number): void {
    const key = this.generateKey(alias, chain);
    const ttl = ttlMs || this.defaultTTL;

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });

    console.log(`[Cache] SET for ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Clear specific cache entry
   */
  clear(alias: string, chain?: string): void {
    const key = this.generateKey(alias, chain);
    this.cache.delete(key);
    console.log(`[Cache] CLEARED ${key}`);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
    console.log('[Cache] CLEARED ALL');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Cleanup expired entries (periodic maintenance)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }
}

// Global cache instance
export const resolverCache = new SimpleCache();

// Run cleanup every 10 minutes
setInterval(() => {
  resolverCache.cleanup();
}, 600000);
