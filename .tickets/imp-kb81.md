---
id: imp-kb81
status: closed
deps: []
links: []
created: 2026-02-27T11:28:45Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Update dungeon price for untradable limited-use recipes

Update dungeon price calculation for recipes that are both untradable AND have limited uses. Instead of valuing them at 0, calculate their value as the profit per potion (without recipe cost). If profit is less than 0, keep 0 for the dungeon calculation. Use case: when such recipes drop in dungeons, they have value equal to the crafting profit they can generate.


## Notes

**2026-02-27T11:32:00Z**

## Scouter Analysis - Codebase Assessment

### Key Finding: The pricing logic already exists -- this is primarily a DATA task

The useRecipePricing composable (/home/felix/idle-mmo-profiter/src/composables/useRecipePricing.ts) already implements the exact logic needed:
- For untradable recipes with uses > 0 and known producesItemName
- It computes: price = uses * potionProfit
- Where potionProfit = sellAfterTax - totalMaterialCost (NO recipe cost included)
- If potionProfit <= 0, price stays at 0

This computed price already flows into the dungeon calculator via App.vue:
  dataProvider.recipes -> useRecipePricing -> recipesWithComputedPrices -> calculateDungeonProfits

### The Gap: Data fields not populated
Currently, ALL 34 untradable recipes in defaults.json are MISSING the critical fields:
- uses: not set on ANY untradable recipe
- producesItemName: not set on ANY untradable recipe

Without these fields, useRecipePricing skips computation (line 98-100: early return when !recipe.uses).

### Affected Files
- /home/felix/idle-mmo-profiter/src/data/defaults.json -- PRIMARY: populate uses + producesItemName
- /home/felix/idle-mmo-profiter/src/composables/useRecipePricing.ts -- REVIEW ONLY (logic already correct)
- /home/felix/idle-mmo-profiter/src/calculators/dungeonCalculator.ts -- REVIEW ONLY (uses recipe.price which gets computed)
- /home/felix/idle-mmo-profiter/src/App.vue -- REVIEW ONLY (data flow already wired)
- /home/felix/idle-mmo-profiter/src/components/DungeonTable.vue -- REVIEW (computed indicator already exists)
- /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts -- NEW: add tests

### Phases Created: 4 task tickets
1. imp-im87: Populate recipe data (uses, producesItemName) in defaults.json
2. imp-op02: Verify existing logic handles the feature correctly
3. imp-cuor: Write unit tests
4. imp-xs77: Verify/enhance DungeonTable UI indicator

### Dependencies
- Phase 1 (data) blocks Phase 2 and Phase 3
- Phase 3 blocks Phase 4
- Phase 2 and Phase 3 can run in parallel after Phase 1

### Risks
- Risk 1: Unknown 'uses' values -- the correct number of uses per recipe is game-specific data that must come from the user. Mitigation: Ask the user for correct values.
- Risk 2: Some untradable recipes may have infinite uses (not limited). These should NOT be treated this way. Mitigation: Only populate 'uses' for recipes that actually have limited uses in-game.
- Risk 3: Recipes that don't have a matching potionCraft entry cannot have their profit computed. Mitigation: useRecipePricing already handles this gracefully (skips if no matching potion found).

**2026-02-27T11:38:18Z**

User will populate recipe data by doing a market update in the app, then dumping defaults.json. Once data is in place, we verify the existing logic handles it correctly.

**2026-02-27T11:40:54Z**

User requested: Add a refresh item data button inside the hashed ID modal in the market tab. This will allow populating recipe data (uses, producesItemName) needed for the dungeon pricing feature.

**2026-02-27T11:42:56Z**

## Phase 5: Refresh Item Data Button -- Planning Analysis

### Feature Summary
Add a 'Refresh Item Data' button inside the HashedIdModal (market tab). Clicking it
calls the inspectItem() API endpoint for the current item, then persists uses,
producesItemName, producesItemHashedId, and vendorValue into the data provider. This
lets users populate recipe metadata needed for dungeon pricing without manual data entry.

### Affected Files
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue -- ADD button UI, emit, refreshing prop
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue -- ADD refreshItemData handler, wire to modal

### Existing Patterns Leveraged
- The addUntrackedPotion function (MarketTable.vue:343-519) already calls inspectItem()
  and extracts max_uses/producesItemName. The new handler is a simpler version of this.
- The per-item refresh button (MarketTable.vue:254-279) shows the loading/toast pattern.
- HashedIdModal already emits events (save) that MarketTable handles -- same pattern.
- dataProvider.updateRecipeDefaults() already persists uses/producesItemName to localStorage.
- Cache invalidation via invalidate(generateCacheKey()) is already used in useMarketRefresh.

