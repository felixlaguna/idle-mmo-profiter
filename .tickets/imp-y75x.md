---
id: imp-y75x
status: closed
deps: [imp-1fvb]
links: []
created: 2026-02-28T19:21:21Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-430x
tags: [refactor, api]
---
# Make services.ts usable without browser cache layer

## Summary

Make the service functions in `src/api/services.ts` (specifically `getAverageMarketPrice()` and `getMarketHistory()`) work when the browser cache layer (`src/api/cache.ts`) is unavailable (Node.js context).

## Problem

`src/api/services.ts` imports from `src/api/cache.ts`, which depends entirely on `localStorage`:
- `import { get, set, generateCacheKey } from './cache'`
- `get()` reads from `localStorage`
- `set()` writes to `localStorage`
- `invalidate()` removes from `localStorage`

When running from Node.js (the CLI script), `localStorage` does not exist. The cache functions will throw `ReferenceError: localStorage is not defined`.

## Solution

Guard all `localStorage` access in `src/api/cache.ts` with `typeof localStorage !== 'undefined'` checks. When localStorage is unavailable, the cache functions should gracefully degrade:

- `get()` returns `null` (always a cache miss)
- `set()` is a no-op (data not cached, fine for a short-lived script)
- `invalidate()` is a no-op
- `generateCacheKey()` works as-is (pure string logic, no localStorage)

This approach is minimal and non-breaking: the browser behavior is completely unchanged because `typeof localStorage` is always defined in browsers. The Node.js path simply skips caching.

## Acceptance Criteria

- [ ] `src/api/cache.ts` functions do not throw when `localStorage` is undefined
- [ ] `get()` returns `null` when `localStorage` is unavailable
- [ ] `set()` silently returns when `localStorage` is unavailable
- [ ] `invalidate()` silently returns when `localStorage` is unavailable
- [ ] All browser behavior is unchanged (no functional difference when localStorage exists)
- [ ] All existing tests pass unchanged
- [ ] The services in `src/api/services.ts` work when called from Node.js context (they simply never cache)

## Design Notes

- Alternative approach: make cache an optional dependency injected into services. This is more work and changes the services API. The guard approach is simpler and sufficient.
- The `getAverageMarketPrice()` function in services.ts does NOT need changes itself. It calls `getMarketHistory()`, which calls `apiClient.get()` and cache functions. If cache functions are safe, everything works.

## Affected Files

- `src/api/cache.ts` — Add localStorage availability guards


## Notes

**2026-02-28T19:25:59Z**

Implementation complete. Added localStorage guards to all cache functions.

Changes to src/api/cache.ts:
- Added 'typeof localStorage !== undefined' guards to all functions that access localStorage
- get() returns null when localStorage unavailable
- set() silently no-ops when localStorage unavailable
- invalidate() silently no-ops when localStorage unavailable
- invalidateAll() silently no-ops when localStorage unavailable
- getAge() returns null when localStorage unavailable
- evictOldestEntries() silently no-ops when localStorage unavailable
- clearExpiredCache() silently no-ops when localStorage unavailable
- getCacheStats() returns zero stats when localStorage unavailable

All 244 tests pass. Browser behavior unchanged (localStorage is always defined in browser).
