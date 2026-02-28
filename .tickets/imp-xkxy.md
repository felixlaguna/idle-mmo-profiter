---
id: imp-xkxy
status: closed
deps: [imp-plaq]
links: []
created: 2026-02-28T20:22:49Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-7s0v
---
# Phase 2: Compute suggestedRefreshMinutes from market history data

Create a utility function that computes how often an item's price changes significantly, returning a refresh interval in minutes. Must handle both high-frequency items (trades every few minutes) and low-frequency items (weekly price changes).

## Data sources available

The MarketHistoryResponse provides two data sources at different granularities:

### history_data — daily aggregates (coarse, good for multi-day patterns)
```typescript
interface MarketHistoryEntry {
  date: string          // e.g., '2025-01-15T00:00:00.000000Z'
  total_sold: number    // how many were sold that day
  average_price: number // average price that day
}
```

### latest_sold — individual transactions (fine-grained, good for sub-day patterns)
```typescript
interface LatestSoldEntry {
  item: { hashed_id: string; name: string; image_url: string }
  tier: number
  quantity: number
  price_per_item: number
  total_price: number
  sold_at: string       // e.g., '2025-01-16T14:30:00.000000Z' — full timestamp precision
}
```

## Algorithm for computeSuggestedRefreshMinutes

Create a new function `computeSuggestedRefreshMinutes(marketData: MarketHistoryResponse): number | null`

### Step 1: Analyze latest_sold for sub-day frequency (primary signal for active items)

If latest_sold has >= 2 entries:
1. Sort by sold_at ascending.
2. Calculate the time span between the oldest and newest sold_at in minutes.
3. Count meaningful price changes: consecutive entries where price_per_item differs by > 5%.
4. If there are meaningful changes: `refreshMinutes = totalSpanMinutes / numberOfMeaningfulChanges`
5. If no meaningful changes within latest_sold but there are many transactions (high volume, stable price): use the span divided by the number of transactions as a proxy for market activity, then multiply by 2 (stable items need less frequent checks).

### Step 2: Analyze history_data for multi-day patterns (fallback / supplement)

If latest_sold has < 2 entries OR if the latest_sold span is very short (< 60 minutes, may not be representative):
1. Use history_data entries sorted by date ascending.
2. Compare consecutive days' average_price values. A 'meaningful change' is > 5% difference.
3. `refreshMinutes = (totalSpanDays / numberOfMeaningfulChanges) * 24 * 60`
4. If no meaningful changes: use totalSpanDays * 24 * 60 / numberOfEntries * 2 (stable items).

### Step 3: Combine signals

If both sources provide a result, take the minimum of the two (more conservative — refresh more often).

### Step 4: Clamp bounds

- Minimum: 5 minutes (avoid hammering the API for extremely active items)
- Maximum: 43200 minutes (30 days — even dead items should be checked monthly)

### Step 5: No data

If both latest_sold and history_data are empty, return null (no suggestion possible).

Round result to the nearest integer (whole minutes).

## Files to create/modify

1. Create `/home/felix/idle-mmo-profiter/src/utils/refreshFrequency.ts` (NEW FILE)
   - Export `computeSuggestedRefreshMinutes(marketData: MarketHistoryResponse): number | null`
   - Import `MarketHistoryResponse` from `'../api/services'`
   - Export a helper `formatRefreshInterval(minutes: number): string` that returns human-readable strings:
     - < 60 min: "every X min" (e.g., "every 15 min")
     - 60 min to < 24 hours: "every X.Yh" (e.g., "every 2.5h")
     - >= 24 hours: "every X.Yd" (e.g., "every 3.5d")

2. Create `/home/felix/idle-mmo-profiter/src/tests/utils/refreshFrequency.test.ts` (NEW FILE)
   - Test high-frequency scenario: latest_sold entries minutes apart -> returns small minute values
   - Test medium-frequency scenario: latest_sold entries hours apart -> returns hour-scale values
   - Test low-frequency scenario: only history_data with weekly changes -> returns day-scale values
   - Test stable-price scenario: many transactions but no 5% changes -> returns larger interval
   - Test no data scenario -> returns null
   - Test single entry scenario -> returns null
   - Test clamping: below 5 min -> 5, above 43200 -> 43200
   - Test the 5% threshold boundary
   - Test formatRefreshInterval output strings

## Notes
- This is a pure utility function with no side effects -- easy to test in isolation.
- The function receives the full MarketHistoryResponse because getMarketHistory() already returns it and we don't want extra API calls.
- latest_sold is the primary signal for sub-day frequency since history_data only has daily granularity.

## Acceptance Criteria

- [ ] computeSuggestedRefreshMinutes function exists in src/utils/refreshFrequency.ts
- [ ] Returns integer number of minutes between 5 and 43200, or null if no data
- [ ] Uses 5% price change threshold for detecting meaningful changes
- [ ] Analyzes latest_sold for sub-day frequency (minutes/hours)
- [ ] Falls back to history_data analysis for multi-day patterns
- [ ] formatRefreshInterval returns human-readable strings (min/h/d)
- [ ] Comprehensive tests pass covering high-frequency, medium, low-frequency, and edge cases
- [ ] TypeScript compilation succeeds


**2026-02-28T20:35:46Z**

Phase 2 complete. Created utility functions for computing and formatting refresh intervals.

Files created:
- /home/felix/idle-mmo-profiter/src/utils/refreshFrequency.ts - Main utility with computeSuggestedRefreshMinutes() and formatRefreshInterval()
- /home/felix/idle-mmo-profiter/src/tests/utils/refreshFrequency.test.ts - Comprehensive tests (16 test cases)

Algorithm highlights:
- Analyzes latest_sold for sub-day frequency (primary signal)
- Falls back to history_data for multi-day patterns
- Uses 5% threshold for meaningful price changes
- Clamps results to 5-43200 minutes (5 min to 30 days)
- Handles stable-price and high-volume items appropriately

All tests passing (265/265).
