---
id: imp-w271
status: closed
deps: []
links: []
created: 2026-03-10T10:11:56Z
type: bug
priority: 2
assignee: Félix Laguna Teno
---
# Bug: Earthcore Infusion market price incorrect — reports 8500 instead of ~7500

User reports that Earthcore Infusion's market price is showing as ~8500 but recent 24h sales mostly coast around 7500. The app uses VWAP of last 24h sales for market price calculation (per recent commit 5c4ba39). Need to investigate why the VWAP calculation is producing a higher-than-expected result.


## Notes

**2026-03-10T10:14:45Z**

## Planning Complete — Root Cause Analysis

### Probable Root Cause: Tier contamination in VWAP calculation

The `computeMarketPrice()` function computes VWAP across ALL sales in the `latest_sold` array without filtering by item tier. The API is called with `tier=0` which means 'all tiers' (unfiltered), so the response includes sales of tier-0, tier-1, tier-2, etc. Higher-tier versions of items sell for significantly more, inflating the VWAP.

For Earthcore Infusion:
- Base tier (tier 0) sales cluster around ~7500 (what the user observes)
- Higher tier sales are priced significantly higher
- The mixed-tier VWAP produces ~8500

### Affected Files
1. `/home/felix/idle-mmo-profiter/src/utils/computeMarketPrice.ts` — VWAP calculation (no tier filter)
2. `/home/felix/idle-mmo-profiter/src/api/services.ts` — LatestSoldEntry type has `tier` field (unused in computation)
3. `/home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts` — calls computeMarketPrice without tier awareness
4. `/home/felix/idle-mmo-profiter/src/composables/useMarketRefresh.ts` — browser-side refresh, same issue
5. `/home/felix/idle-mmo-profiter/src/tests/utils/computeMarketPrice.test.ts` — tests need tier coverage

### Phases Created: 4 task tickets (linear dependency chain)
- imp-2vax: Phase 1 — Investigate and confirm root cause with data
- imp-gpt6: Phase 2 — Fix computeMarketPrice to filter by tier 0
- imp-14kx: Phase 3 — Update tests for tier-filtered VWAP
- imp-c03u: Phase 4 — Re-run refresh and verify Earthcore Infusion price

### Dependencies: imp-2vax -> imp-gpt6 -> imp-14kx -> imp-c03u

### Risks
1. **makeSale test helper defaults to tier: 1** — existing tests use tier 1, but the new default filter targets tier 0. The test helper needs updating to tier 0, or existing tests need explicit tier values.
2. **Items with NO tier-0 sales** — some items may only have higher-tier sales. The fallback behavior needs careful design to avoid returning null for otherwise-valid items.
3. **Other items may see price changes** — filtering to tier 0 will change prices for ALL items, not just Earthcore Infusion. This is the correct behavior, but may surprise users if many prices shift.

### Decision Needed from User
When no tier-0 sales exist in the 24h window, should the fallback be:
(a) Most recent tier-0 sale ever (recommended)
(b) All-tier VWAP (current behavior without the time filter)
(c) Most recent sale regardless of tier

Ready for user approval.

**2026-03-10T10:21:25Z**

User clarification: Earthcore Infusion does NOT have tiers. Tier contamination is NOT the root cause. Need to investigate the actual VWAP calculation more carefully — refresh the price for just this item to see what's happening.

**2026-03-10T10:25:55Z**

ROOT CAUSE CONFIRMED: The refresh-market-prices.ts script's craftableRecipes section (line 720-793) fetches market data but only updates lastSaleAt/weeklySalesVolume/suggestedRefreshMinutes. It NEVER calls computeMarketPrice() to update the currentPrice field. This means all craftableRecipe prices are stale from whenever they were initially populated. Fix: add computeMarketPrice() call in the craftableRecipes processing loop and store the result in currentPrice.

**2026-03-10T10:26:31Z**

Investigation: Confirmed bug at lines 720-793. The craftableRecipes section fetches market data but only updates lastSaleAt, weeklySalesVolume, lastUpdated, and suggestedRefreshMinutes. Missing: price computation and currentPrice update. Will add computeMarketPrice() call and update logging similar to processItem().

**2026-03-10T10:27:33Z**

Fix applied successfully.

Root cause: craftableRecipes section fetched market data but only updated lastSaleAt, weeklySalesVolume, lastUpdated, and suggestedRefreshMinutes. The currentPrice field was never refreshed.

Fix implemented (lines 771-808):
1. Added computeMarketPrice(marketData.latest_sold) call to compute VWAP
2. Added null check - skip if computedPrice is null
3. Round computed price to 1 decimal place: Math.round(computedPrice * 10) / 10
4. Store in currentPrice field: (craftableRecipe as Record<string, unknown>).currentPrice = newPrice
5. Updated logging to show price changes (old → new) similar to processItem()

Files modified:
- /home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts (lines 771-808)

Tests: All passing (673/673 passed, 1 skipped)

The craftableRecipes section now properly updates currentPrice field alongside lastSaleAt and other metadata.

**2026-03-10T10:29:47Z**

## Code Review: APPROVED

### Files Reviewed
- /home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts (lines 771-808, the diff)

### Pattern Comparison with processItem() (lines 258-309)
The fix correctly mirrors the established pattern in processItem():
1. computeMarketPrice(marketData.latest_sold) call -- MATCHES (line 258 vs 772)
2. null check on computedPrice with early continue/return -- MATCHES (line 259 vs 773)
3. Rounding: Math.round(computedPrice * 10) / 10 -- MATCHES (line 268 vs 777)
4. oldPrice captured before update -- MATCHES (line 269 vs 778)
5. In-place update via Record<string,unknown> cast -- MATCHES (line 280 vs 781)
6. Log output with change symbol and formatRefreshInterval -- MATCHES (lines 299-308 vs 800-808)

### Edge Case Analysis
- **null computedPrice**: Handled correctly at line 773 with early continue
- **undefined oldPrice**: Handled at line 800 -- falls through to the else branch showing 'New price: ...' for items that never had a price before. The CraftableRecipe type declares currentPrice as required (non-optional number), so oldPrice will always be defined in practice. However, the undefined check is a safe defensive pattern. PASS.
- **marketData empty or null**: Already handled at line 766 before the new code runs. PASS.

### Minor Observations (non-blocking)
1. The processItem() log includes a '(default)' indicator when suggestedRefreshMinutes falls back to DEFAULT_REFRESH_MINUTES (line 302). The craftableRecipes section does not show this indicator. This is a pre-existing minor inconsistency, NOT introduced by this diff.
2. The duplicate log message at line 774 ('No market data available') is slightly misleading since computeMarketPrice returning null after a non-empty latest_sold array would be impossible (computeMarketPrice only returns null for empty arrays, and line 766 already guards against that). This is dead code in practice but harmless as a defensive guard. PASS.

### Linter: PASS
ESLint runs clean with --no-ignore (file is in .eslintignore by default for scripts/).

### Tests: ALL PASSING
673 passed, 1 skipped (40 test files). No regressions.

### Style Guide: Compliant
- Consistent comment style
- Consistent use of type assertions
- Consistent variable naming (computedPrice, newPrice, oldPrice)
- Consistent log formatting with emoji indicators

No issues found. Ready for user review.

**2026-03-10T10:31:10Z**

User Review: Perfect - approved
