---
id: imp-1fvb
status: closed
deps: []
links: []
created: 2026-02-28T19:21:05Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-430x
tags: [refactor, api]
---
# Refactor API client for environment-agnostic configuration

## Summary

Extract the browser-specific dependencies from `RateLimitedApiClient` in `src/api/client.ts` so the class can be used from both browser (Vite) and Node.js (CLI script) contexts.

## Problem

The `RateLimitedApiClient` has 3 hard-coded browser dependencies that prevent reuse from Node.js:

1. **`import.meta.env.VITE_API_BASE_URL`** (line 18) — Vite-specific env var for base URL, defaults to `/api/v1` (Vite proxy path, not a real URL)
2. **`storageManager.getSettings().apiKey`** (line 85-87) — reads API key from `localStorage` via `StorageManager`
3. **Singleton export** — `export const apiClient = new RateLimitedApiClient()` is pre-instantiated with browser defaults

## Solution

Add a configuration method or constructor options to `RateLimitedApiClient`:

```typescript
interface ApiClientConfig {
  baseUrl?: string      // Override BASE_URL (default: import.meta.env... for browser)
  apiKey?: string       // Override getApiKey() (default: read from localStorage)
}

class RateLimitedApiClient {
  private configOverrides: ApiClientConfig = {}

  configure(config: ApiClientConfig): void {
    this.configOverrides = config
  }

  private getApiKey(): string | null {
    // 1. Check override first (for CLI usage)
    if (this.configOverrides.apiKey) {
      return this.configOverrides.apiKey
    }
    // 2. Fall back to localStorage (browser usage)
    const settings = storageManager.getSettings()
    return settings.apiKey
  }

  // Similarly for getBaseUrl()
}
```

## Acceptance Criteria

- [ ] `RateLimitedApiClient` accepts an optional config with `baseUrl` and `apiKey` overrides
- [ ] When `baseUrl` is provided, it's used instead of `import.meta.env.VITE_API_BASE_URL`
- [ ] When `apiKey` is provided, it's used instead of reading from `localStorage`
- [ ] The default browser singleton `apiClient` continues to work exactly as before (no breaking changes)
- [ ] The `storageManager` import is lazy or guarded so it doesn't crash in Node.js when `localStorage` is undefined
- [ ] `isConfigured()` returns `true` when an `apiKey` override is set
- [ ] All existing tests pass unchanged

## Design Notes

- The `configure()` method is preferred over constructor params because the browser singleton is already instantiated at module load time. A `configure()` call allows late binding.
- For the Node.js guard on `storageManager`: either make the import dynamic, or add a try/catch in `getApiKey()` when no override is set, or check `typeof localStorage !== 'undefined'` before accessing it.
- The base URL for CLI should be `https://api.idle-mmo.com/v1` (the real API), not the Vite proxy path.

## Affected Files

- `src/api/client.ts` — Add configuration support
- `src/api/client.ts` tests (if any) — Update to test new config path


## Notes

**2026-02-28T19:24:54Z**

Implementation complete. Added configure() method to RateLimitedApiClient.

Changes to src/api/client.ts:
- Added ApiClientConfig interface (baseUrl, apiKey overrides)
- Added configOverrides property to store config
- Added configure(config) method to set overrides
- Added getBaseUrl() method with override support
- Updated getApiKey() to check override first, then localStorage
- Added localStorage guard (typeof localStorage !== 'undefined')
- Updated makeRequest() to use configurable base URL

All 244 tests pass. Browser behavior unchanged.