### API Endpoint Used
GET /item/{hashedId}/inspect returns ItemDetails with:
  - vendor_price (number)
  - recipe.max_uses (number | null) -- becomes 'uses'
  - recipe.result.item_name (string) -- becomes 'producesItemName'
  - recipe.result.hashed_item_id (string) -- becomes 'producesItemHashedId'

### New Task Tickets (3)
1. imp-utho: Add button UI to HashedIdModal.vue (props, emit, styling)
2. imp-mly2: Wire handler in MarketTable.vue (API call, data persistence, counterpart update)
3. imp-iy7g: End-to-end manual testing

### Dependencies
imp-utho -> imp-mly2 -> imp-iy7g (linear)
These are independent of the existing Phase 1-4 tickets.

### Risks
- Risk 1: API rate limiting -- inspectItem uses the same rate-limited client, single calls are fine.
- Risk 2: Item has no recipe data -- handler must gracefully handle null recipe (just update vendorValue).
- Risk 3: Cache staleness -- mitigated by invalidating the inspect cache before the API call.

**2026-02-27T11:46:54Z**

Phase 5 (Refresh Item Data button) - Implementation Complete

All three task tickets completed:
✓ imp-utho - Add button to HashedIdModal component
✓ imp-mly2 - Wire handler in MarketTable
✓ imp-iy7g - Code verification (ready for manual testing)

Files modified:
1. /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue
   - Added refreshing prop (boolean, default false)
   - Added refresh event emit
   - Added Refresh Item Data button with separator
   - Button disabled when no hashedId or when refreshing
   - Shows spinner during refresh
   - Styled with blue accent color

2. /home/felix/idle-mmo-profiter/src/components/MarketTable.vue
   - Added refreshItemDataLoading ref
   - Added refreshItemData async handler function
   - Invalidates inspect cache before API call
   - Updates vendorValue for all categories
   - For recipes: extracts and persists uses, producesItemName, producesItemHashedId
   - Updates both clicked recipe and counterpart (tradable ↔ untradable)
   - Wired :refreshing and @refresh to HashedIdModal

Build status: SUCCESS (npm run build - no TypeScript errors)

Ready for user acceptance testing.

**2026-02-27T11:49:14Z**

## Code Review: Phase 5 — Refresh Item Data Button

**Reviewer:** Claude Code  
**Files:** HashedIdModal.vue, MarketTable.vue  
**Verdict:** ✅ PASS — Clean, correct implementation with minor observations

---

### Verification Results
- **TypeScript:** `npx vue-tsc --noEmit` — PASS (zero errors)
- **Tests:** `npx vitest run` — PASS (197/197 tests, 11 files)
- **Lint:** `npx eslint` on both files — PASS (zero warnings/errors)

---

### HashedIdModal.vue — ✅ No Issues

**Props & emits:** Correctly adds optional `refreshing` prop with `withDefaults` default of `false`, and `refresh` emit with typed tuple signature — follows the existing `save` emit pattern exactly.

**Button disabled states:** Correctly disabled when `!hasCurrentHashedId || refreshing`. Title attribute provides contextual feedback for both disabled states plus the normal state.

**Spinner/icon toggle:** Clean `v-if/v-else` between spinner and SVG icon, with matching text label change. Spinner CSS animation is self-contained in scoped styles.

**Layout:** Separator + refresh section placed between form group and modal actions — logical visual flow. Full-width button is appropriate for modal context.

**Styling:** Uses `var(--accent-secondary, #3b82f6)` with a hardcoded fallback — the hover color `#2563eb` is also hardcoded rather than using a CSS variable. This is consistent with how `.btn-clear:hover` uses hardcoded rgba for its hover, so acceptable within this codebase. The `.spinner-inline` and `@keyframes spin` are cleanly scoped.

---

### MarketTable.vue — ✅ No Issues

**Handler structure:** Follows the established try/catch/finally pattern from `refreshItem` (line 254) and `addUntrackedPotion` (line 346). Loading state correctly set before `try`, cleared in `finally`.

**Guard clauses:** Two early returns — null modal item check and missing hashed ID check — both correct and appropriately defensive.

**Cache invalidation:** Invalidates the inspect cache key before calling `inspectItem()`, ensuring fresh data. Uses `generateCacheKey(\`/item/${currentHashedId}/inspect\`)` which matches the exact pattern in `services.ts:189`. This is the only place in the codebase that explicitly invalidates before an inspect call — the addUntrackedPotion path does NOT invalidate cache, so the refresh handler is strictly more correct for its purpose.

**Vendor value update:** Calls `dataProvider.updateVendorValue(category, itemId, ...)` for ALL categories, not just recipes. Correctly guards against `undefined`/`null` vendor_price. This is correct — the button is available for any item that has a hashedId.

