/**
 * Response caching layer for API data
 *
 * Caches API responses in localStorage with TTL (Time To Live):
 * - Item data: 24 hours TTL (static data changes rarely)
 * - Market prices: 1 hour TTL (dynamic data needs fresher updates)
 *
 * Features:
 * - Automatic cache invalidation based on TTL
 * - Storage quota management (evict oldest entries when full)
 * - Namespaced keys with prefix 'idlemmo-cache:'
 */

const CACHE_PREFIX = 'idlemmo-cache:'
const ITEM_DATA_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MARKET_DATA_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Cache key types for different data categories
 */
export enum CacheKeyType {
  ITEM_SEARCH = 'item-search',
  ITEM_DETAILS = 'item-details',
  MARKET_HISTORY = 'market-history',
}

/**
 * Build a cache key from type and identifier
 */
export function buildCacheKey(keyType: CacheKeyType, identifier: string): string {
  return `${CACHE_PREFIX}${keyType}:${identifier}`
}

/**
 * Get data from cache if it exists and is valid
 */
export function getCached<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) {
      return null
    }

    const entry: CacheEntry<T> = JSON.parse(cached)
    const now = Date.now()

    // Check if cache entry is still valid
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, remove it
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch (error) {
    console.warn(`Failed to read cache for key ${key}:`, error)
    return null
  }
}

/**
 * Store data in cache with TTL
 */
export function setCache<T>(key: string, data: T, ttl?: number): void {
  // Determine TTL - use provided value or infer from key type
  let cacheTTL = ttl

  if (!cacheTTL) {
    // Try to infer TTL from key
    if (key.includes(CacheKeyType.ITEM_SEARCH) || key.includes(CacheKeyType.ITEM_DETAILS)) {
      cacheTTL = ITEM_DATA_TTL_MS
    } else if (key.includes(CacheKeyType.MARKET_HISTORY)) {
      cacheTTL = MARKET_DATA_TTL_MS
    } else {
      cacheTTL = ITEM_DATA_TTL_MS // Default to item data TTL
    }
  }

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: cacheTTL,
  }

  const serialized = JSON.stringify(entry)

  try {
    localStorage.setItem(key, serialized)
  } catch (error) {
    // Handle quota exceeded error by evicting oldest entries
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.warn('LocalStorage quota exceeded, evicting oldest cache entries')
      evictOldestCacheEntries(5) // Evict 5 oldest entries

      // Try again after eviction
      try {
        localStorage.setItem(key, serialized)
      } catch (retryError) {
        console.error('Failed to cache data even after eviction:', retryError)
      }
    } else {
      console.error('Failed to cache data:', error)
    }
  }
}

/**
 * Check if a cache entry exists and is valid
 */
export function isCacheValid(key: string): boolean {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) {
      return false
    }

    const entry: CacheEntry<unknown> = JSON.parse(cached)
    const now = Date.now()

    return now - entry.timestamp <= entry.ttl
  } catch {
    return false
  }
}

/**
 * Clear all cache entries (only those with our prefix)
 */
export function clearCache(): void {
  try {
    const keysToRemove: string[] = []

    // Find all cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    // Remove them
    keysToRemove.forEach((key) => localStorage.removeItem(key))

    console.log(`Cleared ${keysToRemove.length} cache entries`)
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  try {
    const keysToRemove: string[] = []
    const now = Date.now()

    // Find all expired cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const entry: CacheEntry<unknown> = JSON.parse(cached)
            if (now - entry.timestamp > entry.ttl) {
              keysToRemove.push(key)
            }
          }
        } catch {
          // If we can't parse it, it's corrupted - remove it
          keysToRemove.push(key)
        }
      }
    }

    // Remove expired entries
    keysToRemove.forEach((key) => localStorage.removeItem(key))

    if (keysToRemove.length > 0) {
      console.log(`Cleared ${keysToRemove.length} expired cache entries`)
    }
  } catch (error) {
    console.error('Failed to clear expired cache:', error)
  }
}

/**
 * Evict the oldest N cache entries to free up space
 */
function evictOldestCacheEntries(count: number): void {
  try {
    const cacheEntries: Array<{ key: string; timestamp: number }> = []

    // Collect all cache entries with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const entry: CacheEntry<unknown> = JSON.parse(cached)
            cacheEntries.push({ key, timestamp: entry.timestamp })
          }
        } catch {
          // If we can't parse it, we'll remove it anyway
          cacheEntries.push({ key, timestamp: 0 })
        }
      }
    }

    // Sort by timestamp (oldest first)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp)

    // Remove the oldest N entries
    const toRemove = cacheEntries.slice(0, count)
    toRemove.forEach(({ key }) => localStorage.removeItem(key))

    console.log(`Evicted ${toRemove.length} oldest cache entries`)
  } catch (error) {
    console.error('Failed to evict cache entries:', error)
  }
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats(): {
  totalEntries: number
  validEntries: number
  expiredEntries: number
  totalSizeBytes: number
} {
  let totalEntries = 0
  let validEntries = 0
  let expiredEntries = 0
  let totalSizeBytes = 0
  const now = Date.now()

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        totalEntries++
        const cached = localStorage.getItem(key)
        if (cached) {
          totalSizeBytes += cached.length * 2 // Approximate bytes (UTF-16)

          try {
            const entry: CacheEntry<unknown> = JSON.parse(cached)
            if (now - entry.timestamp <= entry.ttl) {
              validEntries++
            } else {
              expiredEntries++
            }
          } catch {
            expiredEntries++
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get cache stats:', error)
  }

  return {
    totalEntries,
    validEntries,
    expiredEntries,
    totalSizeBytes,
  }
}
