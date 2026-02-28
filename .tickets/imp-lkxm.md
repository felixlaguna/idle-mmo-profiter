---
id: imp-lkxm
status: closed
deps: [imp-y75x, imp-qlw0]
links: []
created: 2026-02-28T19:22:02Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-430x
tags: [refactor, script]
---
# Refactor refresh-market-prices.ts to reuse API service layer

## Summary

Rewrite `scripts/refresh-market-prices.ts` to import and use the existing API infrastructure instead of reimplementing it from scratch.

## What Gets Removed (Duplicated Code)

The following code in the script duplicates existing infrastructure and should be DELETED:

1. **fetchMarketPrice() function** (lines 140-187) — Reimplements `getAverageMarketPrice()` from services.ts
2. **API_BASE_URL constant** (line 34) — Duplicates what client.ts manages
3. **REQUEST_DELAY_MS constant and delay() helper** (lines 36, 84-86) — Reimplements the rate limiting that client.ts does automatically via its queue
4. **Manual fetch() calls with Authorization/Accept/User-Agent headers** (lines 148-154) — Duplicates client.ts makeRequest()
5. **MarketHistoryResponse type** (lines 59-81) — Duplicates types in services.ts
6. **LatestSoldEntry type** (lines 60-71) — Duplicates types in services.ts
7. **Manual rate limit delay between requests** (lines 390, 424, 457, 493) — client.ts handles this automatically

## What Gets Added (Imports)

```typescript
import { apiClient } from '../src/api/client'
import { getAverageMarketPrice } from '../src/api/services'
```

## What Changes

### fetchMarketPrice() -> getAverageMarketPrice()

Replace the custom `fetchMarketPrice(hashedId, apiKey, limit)` with the existing service:

```typescript
// BEFORE (custom implementation):
const newPrice = await fetchMarketPrice(item.hashedId, apiKey)

// AFTER (reusing services.ts):
const rawPrice = await getAverageMarketPrice(item.hashedId, 10)
const newPrice = rawPrice !== null ? Math.round(rawPrice * 10) / 10 : null
```

Note: `getAverageMarketPrice()` does NOT round to 1 decimal. The script must still do this rounding step.

### API Client Configuration

At the top of main(), configure the API client for Node.js usage:

```typescript
apiClient.configure({
  baseUrl: 'https://api.idle-mmo.com/v1',
  apiKey: apiKey,
})
```

### Remove Manual Rate Limiting

The `await delay(REQUEST_DELAY_MS)` calls after each item can be REMOVED. The `apiClient` queue handles rate limiting automatically with its sliding window + header-based approach. This is actually BETTER than the current fixed delay because:
- It reads `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers
- It pauses only when actually approaching the limit
- It has retry logic with exponential backoff for 429 responses

### Keep These

- CLI argument parsing (--limit, --dry-run, --api-key)
- API key resolution logic (.env -> CLI -> prompt) — this is script-specific
- defaults.json read/write — this is script-specific (no localStorage)
- Category processing loop with progress display — this is script-specific
- CATEGORY_CONFIG price field mapping — this is script-specific
- resourceGathering sync logic — this is script-specific
- Summary report — this is script-specific

## Acceptance Criteria

- [ ] Script imports `apiClient` from `src/api/client.ts`
- [ ] Script imports `getAverageMarketPrice` from `src/api/services.ts`
- [ ] Script no longer has its own `fetchMarketPrice()` function
- [ ] Script no longer has its own `delay()` function or `REQUEST_DELAY_MS` constant
- [ ] Script no longer has its own `API_BASE_URL` constant
- [ ] Script no longer duplicates `MarketHistoryResponse` or `LatestSoldEntry` types
- [ ] Script calls `apiClient.configure({ baseUrl, apiKey })` before making requests
- [ ] Price rounding to 1 decimal place is preserved (done after getAverageMarketPrice)
- [ ] --limit, --dry-run, --api-key flags still work
- [ ] API key resolution (.env -> CLI -> prompt) still works
- [ ] defaults.json is still read and written correctly
- [ ] resourceGathering sync still works
- [ ] Summary report still shows per-category stats
- [ ] Existing tests are updated to reflect the new implementation

## Affected Files

- `scripts/refresh-market-prices.ts` — Major refactor (remove ~80 lines, add ~10 lines of imports/config)
- `src/tests/scripts/refresh-market-prices.test.ts` — Update tests for new implementation


## Notes

**2026-02-28T19:30:47Z**

Implementation complete. Refactored script to reuse existing API infrastructure.

Changes to scripts/refresh-market-prices.ts:
- Added imports for apiClient and getAverageMarketPrice from src/api
- Removed duplicate fetchMarketPrice() function (47 lines)
- Removed duplicate API_BASE_URL, REQUEST_DELAY_MS constants
- Removed duplicate delay() helper function
- Removed duplicate MarketHistoryResponse and LatestSoldEntry type definitions (23 lines)
- Updated processItem() to use getAverageMarketPrice() instead of custom fetch
- Removed apiKey parameter from processItem() (now configured in apiClient)
- Added apiClient.configure() call in main() with baseUrl and apiKey
- Removed all manual rate limit delay calls (4 locations)
- Updated estimated time calculation (rate limit now automatic)
- Added comment noting rate limiting is handled by apiClient

Net change: Removed ~80 lines of duplicate code, added ~10 lines for imports and configuration.

Benefits:
- Single source of truth for market price calculation
- Automatic rate limiting with header-based throttling and exponential backoff
- Request deduplication handled by apiClient
- Better error handling and retry logic
- Cache layer (no-op in Node.js but available)

All 244 tests pass.
