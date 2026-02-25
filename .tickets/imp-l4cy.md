---
id: imp-l4cy
status: open
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

