---
id: imp-hag6
status: closed
deps: [imp-zu2f]
links: []
created: 2026-03-10T09:44:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mcbi
---
# Phase 3: Integrate min sales filter into useActivityFilters

## Overview
Wire the new min sales filter into the existing activity filters composable so that the 'All Activities' ranking table respects the threshold. This is the same pattern used for the low-confidence filter.

## Files to Modify

### /home/felix/idle-mmo-profiter/src/composables/useActivityFilters.ts
- Import and instantiate `useMinSalesFilter` at module level (same pattern as `lowConfidenceFilter`)
- In `getFilteredActivities()`, add a check AFTER the existing low-confidence filter:
  ```ts
  // Filter by minimum sales volume threshold
  if (activity.weeklySalesVolume !== undefined && activity.weeklySalesVolume < minSalesFilter.minSalesPerWeek.value) {
    return false
  }
  ```
- Export `minSalesPerWeek` ref and `setMinSalesPerWeek` in the return value of `useActivityFilters` so the UI component can bind to it
- Update the `UseActivityFiltersReturn` interface to include the new exports

### /home/felix/idle-mmo-profiter/src/tests/composables/useActivityFilters.test.ts
- Add test: activities with weeklySalesVolume below threshold are filtered out
- Add test: activities with weeklySalesVolume above threshold are kept
- Add test: activities with undefined weeklySalesVolume (resources) are NOT filtered
- Add test: threshold of 0 disables the filter (includes everything)
- Add test: min sales filter combines correctly with activity type filters and low-confidence filters

## Design Notes
- The filter only applies to activities that HAVE a weeklySalesVolume value
- Resources (which have undefined weeklySalesVolume) always pass through
- This means setting a high threshold will filter dungeons/craftables with low volume but never filter resources

## Acceptance Criteria

- getFilteredActivities filters by min sales threshold
- Resources with undefined volume are not filtered
- Combined filtering with type+confidence+minSales works correctly
- All existing tests still pass
- New test cases cover the min sales filtering


## Notes

**2026-03-10T09:52:22Z**

Integrated min sales filter into useActivityFilters:
- Imported useMinSalesFilter at module level
- Applied filter after low-confidence check
- Items with undefined weeklySalesVolume pass through
- Added 5 comprehensive test cases covering combinations with type and low-confidence filters
- All 16 tests passing
