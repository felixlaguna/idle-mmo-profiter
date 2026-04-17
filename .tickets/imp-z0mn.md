---
id: imp-z0mn
status: closed
deps: []
links: []
created: 2026-03-10T09:27:47Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Market price VWAP calculation

Change market price computation from simple average of last 10 sales to VWAP (volume-weighted average price) of sales within last 24 hours, falling back to most recent sale price if no sales in that window. Implementation already done — needs review and final QA.


## Notes

**2026-03-10T09:27:58Z**

Implementation already completed before workflow started. Changes:
- New utility: src/utils/computeMarketPrice.ts (VWAP logic)
- Updated: src/api/services.ts (getAverageMarketPrice now delegates to computeMarketPrice)
- Updated: scripts/refresh-market-prices.ts (inline calc replaced)
- Updated: src/composables/useMarketRefresh.ts (inline calc replaced)
- New tests: src/tests/utils/computeMarketPrice.test.ts (6 tests)
- Updated tests: src/tests/api/services.test.ts (3 tests updated)
- All 647 tests pass

**2026-03-10T09:29:39Z**

## Code Review: NEEDS FIXES (2 blocking, 2 advisory)

Files reviewed:
- src/utils/computeMarketPrice.ts (NEW)
- src/api/services.ts
- scripts/refresh-market-prices.ts
- src/composables/useMarketRefresh.ts
- src/tests/utils/computeMarketPrice.test.ts (NEW)
- src/tests/api/services.test.ts

**Tests: ALL 647 PASS (39 test files)**
**Linter: FAIL (1 error)**
**TypeScript: FAIL (1 error related to this change)**

---

### BLOCKING Issues

**1. [Lint/TS] Unused parameter `limit` in getAverageMarketPrice**
File: /home/felix/idle-mmo-profiter/src/api/services.ts, line 320
Problem: The `limit` parameter (default 10) is no longer used because the function now delegates entirely to `computeMarketPrice()`, which uses a 24h time window instead of a count limit. ESLint and tsc both flag this as an error.
Suggestion: Remove the `limit` parameter from the function signature. All call sites in MarketTable.vue call `getAverageMarketPrice(hashedId)` without passing `limit`, so this is safe. Also update the JSDoc `@param limit` line. Also update the mock interface in `/home/felix/idle-mmo-profiter/src/api/mock.ts` line 91 to keep the contract consistent.

**2. [TypeScript] Missing `success` and `category` fields in error return**
File: /home/felix/idle-mmo-profiter/src/composables/useMarketRefresh.ts, lines 252-259
Problem: The `computeMarketPrice` null-check return object is missing `success` and `category` properties required by the `RefreshItemResult` interface. TypeScript confirms: `Type '{ itemId: string; itemName: string; ... }' is missing the following properties from type 'RefreshItemResult': success, category`.
Suggestion: Add `success: false` and `category` to the return object:
```typescript
if (averagePrice === null) {
  return {
    success: false,
    category,
    itemId,
    itemName,
    oldPrice,
    newPrice: null,
    error: 'No market data available',
  }
}
```

---

### ADVISORY Issues (non-blocking)

**3. [Consistency] getMarketPrices still uses old simple-average logic**
File: /home/felix/idle-mmo-profiter/src/api/services.ts, lines 293-308
Problem: The `getMarketPrices()` function still computes a simple average of `price_per_item` across all `latest_sold` entries. It was not updated to use `computeMarketPrice()`. This function is used in the mock provider and potentially in other parts of the app. While the primary price path goes through `getAverageMarketPrice` -> `computeMarketPrice`, having two different price calculation strategies in the same file is inconsistent and could lead to confusion.
Suggestion: Either update `getMarketPrices` to use `computeMarketPrice()` as well, or add a comment explaining why it intentionally uses a different strategy.

**4. [Best Practice] Fallback assumes `latestSold[0]` is the most recent sale**
File: /home/felix/idle-mmo-profiter/src/utils/computeMarketPrice.ts, line 26
Problem: The fallback `return latestSold[0].price_per_item` depends on the API returning `latest_sold` sorted most-recent-first. The comment on line 25 acknowledges this ("latest_sold is sorted most recent first"). This is correct based on current API behavior but is fragile if the API changes. Consider whether a defensive sort is warranted.
Suggestion: This is fine as-is given the existing comment documenting the assumption. No action required unless the API contract is unreliable.

---

### VWAP Implementation Review: CORRECT

The core logic in `computeMarketPrice()` is correct:
- Empty array -> null (correct)
- Filters sales by 24h window using `Date.now()` (correct)
- VWAP formula: sum(price * qty) / sum(qty) (correct)
- Fallback to most recent sale's `price_per_item` when no 24h sales (correct)
- All 3 call sites properly handle the null return
- The 24h constant is properly named and extracted