**Recipe data extraction:** For recipe category items with recipe data:
- Extracts `max_uses` → `uses`, `result.item_name` → `producesItemName`, `result.hashed_item_id` → `producesItemHashedId`
- Each field is individually null-checked before inclusion in the update object
- Passes update to `dataProvider.updateRecipeDefaults()` which persists to both in-memory defaults and localStorage user overrides

**Counterpart update logic:** Correctly replicates the pattern from `addUntrackedPotion` (lines 492-498):
- Strips `(Untradable)` suffix to find base name
- Filters recipes by matching base name, excluding self
- Applies the same `recipeUpdate` to all counterparts
- Handles 0 or multiple counterparts gracefully via `for...of` loop

**Toast notifications:** Two success paths (recipe vs non-recipe) with distinct messages, and error path with message extraction — consistent with the existing patterns.

**Dynamic imports:** Uses `await import(...)` for services and cache modules, consistent with `addUntrackedPotion` (line 367). This is a pattern choice for code-splitting in this component.

**Template wiring:** `:refreshing` and `@refresh` correctly bound on the `<HashedIdModal>` component instance (lines 793-795).

---

### Observations (Non-blocking)

1. **No `producesItemHashedId` update in `addUntrackedPotion`:** The new `refreshItemData` handler extracts and persists `producesItemHashedId`, but the existing `addUntrackedPotion` function does NOT extract this field (lines 482-486 only set `producesItemName` and `uses`). This is not a bug in the new code — it's actually an improvement. However, it means the two paths produce slightly different data. Consider backporting the `producesItemHashedId` extraction to `addUntrackedPotion` for consistency in a follow-up.

2. **Loading state is global, not per-item:** `refreshItemDataLoading` is a single `ref(false)` rather than a per-item record like `addRecipeLoading` or `itemRefreshLoading`. This is fine because the modal can only be open for one item at a time, so there's no concurrent refresh scenario.

3. **Modal stays open during refresh:** The refresh handler does not close the modal — the user can see the spinner and then the success toast while the modal remains open. This is good UX as it lets the user verify the operation completed.

**2026-02-27T11:54:25Z**

User Review: Perfect - Refresh Item Data button approved

**2026-02-27T11:59:34Z**

Implementation Complete - All Phases Finished

Phase 1 (imp-im87) - Data Population: ✓ CLOSED
- Verified all 34 untradable recipes have uses, producesItemName, producesItemHashedId
- 21 untradable recipes have uses=30 (limited-use recipes)
- 13 untradable recipes have uses=0 (unlimited-use recipes)
- Data model is correct and populated via Refresh Item Data button

Phase 2 (imp-op02) - Logic Verification: ✓ CLOSED
- Confirmed useRecipePricing.ts correctly implements the feature:
  * Checks isUntradable AND uses > 0
  * Computes price = uses × potionProfit
  * potionProfit excludes recipe cost (only material costs)
  * Negative profit results in price = 0
- Confirmed data flow: useRecipePricing → recipesWithComputedPrices → calculateDungeonProfits

Phase 3 (imp-cuor) - Unit Tests: ✓ CLOSED
- Created comprehensive test suite: src/tests/calculators/dungeonCalculator.test.ts
- 13 tests covering all requirements and edge cases
- All 210 tests in full suite passing

Phase 4 (imp-xs77) - UI Indicator: ✓ CLOSED
- Verified computed-price indicator (ⓒ) in DungeonTable.vue
- Displays for all untradable recipes with tooltip
- Styling follows design system with hover effects

Summary:
The feature is fully implemented and tested. Untradable recipes with limited uses (uses=30) now have their dungeon value calculated based on crafting profit potential, rather than being valued at 0. The pricing logic correctly:
1. Only applies to untradable recipes with uses > 0
2. Excludes recipe cost from profit calculation
3. Sets price to 0 when potion profit is negative
4. Flows correctly into dungeon expected value calculations

Files modified: None (existing logic was already correct)
Files created:
- /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts

Test status: 210/210 tests passing

**2026-02-27T12:02:41Z**

## Code Review: NEEDS FIXES

### Files Reviewed
- /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts (NEW, 509 lines, 13 tests)
- /home/felix/idle-mmo-profiter/src/composables/useRecipePricing.ts (127 lines)
- /home/felix/idle-mmo-profiter/src/calculators/dungeonCalculator.ts (99 lines, data flow verification)
- /home/felix/idle-mmo-profiter/src/types/index.ts (type definitions)

---

### Tool Results

**Tests (npx vitest run): PASS** -- 210/210 tests, 12 test files, all green.

**TypeScript (npx vue-tsc --noEmit): PASS** -- Zero errors. However, test files are excluded from tsconfig.json (line 30: exclude pattern), so test type errors are invisible to this check. Running tsc directly on the test file reveals 5 type errors (see below).

