/**
 * Tests for API Response Caching Layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  get,
  set,
  invalidate,
  invalidateAll,
  getAge,
  generateCacheKey,
  getCacheStats,
  clearExpiredCache,
} from '../api/cache'

describe('Cache Layer', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('generateCacheKey', () => {
    it('should generate key from URL only', () => {
      const key = generateCacheKey('/item/search')
      expect(key).toBe('idlemmo-cache:/item/search')
    })

    it('should generate key from URL with sorted params', () => {
      const key = generateCacheKey('/item/search', { query: 'sword', page: 1 })
      expect(key).toBe('idlemmo-cache:/item/search?page=1&query=sword')
    })

    it('should sort params alphabetically for consistent keys', () => {
      const key1 = generateCacheKey('/test', { z: 'last', a: 'first', m: 'middle' })
      const key2 = generateCacheKey('/test', { a: 'first', z: 'last', m: 'middle' })
      expect(key1).toBe(key2)
      expect(key1).toBe('idlemmo-cache:/test?a=first&m=middle&z=last')
    })

    it('should handle numeric param values', () => {
      const key = generateCacheKey('/item/search', { page: 5, limit: 20 })
      expect(key).toBe('idlemmo-cache:/item/search?limit=20&page=5')
    })
  })

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const key = generateCacheKey('/test')
      const data = { foo: 'bar', num: 123 }

      set(key, data)
      const retrieved = get(key)

      expect(retrieved).toEqual(data)
    })

    it('should return null for non-existent key', () => {
      const result = get('idlemmo-cache:/nonexistent')
      expect(result).toBeNull()
    })

    it('should store metadata with cachedAt, expiresAt, and url', () => {
      const key = generateCacheKey('/test')
      const data = { value: 'test' }
      const now = Date.now()

      set(key, data, 1000) // 1 second TTL

      const stored = localStorage.getItem(key)
      expect(stored).toBeTruthy()

      const entry = JSON.parse(stored!)
      expect(entry).toHaveProperty('data')
      expect(entry).toHaveProperty('cachedAt')
      expect(entry).toHaveProperty('expiresAt')
      expect(entry).toHaveProperty('url')
      expect(entry.data).toEqual(data)
      expect(entry.cachedAt).toBeGreaterThanOrEqual(now)
      expect(entry.expiresAt).toBe(entry.cachedAt + 1000)
      expect(entry.url).toBe('/test')
    })

    it('should use default TTL for item/search endpoint (24 hours)', () => {
      const key = generateCacheKey('/item/search', { query: 'sword' })
      const data = { items: [] }

      set(key, data)

      const stored = localStorage.getItem(key)
      const entry = JSON.parse(stored!)
      const expectedTTL = 24 * 60 * 60 * 1000 // 24 hours in ms

      expect(entry.expiresAt - entry.cachedAt).toBe(expectedTTL)
    })

    it('should use default TTL for item/inspect endpoint (24 hours)', () => {
      const key = generateCacheKey('/item/abc123/inspect')
      const data = { item: {} }

      set(key, data)

      const stored = localStorage.getItem(key)
      const entry = JSON.parse(stored!)
      const expectedTTL = 24 * 60 * 60 * 1000 // 24 hours in ms

      expect(entry.expiresAt - entry.cachedAt).toBe(expectedTTL)
    })

    it('should use default TTL for market-history endpoint (1 hour)', () => {
      const key = generateCacheKey('/item/abc123/market-history')
      const data = { history: [] }

      set(key, data)

      const stored = localStorage.getItem(key)
      const entry = JSON.parse(stored!)
      const expectedTTL = 60 * 60 * 1000 // 1 hour in ms

      expect(entry.expiresAt - entry.cachedAt).toBe(expectedTTL)
    })

    it('should allow custom TTL override', () => {
      const key = generateCacheKey('/test')
      const data = { value: 'test' }
      const customTTL = 5000 // 5 seconds

      set(key, data, customTTL)

      const stored = localStorage.getItem(key)
      const entry = JSON.parse(stored!)

      expect(entry.expiresAt - entry.cachedAt).toBe(customTTL)
    })

    it('should return null for expired cache entry', () => {
      const key = generateCacheKey('/test')
      const data = { value: 'test' }

      // Set with very short TTL
      set(key, data, 1) // 1ms TTL

      // Wait for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = get(key)
          expect(result).toBeNull()
          // Should also remove expired entry
          expect(localStorage.getItem(key)).toBeNull()
          resolve()
        }, 10)
      })
    })

    it('should handle corrupted cache entries gracefully', () => {
      const key = 'idlemmo-cache:/test'
      localStorage.setItem(key, 'invalid json{')

      const result = get(key)
      expect(result).toBeNull()
    })
  })

  describe('invalidate', () => {
    it('should remove specific cache entry', () => {
      const key = generateCacheKey('/test')
      const data = { value: 'test' }

      set(key, data)
      expect(get(key)).toEqual(data)

      invalidate(key)
      expect(get(key)).toBeNull()
    })

    it('should handle non-existent keys gracefully', () => {
      expect(() => invalidate('idlemmo-cache:/nonexistent')).not.toThrow()
    })
  })

  describe('invalidateAll', () => {
    it('should remove all cache entries', () => {
      const key1 = generateCacheKey('/test1')
      const key2 = generateCacheKey('/test2')
      const key3 = generateCacheKey('/test3')

      set(key1, { value: 'test1' })
      set(key2, { value: 'test2' })
      set(key3, { value: 'test3' })

      // Add a non-cache item
      localStorage.setItem('other-key', 'should not be removed')

      invalidateAll()

      expect(get(key1)).toBeNull()
      expect(get(key2)).toBeNull()
      expect(get(key3)).toBeNull()
      expect(localStorage.getItem('other-key')).toBe('should not be removed')
    })

    it('should work when cache is empty', () => {
      expect(() => invalidateAll()).not.toThrow()
    })
  })

  describe('getAge', () => {
    it('should return age of cache entry in milliseconds', () => {
      const key = generateCacheKey('/test')
      const data = { value: 'test' }
      const beforeSet = Date.now()

      set(key, data)

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const age = getAge(key)
          expect(age).not.toBeNull()
          expect(age!).toBeGreaterThanOrEqual(50)
          expect(age!).toBeLessThanOrEqual(Date.now() - beforeSet + 10) // Add small buffer
          resolve()
        }, 50)
      })
    })

    it('should return null for non-existent key', () => {
      const age = getAge('idlemmo-cache:/nonexistent')
      expect(age).toBeNull()
    })

    it('should return null for corrupted entry', () => {
      const key = 'idlemmo-cache:/test'
      localStorage.setItem(key, 'invalid json{')

      const age = getAge(key)
      expect(age).toBeNull()
    })
  })

  describe('clearExpiredCache', () => {
    it('should remove only expired entries', () => {
      const key1 = generateCacheKey('/test1')
      const key2 = generateCacheKey('/test2')

      // Set one with short TTL, one with long TTL
      set(key1, { value: 'test1' }, 1) // 1ms TTL
      set(key2, { value: 'test2' }, 10000) // 10s TTL

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          clearExpiredCache()

          expect(get(key1)).toBeNull() // Expired
          expect(get(key2)).toEqual({ value: 'test2' }) // Still valid
          resolve()
        }, 10)
      })
    })

    it('should remove corrupted entries', () => {
      const key1 = 'idlemmo-cache:/test1'
      const key2 = generateCacheKey('/test2')

      localStorage.setItem(key1, 'invalid json{')
      set(key2, { value: 'test2' })

      clearExpiredCache()

      expect(localStorage.getItem(key1)).toBeNull()
      expect(get(key2)).toEqual({ value: 'test2' })
    })
  })

  describe('getCacheStats', () => {
    it('should return correct statistics', () => {
      const key1 = generateCacheKey('/test1')
      const key2 = generateCacheKey('/test2')
      const key3 = generateCacheKey('/test3')

      set(key1, { value: 'test1' }, 10000) // Valid
      set(key2, { value: 'test2' }, 1) // Will expire
      set(key3, { value: 'test3' }, 10000) // Valid

      // Add non-cache item
      localStorage.setItem('other-key', 'should not count')

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const stats = getCacheStats()

          expect(stats.totalEntries).toBe(3)
          expect(stats.validEntries).toBe(2)
          expect(stats.expiredEntries).toBe(1)
          expect(stats.totalSizeBytes).toBeGreaterThan(0)
          resolve()
        }, 10)
      })
    })

    it('should handle empty cache', () => {
      const stats = getCacheStats()

      expect(stats.totalEntries).toBe(0)
      expect(stats.validEntries).toBe(0)
      expect(stats.expiredEntries).toBe(0)
      expect(stats.totalSizeBytes).toBe(0)
    })

    it('should count corrupted entries as expired', () => {
      const key1 = 'idlemmo-cache:/test1'
      const key2 = generateCacheKey('/test2')

      localStorage.setItem(key1, 'invalid json{')
      set(key2, { value: 'test2' })

      const stats = getCacheStats()

      expect(stats.totalEntries).toBe(2)
      expect(stats.validEntries).toBe(1)
      expect(stats.expiredEntries).toBe(1)
    })
  })

  describe('quota management', () => {
    it('should handle quota exceeded by evicting oldest entries', () => {
      // Mock localStorage.setItem to throw quota exceeded error on 4th call
      const originalSetItem = localStorage.setItem.bind(localStorage)
      let setItemCallCount = 0

      vi.spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
        setItemCallCount++
        // Throw quota error on 4th call (after 3 successful cache entries)
        if (setItemCallCount === 4) {
          const error = new DOMException('Quota exceeded', 'QuotaExceededError')
          throw error
        }
        return originalSetItem(key, value)
      })

      // Add 3 entries successfully
      set(generateCacheKey('/test1'), { value: 'test1' })
      set(generateCacheKey('/test2'), { value: 'test2' })
      set(generateCacheKey('/test3'), { value: 'test3' })

      // 4th entry should trigger eviction and retry
      set(generateCacheKey('/test4'), { value: 'test4' })

      // Restore original setItem
      vi.restoreAllMocks()
    })
  })

  describe('integration scenarios', () => {
    it('should handle typical API caching workflow', () => {
      // Simulate API response caching
      const searchParams = { query: 'sword', page: 1 }
      const searchKey = generateCacheKey('/item/search', searchParams)
      const searchData = { items: [{ id: 1, name: 'Iron Sword' }] }

      // First request - cache miss
      expect(get(searchKey)).toBeNull()
      set(searchKey, searchData)

      // Second request - cache hit
      expect(get(searchKey)).toEqual(searchData)

      // Check age
      const age = getAge(searchKey)
      expect(age).not.toBeNull()
      expect(age!).toBeGreaterThanOrEqual(0)

      // Invalidate specific cache
      invalidate(searchKey)
      expect(get(searchKey)).toBeNull()
    })

    it('should handle different TTLs for different endpoints', () => {
      const itemSearchKey = generateCacheKey('/item/search', { query: 'sword' })
      const itemDetailsKey = generateCacheKey('/item/abc123/inspect')
      const marketKey = generateCacheKey('/item/abc123/market-history')

      set(itemSearchKey, { items: [] })
      set(itemDetailsKey, { item: {} })
      set(marketKey, { history: [] })

      const searchEntry = JSON.parse(localStorage.getItem(itemSearchKey)!)
      const detailsEntry = JSON.parse(localStorage.getItem(itemDetailsKey)!)
      const marketEntry = JSON.parse(localStorage.getItem(marketKey)!)

      const searchTTL = searchEntry.expiresAt - searchEntry.cachedAt
      const detailsTTL = detailsEntry.expiresAt - detailsEntry.cachedAt
      const marketTTL = marketEntry.expiresAt - marketEntry.cachedAt

      // Item search and details should have 24 hour TTL
      expect(searchTTL).toBe(24 * 60 * 60 * 1000)
      expect(detailsTTL).toBe(24 * 60 * 60 * 1000)

      // Market history should have 1 hour TTL
      expect(marketTTL).toBe(60 * 60 * 1000)
    })
  })
})
