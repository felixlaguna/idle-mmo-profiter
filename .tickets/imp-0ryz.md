---
id: imp-0ryz
status: closed
deps: [imp-td12]
links: []
created: 2026-03-10T09:44:59Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mcbi
---
# Phase 5: Wire min sales filter into App.vue bestAction computation

## Overview
Ensure the min sales threshold also affects the hero 'Best Action' display in App.vue. The bestAction computed already uses `getFilteredAndRerankedActivities` which calls `getFilteredActivities` -- so if Phase 3 is done correctly, this should work automatically. This task is to VERIFY and add a test.

## Files to Verify

### /home/felix/idle-mmo-profiter/src/App.vue
- Lines 122-129: `bestAction` computed uses `getFilteredAndRerankedActivities(rankedActivities.value)`
- Since `getFilteredAndRerankedActivities` calls `getFilteredActivities` which will now include the min sales check, the bestAction should automatically respect the threshold
- No code changes expected here -- just verify the reactive chain works

## Files to Modify (if needed)
Only if the reactive chain doesn't work automatically.

## Testing
- Manual verification: Set threshold to a high value (e.g., 100) and confirm the hero 'Best Action' changes to show an activity that meets the threshold
- The existing composable tests from Phase 3 should cover the logic

## Acceptance Criteria

- Best Action hero reflects the min sales threshold
- No manual code changes needed if reactive chain works correctly
- Manual or automated verification completed


## Notes

**2026-03-10T09:54:27Z**

Verified bestAction computation in App.vue (lines 126-129):
- bestAction = getBestAction(getFilteredAndRerankedActivities(rankedActivities))
- getFilteredAndRerankedActivities applies min sales filter via module-level singleton
- No code changes needed - reactive chain already established:
  1. minSalesThreshold ref in useMinSalesFilter
  2. useActivityFilters imports useMinSalesFilter at module level
  3. getFilteredAndRerankedActivities reads minSalesThreshold.value
  4. bestAction is computed, depends on filtered activities
- Changes to minSalesThreshold automatically trigger bestAction recalculation
