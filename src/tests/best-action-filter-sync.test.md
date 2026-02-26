# Test Plan: Best Action Should Update When Filters Change

## Test ID
`best-action-filter-sync`

## Bug Description
The "Best Action Right Now" hero section at the top of the page does NOT update when type filters are toggled in the profit ranking table. When the user disables a type filter (e.g., hides dungeons), the hero card still shows a dungeon as #1, even though it should show the best action among the FILTERED results.

## Root Cause
The `useActivityFilters()` composable creates NEW refs each time it's called, not a singleton. Both `App.vue` and `ProfitRankingTable.vue` call `useActivityFilters()`, but they get separate reactive refs. While these refs sync to the same localStorage key, Vue's reactivity system doesn't know they're connected. Changes in one component don't trigger reactivity in the other.

## Expected Behavior
1. When all filters are enabled, the hero shows the globally best action
2. When a filter is toggled off (e.g., dungeons disabled), the hero immediately updates to show the best action among remaining types (potions/resources)
3. The hero and table should ALWAYS be in sync - they both use the same filter state

## Test Cases

### Test Case 1: Initial State - All Filters On
**Given:** Page loads with all filters enabled (dungeons, potions, resources)
**When:** User views the page
**Then:**
- Hero section shows the globally best action (highest profit/hr across all types)
- Profit ranking table shows all activity types
- Hero best action matches rank #1 in the table

### Test Case 2: Disable Top Activity Type
**Given:** Hero shows a dungeon as best action (e.g., "Haunted Castle - 50000 gold/hr")
**When:** User clicks "Dungeons" filter button to disable dungeons
**Then:**
- Hero section updates IMMEDIATELY to show the best potion or resource
- Hero no longer shows "Haunted Castle"
- Hero shows the activity that is now rank #1 in the filtered table
- Profit ranking table hides all dungeons
- Hero and table rank #1 match

### Test Case 3: Re-enable Filter
**Given:** Dungeons filter is disabled, hero shows a potion as best action
**When:** User clicks "Dungeons" filter button to re-enable dungeons
**Then:**
- Hero section updates IMMEDIATELY
- If a dungeon has higher profit, hero switches back to showing that dungeon
- Profit ranking table shows dungeons again
- Hero and table rank #1 match

### Test Case 4: Multiple Filter Toggles
**Given:** All filters enabled
**When:** User performs these actions in sequence:
1. Disable dungeons
2. Disable potions
3. Re-enable dungeons
4. Disable resources
5. Re-enable all filters
**Then:**
- At each step, hero updates immediately to show the current best filtered action
- Hero always matches rank #1 in the filtered table
- No stale data or delays

### Test Case 5: Filter to Only One Type
**Given:** All filters enabled
**When:** User disables dungeons AND resources (leaving only potions enabled)
**Then:**
- Hero shows the best potion
- Table shows only potions
- Hero matches rank #1 potion in table

## Implementation Requirements

### Fix: Make useActivityFilters a True Singleton
The filter state must be stored at MODULE level, not created fresh on each call:

```typescript
// useActivityFilters.ts - BEFORE (BROKEN)
export function useActivityFilters(): UseActivityFiltersReturn {
  const filters = useStorage<ActivityFilters>('active-filters', { ... })  // NEW ref each call!
  // ...
}

// useActivityFilters.ts - AFTER (FIXED)
// Module-level singleton state
const filters = useStorage<ActivityFilters>('active-filters', {
  dungeons: true,
  potions: true,
  resources: true,
})

export function useActivityFilters(): UseActivityFiltersReturn {
  // Return the SAME filters ref to all callers
  // ...
}
```

### Verification Points
1. Both `App.vue` and `ProfitRankingTable.vue` must use the SAME reactive refs
2. Toggling a filter in the table MUST trigger reactivity in App.vue's bestAction computed
3. No polling, no manual refresh - pure Vue reactivity
4. Filter state persists to localStorage (existing behavior should not break)

## Manual Test Steps

### Setup
1. Run `npm run dev`
2. Open browser to localhost
3. Open browser DevTools console

### Test Execution
1. **Initial check:**
   - Note the activity shown in hero section (e.g., "Haunted Castle - 50000 gold/hr")
   - Note its type (dungeon/potion/resource)
   - Scroll to profit ranking table
   - Confirm hero activity matches rank #1 in table

2. **Toggle filter test:**
   - Click the filter button for the type shown in hero (e.g., "Dungeons" button)
   - Button should show inactive state (grayed out)
   - **IMMEDIATELY check hero section** - should update within 1 frame
   - Hero should now show a different activity (different type)
   - Check table - confirm rank #1 matches new hero activity

3. **Re-enable test:**
   - Click the same filter button again to re-enable
   - Button shows active state
   - Hero updates immediately
   - If that type was originally best, hero shows it again

4. **Persistence test:**
   - Toggle some filters off
   - Refresh the page (F5)
   - Filters should remain in their toggled state (localStorage persistence)
   - Hero should still respect the filter state

### Success Criteria
✅ Hero updates IMMEDIATELY when filters toggle (no delay, no manual refresh)
✅ Hero always shows rank #1 from the filtered table
✅ No console errors
✅ Filter state persists across page refreshes
✅ `npm run build` succeeds with no errors

### Failure Indicators
❌ Hero shows a dungeon even when dungeons filter is disabled
❌ Hero does not update until page refresh
❌ Hero and table rank #1 don't match
❌ Console shows reactivity warnings or errors
❌ Build fails

## Files to Modify
1. `src/composables/useActivityFilters.ts` - Make filters module-level singleton
2. This test file will verify the fix works

## Related Code
- `src/App.vue` (lines 88-95) - Computes bestAction using filters
- `src/components/ProfitRankingTable.vue` (line 23) - Uses filters to filter table
- `src/composables/useStorage.ts` - Returns new ref on each call (this is the root issue)
