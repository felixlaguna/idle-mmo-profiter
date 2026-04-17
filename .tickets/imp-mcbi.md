---
id: imp-mcbi
status: closed
deps: []
links: []
created: 2026-03-10T09:42:59Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Minimum sales/week threshold filter for all activities ranking

Add ability to exclude items from the all activities ranking by number of sales per week. Should be manually editable with a default minimum of 10 sales/week. Similar UX to the existing low-confidence toggle but with an editable numeric threshold.


## Notes

**2026-03-10T09:45:24Z**

## Planning Complete -- Scouter Analysis

### Data Flow Analysis
The feature requires threading sales volume data from calculator results through to the filtering layer:

1. **Data already exists in calculators:**
   - `DungeonProfitResult.minDropVolume` -- minimum weekly volume among tradable drops (computed in dungeonCalculator.ts)
   - `CraftableProfitResult.weeklySalesVolume` -- weekly volume of the finished craftable product
   - Resources do NOT have sales volume data (they use vendor/market dual pricing)

2. **Gap identified:** `RankedActivity` (profitRanker.ts) does NOT currently carry `weeklySalesVolume`. The ranker combines all activity types but drops the volume info.

3. **Filter integration point:** `useActivityFilters.ts` already filters by type and low-confidence. Adding min-sales filtering here keeps all filtering logic centralized.

### Affected Files (5 modified, 3 created)
- `/home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts` -- Add weeklySalesVolume to RankedActivity, pass through from results
- `/home/felix/idle-mmo-profiter/src/composables/useMinSalesFilter.ts` -- NEW: Composable for threshold state + localStorage persistence
- `/home/felix/idle-mmo-profiter/src/composables/useActivityFilters.ts` -- Integrate min sales filter into getFilteredActivities
- `/home/felix/idle-mmo-profiter/src/components/MinSalesThreshold.vue` -- NEW: UI component with editable number input
- `/home/felix/idle-mmo-profiter/src/components/ProfitRankingTable.vue` -- Add MinSalesThreshold to filter bar
- `/home/felix/idle-mmo-profiter/src/tests/calculators/profitRanker.test.ts` -- New test cases
- `/home/felix/idle-mmo-profiter/src/tests/composables/useMinSalesFilter.test.ts` -- NEW: Full test coverage
- `/home/felix/idle-mmo-profiter/src/tests/composables/useActivityFilters.test.ts` -- New test cases for min sales filtering

### Existing Patterns Followed
- Singleton composable pattern (useLowConfidenceFilter.ts, useActivityFilters.ts)
- useStorage for localStorage persistence
- LowConfidenceToggle.vue for UI pattern (compact inline control)
- EditableValue.vue for number input styling (no spin arrows, dark theme)

### Phases: 5 task tickets (linear dependency)
Phase 1 (imp-igop) -> Phase 2 (imp-zu2f) -> Phase 3 (imp-hag6) -> Phase 4 (imp-td12) -> Phase 5 (imp-0ryz)

### Key Design Decisions
- Resources (undefined weeklySalesVolume) always pass through the filter -- they don't have market sales data
- Default threshold: 10 sales/week (matches the 'moderate' tier boundary in salesVolume.ts)
- Threshold persisted to localStorage so it survives page reloads
- bestAction in App.vue will automatically respect the filter via the existing reactive chain (no code changes needed there)

### Risks
- NONE significant. This follows well-established patterns in the codebase.
- Minor: The profitRanker test file uses some loose types (missing required fields). New tests should be careful to include weeklySalesVolume in test data.

**2026-03-10T09:47:14Z**

User approved the plan. Starting implementation.

**2026-03-10T09:54:54Z**

## Implementation Complete

All 5 phases successfully implemented and tested.

### Files Modified (5):
- /home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts
  - Added weeklySalesVolume to RankedActivity interface
  - Pass through minDropVolume for dungeons, weeklySalesVolume for craftables
  
- /home/felix/idle-mmo-profiter/src/composables/useActivityFilters.ts
  - Import useMinSalesFilter at module level
  - Apply min sales filter after low-confidence check
  - Items with undefined volume pass through
  