### Test Coverage Review: GOOD (6 unit tests + 3 integration tests)

Covered scenarios:
- Empty array
- VWAP with multiple recent sales
- Quantity weighting dominance
- Fallback when all sales are old
- Mixed recent + old sales (only recent counted)
- Single sale within 24h

Missing but low-risk edge cases:
- Sale exactly at the 24h boundary (uses <=, so it's included -- correct)
- All sales have quantity 0 (would cause division by zero, but unrealistic from API data)
- Sales with price_per_item of 0 (VWAP handles this correctly, returns 0)

### Consistency Across Call Sites: GOOD

All 3 call sites (services.ts, refresh-market-prices.ts, useMarketRefresh.ts) now delegate to the shared `computeMarketPrice()`. The refresh script additionally rounds to 1 decimal place, which is specific to its file-writing use case.

---

**Summary:** Fix the 2 blocking issues (unused `limit` parameter and missing interface fields), then this is ready to merge.

**2026-03-10T09:29:58Z**

Review findings: 2 blocking issues
1. Unused 'limit' parameter in getAverageMarketPrice — ESLint/TS error
2. Missing 'success' and 'category' fields in null-price error return in useMarketRefresh.ts
Also 1 advisory: getMarketPrices() still uses old simple-average logic (inconsistency)

**2026-03-10T09:31:45Z**

Fixes applied by Implementer agent:
1. Removed unused 'limit' param from getAverageMarketPrice + mock
2. Added missing 'success: false' and 'category' to null-price error return
3. Updated getMarketPrices() to use computeMarketPrice() for consistency
All 647 tests pass, ESLint clean

**2026-03-10T09:33:35Z**

## Code Review (Re-review): APPROVED

Files reviewed:
- /home/felix/idle-mmo-profiter/src/utils/computeMarketPrice.ts (NEW)
- /home/felix/idle-mmo-profiter/src/api/services.ts
- /home/felix/idle-mmo-profiter/src/api/mock.ts
- /home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts
- /home/felix/idle-mmo-profiter/src/composables/useMarketRefresh.ts
- /home/felix/idle-mmo-profiter/src/tests/utils/computeMarketPrice.test.ts (NEW)
- /home/felix/idle-mmo-profiter/src/tests/api/services.test.ts

**Tests: ALL 647 PASS (39 test files)**
**Linter: PASS (0 errors, 1 warning for ignored scripts/ path -- pre-existing)**
**TypeScript: 2 pre-existing errors in useToast.ts (unrelated to this change)**

---

### Previous Blocking Issues -- RESOLVED

1. **Unused limit parameter removed** -- FIXED
   - services.ts getAverageMarketPrice: limit param and JSDoc removed (line 313)
   - mock.ts ApiProvider.getAverageMarketPrice: limit param removed from implementation (line 354-358)
   - All call sites in MarketTable.vue correctly call with just (hashedId) -- no change needed

2. **Missing success/category fields in null-price error return** -- FIXED
   - useMarketRefresh.ts lines 252-262: null check added after computeMarketPrice() call
   - Returns proper RefreshItemResult with success: false, category, and all required fields

### Previous Advisory Issue -- RESOLVED

3. **getMarketPrices() updated to use computeMarketPrice()** -- FIXED
   - services.ts lines 296-303: now delegates to computeMarketPrice() instead of inline simple average
   - Consistent with getAverageMarketPrice() and all other call sites

---

### New Advisory Issues (non-blocking)

1. **[Interface] DataProvider interface still has stale limit parameter**
   File: /home/felix/idle-mmo-profiter/src/api/mock.ts, line 91
   Problem: The DataProvider interface still declares getAverageMarketPrice(hashedItemId: string, limit?: number, tier?: number). The implementation correctly removed limit, but the interface was not updated. This compiles without error because TypeScript allows implementations with fewer params, but the interface is misleading.
   Suggestion: Update line 91 to: getAverageMarketPrice(hashedItemId: string, tier?: number): Promise<number | null>

2. **[Test] Test calls pass stale limit value as tier argument**
   File: /home/felix/idle-mmo-profiter/src/tests/api/services.test.ts, lines 139, 172, 188
   Problem: Three test calls still use getAverageMarketPrice('abc123', 10) where 10 was the old limit value. Since limit was removed, 10 is now being interpreted as tier=10. Tests still pass because the mock intercepts apiClient.get before tier affects anything, but the test code is semantically misleading.
   Suggestion: Change to getAverageMarketPrice('abc123') to match the intent of these tests (no specific tier).

---

### VWAP Implementation: CORRECT (unchanged from first review)

Core logic, test coverage, and all 3 call-site integrations are sound. The advisory items above are cosmetic/hygiene issues that do not affect correctness or functionality. Ready for user review.

**2026-03-10T09:37:30Z**

User Review: Perfect - approved
