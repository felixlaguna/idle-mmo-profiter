---
id: imp-zu2f
status: closed
deps: [imp-igop]
links: []
created: 2026-03-10T09:44:16Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mcbi
---
# Phase 2: Create useMinSalesFilter composable

## Overview
Create a new composable that manages the minimum sales/week threshold filter state, persisted to localStorage. Follow the singleton pattern used by `useLowConfidenceFilter.ts` and `useActivityFilters.ts`.

## Files to Create

### /home/felix/idle-mmo-profiter/src/composables/useMinSalesFilter.ts
- Define interface `MinSalesFilterState` with field: `minSalesPerWeek: number`
- Use `useStorage` with key `'min-sales-filter'` and default `{ minSalesPerWeek: 10 }`
- Module-level singleton pattern (same as useLowConfidenceFilter)
- Expose:
  - `minSalesPerWeek: Ref<number>` -- the current threshold (writable computed)
  - `setMinSalesPerWeek: (value: number) => void` -- setter function
  - `DEFAULT_MIN_SALES: number` -- exported constant (10)
  - `filterByMinSales: <T extends { weeklySalesVolume?: number }>(items: T[]) => T[]` -- filter function that excludes items below threshold (items with `undefined` weeklySalesVolume are NOT filtered -- this avoids filtering out resources which don't have volume data)

### /home/felix/idle-mmo-profiter/src/tests/composables/useMinSalesFilter.test.ts
- Test default value is 10
- Test persistence to localStorage
- Test filterByMinSales includes items above threshold
- Test filterByMinSales excludes items below threshold
- Test filterByMinSales includes items with undefined weeklySalesVolume (resources)
- Test filterByMinSales with threshold of 0 includes everything
- Test setter works correctly

## Design Notes
- Items with `undefined` weeklySalesVolume (resources) should always pass the filter. Resources use vendor/market dual pricing and don't have market sales tracking.
- Threshold of 0 effectively disables the filter.

## Acceptance Criteria

- Composable created with singleton pattern matching existing code style
- Default threshold is 10 sales/week
- Filter function correctly handles undefined volume (passes through)
- State persists to localStorage via useStorage
- All unit tests pass


## Notes

**2026-03-10T09:50:46Z**

Created useMinSalesFilter composable following useLowConfidenceFilter pattern:
- Default threshold: 10 sales/week
- Singleton pattern with useStorage persistence
- Items with undefined volume pass through
- Comprehensive tests (15 tests) all passing
