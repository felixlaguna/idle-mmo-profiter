---
id: imp-qlw0
status: closed
deps: [imp-1fvb]
links: []
created: 2026-02-28T19:21:36Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-430x
tags: [refactor, storage]
---
# Guard storageManager against missing localStorage in Node.js

## Summary

Guard `src/storage/persistence.ts` so that importing it from Node.js does not crash when `localStorage` is undefined.

## Problem

`src/api/client.ts` imports `storageManager` from `src/storage/persistence.ts`:

```typescript
import { storageManager } from '../storage/persistence'
```

The `StorageManager` class uses `localStorage` directly in every method (`getSettings()`, `saveSettings()`, etc.). When the API client module is imported in Node.js (for the CLI script), this import chain will cause crashes if `localStorage` is accessed.

Even with the API client's `configure({ apiKey })` override from ticket imp-1fvb, the `storageManager` is still imported at module level. If `StorageManager` constructor or any eagerly-executed code accesses `localStorage`, it will crash.

## Current Risk Assessment

Looking at the code, `StorageManager` has no constructor logic — `localStorage` is only accessed when methods are called. The `storageManager` singleton is just `new StorageManager()`, which is safe. **However**, the import of `persistence.ts` itself is still a risk if TypeScript/bundler evaluates side effects, and it's fragile against future changes.

## Solution

Add `typeof localStorage !== 'undefined'` guards to the `StorageManager` methods that are reachable from the API client code path:

- `getSettings()` — returns `DEFAULT_SETTINGS` when localStorage unavailable
- Other methods can also be guarded for completeness

This is a defensive measure that costs almost nothing and makes the storage layer Node.js-safe.

## Acceptance Criteria

- [ ] `new StorageManager()` does not crash in Node.js
- [ ] `storageManager.getSettings()` returns `DEFAULT_SETTINGS` (with `apiKey: null`) when localStorage is unavailable
- [ ] All browser behavior is unchanged
- [ ] All existing tests pass unchanged

## Design Notes

- This ticket is closely related to imp-1fvb (API client config). With the `configure({ apiKey })` override, `getApiKey()` in the client will use the override and never call `storageManager.getSettings()`. But having the guard is still the right defensive approach.
- Minimal change: just add a `typeof localStorage === 'undefined'` early-return in `getSettings()`.

## Affected Files

- `src/storage/persistence.ts` — Add localStorage guards


## Notes

**2026-02-28T19:28:23Z**

Implementation complete. Added localStorage guards to all StorageManager methods.

Changes to src/storage/persistence.ts:
- Added 'typeof localStorage !== undefined' guards to all methods that access localStorage
- getSettings() returns DEFAULT_SETTINGS when localStorage unavailable
- saveSettings() silently no-ops when localStorage unavailable
- getPriceOverrides() returns empty Map when localStorage unavailable
- setPriceOverride() silently no-ops when localStorage unavailable
- clearPriceOverride() silently no-ops when localStorage unavailable
- clearAllOverrides() silently no-ops when localStorage unavailable
- importAll() throws error when localStorage unavailable (import is browser-only)
- getStorageVersion() returns STORAGE_VERSION when localStorage unavailable
- clearAll() silently no-ops when localStorage unavailable

All 244 tests pass. Browser behavior unchanged (localStorage is always defined in browser).