- /home/felix/idle-mmo-profiter/src/components/ProfitRankingTable.vue
  - Import MinSalesThreshold component and useMinSalesFilter
  - Add MinSalesThreshold to filter controls after activity type buttons
  
- /home/felix/idle-mmo-profiter/src/tests/calculators/profitRanker.test.ts
  - Added 5 tests for weeklySalesVolume field propagation
  
- /home/felix/idle-mmo-profiter/src/tests/composables/useActivityFilters.test.ts
  - Added 5 tests for min sales filter integration

### Files Created (3):
- /home/felix/idle-mmo-profiter/src/composables/useMinSalesFilter.ts
  - Singleton composable with useStorage persistence
  - Default threshold: 10 sales/week
  - filterBySalesVolume function (undefined volumes pass through)
  
- /home/felix/idle-mmo-profiter/src/tests/composables/useMinSalesFilter.test.ts
  - 15 comprehensive tests covering all edge cases
  
- /home/felix/idle-mmo-profiter/src/components/MinSalesThreshold.vue
  - Numeric input (no spin arrows)
  - Styled to match LowConfidenceToggle
  - Responsive labels (full/short)

### Test Results:
- All 50 feature tests passing (19 + 15 + 16)
- No regressions in existing tests
- Reactive chain verified: bestAction automatically respects filter

### Key Features:
✓ Default threshold: 10 sales/week
✓ Persisted to localStorage
✓ Resources (undefined volume) pass through
✓ Filters dungeons by minDropVolume
✓ Filters craftables by weeklySalesVolume
✓ Works with type and low-confidence filters
✓ bestAction hero card automatically filtered

**2026-03-10T09:55:28Z**

Implementation complete. 50/50 tests passing. 5 files modified, 3 files created. Invoking reviewer.

**2026-03-10T09:56:57Z**

## Code Review: NEEDS FIX

### Files Reviewed
- /home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts
- /home/felix/idle-mmo-profiter/src/composables/useMinSalesFilter.ts
- /home/felix/idle-mmo-profiter/src/composables/useActivityFilters.ts
- /home/felix/idle-mmo-profiter/src/components/MinSalesThreshold.vue
- /home/felix/idle-mmo-profiter/src/components/ProfitRankingTable.vue
- /home/felix/idle-mmo-profiter/src/tests/composables/useMinSalesFilter.test.ts
- /home/felix/idle-mmo-profiter/src/tests/calculators/profitRanker.test.ts
- /home/felix/idle-mmo-profiter/src/tests/composables/useActivityFilters.test.ts

### Results
- **TypeScript:** PASS (vue-tsc --noEmit clean)
- **Tests:** PASS (672/672, 1 pre-existing skip)
- **Style Guide:** Compliant

### Issue Found (1)

#### [Bug] Low-confidence items bypass min-sales filter
**File:** /home/felix/idle-mmo-profiter/src/composables/useActivityFilters.ts
**Lines:** 129-143

**Problem:** The low-confidence check (lines 129-134) uses early return when the low-confidence toggle is ON, which causes the min-sales filter (lines 138-142) to be skipped entirely. A low-confidence dungeon with 1 sale/week will still appear even if the min-sales threshold is set to 100, as long as the 'show low confidence' toggle is enabled.

**Scenario:**
- User sets min sales threshold = 100
- User enables 'show low confidence dungeons'
- A low-confidence dungeon with weeklySalesVolume = 2 will SHOW (should be filtered out)

The early return on line 130 returns true immediately for low-confidence items when the toggle is ON, bypassing all subsequent filter checks.

**Suggested fix:** Change the low-confidence check to only \*reject\* items (return false when toggle is OFF), not to \*accept\* them (return true when toggle is ON). This way, items that pass the low-confidence check continue to be evaluated by the min-sales filter:

```typescript
// Instead of:
if (activity.activityType === 'dungeon' && activity.isLowConfidence) {
  return lowConfidenceFilter.showLowConfidenceDungeons.value
}

// Use:
if (activity.activityType === 'dungeon' && activity.isLowConfidence) {
  if (!lowConfidenceFilter.showLowConfidenceDungeons.value) return false
}
```

Same pattern for the craftable check on line 132-134. This ensures items that pass the low-confidence gate continue through to the min-sales volume check.