**Lint (npx eslint): PASS for reviewed files** -- The two files under review (dungeonCalculator.test.ts, useRecipePricing.ts) have zero lint errors. The 61 eslint errors reported are all pre-existing in other test files (global/Storage/beforeEach not defined, no-explicit-any) and unrelated to this epic.

---

### Issues Found: 1 (Type Safety)

#### Issue 1: [Type Safety] Mock DungeonDrop objects missing required 'expectedValue' field
**File:** /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts
**Lines:** 261, 310, 311, 352, 387
**Severity:** Medium

**Problem:** The Dungeon type's drops field uses DungeonDrop which requires both recipeName AND expectedValue. The test mock drops only provide { recipeName: string }, omitting the required expectedValue field. This causes 5 TS2741 errors when the file is type-checked directly (tsc --strict), but these are hidden because tsconfig.json excludes test files.

The tests still pass at runtime because JavaScript doesn't enforce interfaces, but this means the mock data does not match the type contract.

**Suggestion:** Add expectedValue: 0 to each mock DungeonDrop, since the calculator will overwrite it anyway. Example:

Current (line 261):
  drops: [{ recipeName: 'Wraithbane Essence Recipe (Untradable)' }]

Suggested:
  drops: [{ recipeName: 'Wraithbane Essence Recipe (Untradable)', expectedValue: 0 }]

Same fix needed on lines 310, 311, 352, and 387.

Alternatively, consider using a cast (as DungeonDrop) or Partial<DungeonDrop> if the intent is to test with incomplete input data. However, since calculateDungeonProfits expects full Dungeon objects, the cleaner approach is to provide complete mock data.

NOTE: The Dungeon type also requires numDrops: number, but the test dungeons omit it. This is not flagged separately by tsc because the drops array type error takes priority. All 5 test dungeons (lines 256, 305, 347, 382) should also include numDrops matching their drops.length. For example:

  const dungeon: Dungeon = {
    name: 'Test Dungeon',
    runCost: 1000,
    timeSeconds: 3600,
    numDrops: 1,           // ADD THIS
    drops: [
      { recipeName: '...', expectedValue: 0 }  // ADD expectedValue
    ]
  }

---

### Logic Review: useRecipePricing.ts -- CORRECT

The pricing logic is verified correct for the feature requirements:

1. calculatePotionProfit (line 29-44): Computes profit as sellAfterTax - totalMaterialCost. Recipe cost is correctly EXCLUDED (only material costs via craft.materials.reduce). This matches the requirement 'without recipe cost'.

2. Guard at line 92-94: Tradable recipes with price > 0 are returned unchanged. This correctly preserves market prices for tradable recipes.

3. Guard at line 98-100: Recipes without uses or with uses <= 0 are returned unchanged. This correctly handles infinite-use untradable recipes (uses=0) and recipes without uses field.

4. Computation at line 111: computedPrice = potionProfit > 0 ? uses * potionProfit : 0. This correctly implements 'if profit < 0, price = 0'.

5. Data flow verified: useRecipePricing produces recipesWithComputedPrices -> passed to calculateDungeonProfits which reads recipe.price (line 65 of dungeonCalculator.ts). The computed price flows through correctly.

### Logic Review: dungeonCalculator.ts -- CORRECT

The calculator correctly:
- Builds a recipe lookup map (line 44-47)
- Computes expectedValue = price * chance * (1 + totalMF/100) per drop (line 65)
- Sums drop values and subtracts runCost for total profit (line 76-82)
- Sorts by profitPerHour descending (line 98)

### Test Coverage Assessment: GOOD

The 13 tests cover all critical paths:
- Happy path: untradable recipe with uses + producesItemName gets computed price (test 1)
- Negative profit: price set to 0 (test 2)
- Missing uses: no computation (test 3)
- Zero uses: no computation (test 4)
- Tradable recipe: market price preserved (test 5)
- No matching potion: price stays 0 (test 6)
- Integration: computed price flows into dungeon EV calculation (test 7)
- Mixed drops: tradable + untradable in same dungeon (test 8)
- Zero-price dungeon drop: loss correctly calculated (test 9)
- Magic Find: MF bonus correctly applied to computed prices (test 10)
- Missing producesItemName: graceful fallback (test 11)
- Empty potion crafts: graceful fallback (test 12)
- Reactivity: price updates when potion price changes (test 13)

### Summary

One fix needed: add missing required type fields to mock Dungeon and DungeonDrop objects in the test file (5 locations for expectedValue, 4 locations for numDrops). The logic in useRecipePricing.ts and dungeonCalculator.ts is correct and complete. All 210 tests pass.

**2026-02-27T12:06:17Z**

User Review: Perfect - all work approved

**2026-02-27T12:07:14Z**

Committed as 9269bf0: feat: add refresh item data button and dungeon pricing tests. All work complete and merged.
