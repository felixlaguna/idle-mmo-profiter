---
id: imp-gpt6
status: open
deps: [imp-2vax]
links: []
created: 2026-03-10T10:14:00Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-w271
---
# Phase 2: Fix computeMarketPrice to filter by tier 0 (base tier only)

## Fix Description

Update `computeMarketPrice()` in `/home/felix/idle-mmo-profiter/src/utils/computeMarketPrice.ts` to filter `latestSold` entries to only include tier 0 (base tier) sales before computing the VWAP.

The app's profit calculations are based on base-tier items — players craft base-tier items and sell them. Higher-tier sales represent upgraded items with higher value, which should not be included in the VWAP used for crafting profitability calculations.

## Implementation

### Option A: Filter in computeMarketPrice (Recommended)
Add a tier filter parameter (defaulting to 0) to `computeMarketPrice()`:

```typescript
export function computeMarketPrice(
  latestSold: LatestSoldEntry[],
  tierFilter: number = 0
): number | null {
  if (latestSold.length === 0) return null

  // Filter to only include the target tier
  const tierFiltered = latestSold.filter(entry => entry.tier === tierFilter)
  
  // If no sales at target tier, fall back to all entries (or null?)
  const entriesToUse = tierFiltered.length > 0 ? tierFiltered : latestSold

  const now = Date.now()
  const recentSales = entriesToUse.filter(
    (entry) => now - new Date(entry.sold_at).getTime() <= TWENTY_FOUR_HOURS_MS
  )
  // ... rest of VWAP logic
}
```

### Option B: Filter at the call site in refresh-market-prices.ts
Filter the `latest_sold` array before passing to `computeMarketPrice()`:
```typescript
const tier0Sales = marketData.latest_sold.filter(s => s.tier === 0)
const computedPrice = computeMarketPrice(tier0Sales.length > 0 ? tier0Sales : marketData.latest_sold)
```

### Recommendation: Option A
Centralizing the filter in `computeMarketPrice()` ensures ALL callers benefit (both the CLI script and the browser-side `useMarketRefresh.ts`). The function signature change is backward-compatible since the parameter has a default.

## Affected Files
- `/home/felix/idle-mmo-profiter/src/utils/computeMarketPrice.ts` — add tier filter logic
- `/home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts` — no changes needed if using Option A
- `/home/felix/idle-mmo-profiter/src/composables/useMarketRefresh.ts` — no changes needed if using Option A

## Edge Case: Fallback Behavior
Decision needed: If there are NO tier-0 sales in the 24h window, should the function:
(a) Fall back to all-tier VWAP (current behavior minus the bug)
(b) Fall back to most recent tier-0 sale ever
(c) Fall back to most recent sale regardless of tier

Recommendation: (b) Fall back to most recent tier-0 sale ever, then (c) if no tier-0 sales exist at all.

## Acceptance Criteria

- computeMarketPrice filters by tier 0 by default
- Higher-tier sales no longer inflate VWAP
- Fallback behavior is sensible when no tier-0 sales exist
- Function signature is backward-compatible
- Both CLI script and browser refresh use the fix

