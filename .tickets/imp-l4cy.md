---
id: imp-l4cy
status: closed
deps: [imp-3qgt]
links: []
created: 2026-02-25T18:32:25Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-7w43
---
# Implement API response caching layer

Create src/api/cache.ts:

- Cache API responses in localStorage with TTL
- Cache key = URL + sorted params hash
- Default TTLs:
  - item/search: 24 hours (item list rarely changes)
  - item/inspect: 24 hours (item details rarely change)
  - item/market-history: 1 hour (prices change frequently)
- Cache metadata: { data, cachedAt, expiresAt, url }
- Methods:
  - get(key): returns cached data if not expired, null otherwise
  - set(key, data, ttlMs): store with expiry
  - invalidate(key): remove specific cache entry
  - invalidateAll(): clear all cache
  - getAge(key): how old is the cached data
- Storage quota management: if localStorage is near quota, evict oldest entries first
- Cache-first strategy: always return cached data if available, then fetch in background to update

## Acceptance Criteria

Cache works with localStorage, respects TTL, handles quota limits


## Notes

**2026-02-26T08:43:48Z**

Reviewing existing cache.ts implementation. Current implementation uses CacheKeyType enum, but ticket requires URL + sorted params hash. Rewriting to match exact ticket specifications.

**2026-02-26T08:45:06Z**

Rewritten cache.ts to match ticket requirements:
- Cache key now uses URL + sorted params hash
- Metadata structure: { data, cachedAt, expiresAt, url }
- Methods: get(), set(), invalidate(), invalidateAll(), getAge()
- Updated services.ts to use new cache API
- Updated index.ts exports

**2026-02-26T08:46:27Z**

Implementation complete. Created comprehensive caching layer:

Files modified:
- src/api/cache.ts - Rewritten to match ticket specs with URL+params key generation
- src/api/services.ts - Updated to use new cache API (get, set, generateCacheKey)
- src/api/index.ts - Updated exports
- src/tests/cache.test.ts - Created 28 comprehensive tests

Tests: All 28 passing
Build: Success

Cache features implemented:
- Cache key = URL + sorted params hash
- Metadata: { data, cachedAt, expiresAt, url }
- Methods: get(), set(), invalidate(), invalidateAll(), getAge()
- Storage quota management with oldest-first eviction
- Default TTLs: item/search (24h), item/inspect (24h), market-history (1h)
- Cache-first strategy integrated in services layer