A test should also be added to useActivityFilters.test.ts that verifies a low-confidence item with volume below the min-sales threshold is still excluded even when the low-confidence toggle is ON.

### Positive Observations
- Singleton composable pattern is correctly followed, matching useLowConfidenceFilter.ts exactly
- useStorage integration with localStorage persistence is correct
- Type propagation through profitRanker (minDropVolume -> weeklySalesVolume for dungeons, weeklySalesVolume passthrough for craftables, undefined for resources) is correct
- MinSalesThreshold.vue correctly validates input (rejects NaN, negative values) and follows existing UI patterns (no spin arrows, responsive labels)
- Edge cases well covered in tests: threshold=0, exact threshold boundary, undefined volumes, empty arrays, singleton behavior
- v-model binding in ProfitRankingTable.vue is clean
- The filterBySalesVolume generic function in useMinSalesFilter.ts is well-typed

This must be fixed before proceeding.

**2026-03-10T09:57:13Z**

Review: 1 bug found — low-confidence early returns in useActivityFilters.ts bypass the min-sales filter. When 'show low confidence' is ON, items are immediately accepted without checking the sales threshold. Fix needed for both dungeon and craftable branches (lines 129-134). Sending back to implementer.

**2026-03-10T09:57:40Z**

Starting bug fix: Low-confidence checks bypass min-sales filter. Will change early returns to only reject (not accept) items, ensuring min-sales filter is always applied.

**2026-03-10T09:59:54Z**

Bug fix complete. Changed low-confidence checks in useActivityFilters.ts to only reject items (return false when toggle is OFF) instead of accepting items (return true when toggle is ON). This ensures items that pass the low-confidence check continue through to the min-sales filter.

Files modified:
- /home/felix/idle-mmo-profiter/src/composables/useActivityFilters.ts (lines 127-134)
  Changed from early returns (return lowConfidenceFilter.showLowConfidenceDungeons.value)
  to conditional rejects (if (!lowConfidenceFilter.showLowConfidenceDungeons.value) return false)

- /home/felix/idle-mmo-profiter/src/tests/composables/useActivityFilters.test.ts
  Added comprehensive test case 'should exclude low-confidence items with low sales volume even when low-confidence toggle is ON'
  Verifies low-confidence items with volume below threshold are excluded even when 'show low confidence' toggle is ON

Test results: 673/673 tests passing (1 skipped)
All existing tests continue to pass with the fix.

**2026-03-10T10:00:56Z**

## Code Review (Re-review): APPROVED

### Fix Verified
The low-confidence early-return bug in useActivityFilters.ts has been correctly fixed.

**Before (buggy):**
```typescript
if (activity.activityType === 'dungeon' && activity.isLowConfidence) {
  return lowConfidenceFilter.showLowConfidenceDungeons.value  // returns true, bypasses min-sales
}
```

**After (fixed, lines 131-132):**
```typescript
if (activity.activityType === 'dungeon' && activity.isLowConfidence) {
  if (!lowConfidenceFilter.showLowConfidenceDungeons.value) return false  // only rejects, falls through to min-sales
}
```

Same pattern correctly applied to the craftable branch (lines 134-135). Items that pass the low-confidence gate now continue through to the min-sales volume check on lines 138-144.

### New Test Verified
Test at line 937: 'should exclude low-confidence items with low sales volume even when low-confidence toggle is ON' covers the exact bug scenario (low-confidence ON + minSalesThreshold=100 + items with volume below threshold). Assertions correctly expect only the high-volume item to survive filtering.

### Files Reviewed
- /home/felix/idle-mmo-profiter/src/composables/useActivityFilters.ts
- /home/felix/idle-mmo-profiter/src/tests/composables/useActivityFilters.test.ts

### Results
- TypeScript: PASS (vue-tsc --noEmit clean)
- Tests: PASS (673/673 passing, 1 pre-existing skip)
- Style Guide: Compliant
- Comments: Clear inline comments explain the 'only reject, don't accept' pattern

No issues found. Ready for user review.

**2026-03-10T10:01:09Z**

Re-review: APPROVED. Bug fix verified. 673/673 tests passing, TypeScript clean. Ready for user review.

**2026-03-10T10:09:35Z**

User Review: Perfect - work approved
