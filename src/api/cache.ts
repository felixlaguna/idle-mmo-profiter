/**
 * API Response Caching Layer
 *
 * Implements a cache-first strategy for API responses with TTL-based expiration.
 * Caches are stored in localStorage with automatic quota management.
 *
 * Features:
 * - Cache key generation from URL + sorted query parameters
 * - Configurable TTL per endpoint
 * - Automatic eviction of oldest entries when quota is exceeded
 * - Cache metadata includes URL, timestamps, and expiration info
 * - Methods for cache retrieval, storage, invalidation, and inspection
 */

const CACHE_PREFIX = 'idlemmo-cache:'

/**
 * Check if localStorage is available and functional
 * Node.js v25+ has a global localStorage but it's non-functional without --localstorage-file
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    const testKey = '__cache_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

const HAS_LOCAL_STORAGE = isLocalStorageAvailable()

// Default TTL values (in milliseconds)
const DEFAULT_TTL = {
  'item/search': 24 * 60 * 60 * 1000, // 24 hours
  'item/inspect': 24 * 60 * 60 * 1000, // 24 hours
  'item/market-history': 60 * 60 * 1000, // 1 hour
}

/**
 * Cache entry structure with metadata
 */
interface CacheEntry<T> {
  data: T
  cachedAt: number // Unix timestamp (ms) when data was cached
  expiresAt: number // Unix timestamp (ms) when cache expires
  url: string // Original URL this cache entry is for
}

/**
 * Generate a cache key from URL and query parameters
 *
 * @param url - The API endpoint URL
 * @param params - Optional query parameters
 * @returns Cache key string
 */
export function generateCacheKey(url: string, params?: Record<string, string | number>): string {
  // Sort params alphabetically for consistent keys
  const sortedParams = params
    ? Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&')
    : ''

  // Hash the URL + params combination
  const keyBase = sortedParams ? `${url}?${sortedParams}` : url
  return `${CACHE_PREFIX}${keyBase}`
}

/**
 * Determine TTL based on URL endpoint
 *
 * @param url - The API endpoint URL
 * @returns TTL in milliseconds
 */
function getTTLForUrl(url: string): number {
  if (url.includes('item/search')) {
    return DEFAULT_TTL['item/search']
  } else if (url.includes('/inspect')) {
    return DEFAULT_TTL['item/inspect']
  } else if (url.includes('market-history')) {
    return DEFAULT_TTL['item/market-history']
  }
  // Default to item search TTL for unknown endpoints
  return DEFAULT_TTL['item/search']
}

/**
 * Get data from cache if it exists and is not expired
 *
 * @param key - Cache key
 * @returns Cached data if valid, null otherwise
 */
export function get<T>(key: string): T | null {
  if (!HAS_LOCAL_STORAGE) return null
  try {
    const cached = localStorage.getItem(key)
    if (!cached) {
      return null
    }

    const entry: CacheEntry<T> = JSON.parse(cached)
    const now = Date.now()

    // Check if cache entry has expired
    if (now >= entry.expiresAt) {
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
 *
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlMs - Time to live in milliseconds (optional, will be inferred from URL if not provided)
 */
export function set<T>(key: string, data: T, ttlMs?: number): void {
  if (!HAS_LOCAL_STORAGE) return
  const now = Date.now()

  // Extract URL from cache key (remove prefix)
  const url = key.substring(CACHE_PREFIX.length)

  // Determine TTL - use provided value or infer from URL
  const ttl = ttlMs ?? getTTLForUrl(url)

  const entry: CacheEntry<T> = {
    data,
    cachedAt: now,
    expiresAt: now + ttl,
    url,
  }

  try {
    const serialized = JSON.stringify(entry)
    localStorage.setItem(key, serialized)
  } catch (error) {
    // Handle quota exceeded error by evicting oldest entries
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.warn('LocalStorage quota exceeded, evicting oldest cache entries')
      evictOldestEntries(5) // Evict 5 oldest entries

      // Try again after eviction
      try {
        const serialized = JSON.stringify(entry)
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
 * Remove a specific cache entry
 *
 * @param key - Cache key to invalidate
 */
export function invalidate(key: string): void {
  if (!HAS_LOCAL_STORAGE) return
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to invalidate cache key ${key}:`, error)
  }
}

/**
 * Clear all cache entries
 */
export function invalidateAll(): void {
  if (!HAS_LOCAL_STORAGE) return
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
 * Get the age of a cached entry in milliseconds
 *
 * @param key - Cache key
 * @returns Age in milliseconds, or null if cache entry doesn't exist
 */
export function getAge(key: string): number | null {
  if (!HAS_LOCAL_STORAGE) return null
  try {
    const cached = localStorage.getItem(key)
    if (!cached) {
      return null
    }

    const entry: CacheEntry<unknown> = JSON.parse(cached)
    const now = Date.now()

    return now - entry.cachedAt
  } catch (error) {
    console.warn(`Failed to get age for cache key ${key}:`, error)
    return null
  }
}

/**
 * Evict the oldest N cache entries to free up space
 *
 * @param count - Number of entries to evict
 */
function evictOldestEntries(count: number): void {
  if (!HAS_LOCAL_STORAGE) return
  try {
    const cacheEntries: Array<{ key: string; cachedAt: number }> = []

    // Collect all cache entries with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const entry: CacheEntry<unknown> = JSON.parse(cached)
            cacheEntries.push({ key, cachedAt: entry.cachedAt })
          }
        } catch {
          // If we can't parse it, it's corrupted - remove it
          cacheEntries.push({ key, cachedAt: 0 })
        }
      }
    }

    // Sort by cachedAt timestamp (oldest first)
    cacheEntries.sort((a, b) => a.cachedAt - b.cachedAt)

    // Remove the oldest N entries
    const toRemove = cacheEntries.slice(0, count)
    toRemove.forEach(({ key }) => localStorage.removeItem(key))

    console.log(`Evicted ${toRemove.length} oldest cache entries`)
  } catch (error) {
    console.error('Failed to evict cache entries:', error)
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  if (!HAS_LOCAL_STORAGE) return
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
            if (now >= entry.expiresAt) {
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
 * Get cache statistics (useful for debugging/monitoring)
 *
 * @returns Cache statistics object
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
    if (!HAS_LOCAL_STORAGE) {
      return { totalEntries: 0, validEntries: 0, expiredEntries: 0, totalSizeBytes: 0 }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        totalEntries++
        const cached = localStorage.getItem(key)
        if (cached) {
          totalSizeBytes += cached.length * 2 // Approximate bytes (UTF-16)

          try {
            const entry: CacheEntry<unknown> = JSON.parse(cached)
            if (now < entry.expiresAt) {
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
