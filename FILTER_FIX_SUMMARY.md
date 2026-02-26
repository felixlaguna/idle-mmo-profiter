# Filter & Ranking Sync Bug Fix - Summary

## Issues Fixed

### 1. Disabling a filter doesn't re-rank the remaining items
**Before**: When a type filter was disabled (e.g., hiding all dungeons), the remaining visible items kept their original rank numbers (e.g., #2, #3, #5), creating gaps in the ranking.

**After**: When a type filter is disabled, the remaining visible items are re-ranked starting from #1 (e.g., #1, #2, #3), providing a continuous ranking.

### 2. Hero "Best Action" doesn't update when filters change
**Before**: The hero section at the top always showed the overall #1 best action, even if that activity type was filtered out in the table below.

**After**: The hero section now shows the best action among the currently visible/filtered activities. If dungeons are hidden and the overall #1 was a dungeon, the hero updates to show the best potion or resource.

### 3. Filter state is not persisted in localStorage
**Before**: Filter selections were lost on page reload, always resetting to show all activity types.

**After**: Filter selections are now persisted to `localStorage` with the key `idlemmo:active-filters` and restored on page reload.

---

## Implementation Details

### New File: `src/composables/useActivityFilters.ts`
Created a shared composable that:
- Manages filter state for all three activity types (dungeons, potions, resources)
- Persists state to localStorage using the existing `useStorage` composable
- Provides two filtering functions:
  - `getFilteredActivities()` - Filters but preserves original ranks
  - `getFilteredAndRerankedActivities()` - Filters AND re-ranks starting from 1

### Modified: `src/components/ProfitRankingTable.vue`
- Replaced local filter refs with shared `useActivityFilters()` composable
- Changed `filteredAndSortedActivities` to use `getFilteredAndRerankedActivities()`
- Filter toggles now automatically persist to localStorage
- Sort functionality still works correctly with filtered/re-ranked data

### Modified: `src/App.vue`
- Imported `useActivityFilters` composable and `getBestAction` function
- Changed `bestAction` from being returned by `useProfitRanking()` to a computed property
- Computed property filters ranked activities before determining the best action
- Hero section now reactively updates when filters change

---

## Testing

### Manual Test Scenarios
See `src/tests/filter-ranking-sync.test.md` for detailed test scenarios.

Quick verification steps:
1. Load the app → Verify all filters enabled by default
2. Toggle off "Dungeons" → Verify remaining items re-ranked from #1
3. Check hero section → Verify it shows best action among visible items
4. Refresh page → Verify "Dungeons" filter remains disabled
5. Try different filter combinations → Verify consistent re-ranking behavior

### Build Verification
```bash
npm run build
```
Build passes successfully with no TypeScript errors.

---

## Files Changed

1. **NEW**: `src/composables/useActivityFilters.ts` - Shared filter state management
2. **NEW**: `src/tests/filter-ranking-sync.test.md` - Manual test scenarios
3. **MODIFIED**: `src/components/ProfitRankingTable.vue` - Uses shared filters with re-ranking
4. **MODIFIED**: `src/App.vue` - Best action reflects filtered activities

---

## Technical Notes

- Filter state is stored in localStorage as: `idlemmo:active-filters`
- Default state: `{ dungeons: true, potions: true, resources: true }`
- Re-ranking preserves the original profit-based sort order, just renumbers from 1
- Both desktop and mobile layouts remain unaffected
- Sort functionality in the table works correctly with filtered data

---

## Edge Cases Handled

1. **All filters disabled**: Shows empty state message "No activities found"
2. **Various filter combinations**: Rankings always start from #1 for visible items
3. **Sorting with filters**: Sort applies to filtered/re-ranked data correctly
4. **localStorage quota**: Uses existing error handling from `useStorage` composable

---

## Future Considerations

- Could add a "Reset Filters" button if users want to quickly return to default state
- Could show filter state indicator in hero section (e.g., "Best Action (filtered)")
- Could track filter analytics to see which activity types users focus on
