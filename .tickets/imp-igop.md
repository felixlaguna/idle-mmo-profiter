---
id: imp-igop
status: closed
deps: []
links: []
created: 2026-03-10T09:44:03Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mcbi
---
# Phase 1: Add weeklySalesVolume to RankedActivity and profitRanker

## Overview
Pass through weeklySalesVolume data from calculator results into RankedActivity so the filter can use it.

## Files to Modify

### /home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts
- Add `weeklySalesVolume?: number` field to the `RankedActivity` interface
- In `rankAllActivities()`, pass through the volume data:
  - For dungeons: use `dungeon.minDropVolume` (already computed in dungeonCalculator)
  - For craftables: use `craftable.weeklySalesVolume` (already on CraftableProfitResult)
  - For resources: leave as `undefined` (resources don't have this data -- they use vendor/market dual pricing)

### /home/felix/idle-mmo-profiter/src/tests/calculators/profitRanker.test.ts
- Add test cases verifying weeklySalesVolume is passed through correctly for dungeons, craftables, and resources

## Implementation Details
The data already exists in the calculator result types:
- `DungeonProfitResult.minDropVolume` -- minimum volume among tradable drops
- `CraftableProfitResult.weeklySalesVolume` -- volume of the finished product

The profitRanker just needs to map these into the unified `RankedActivity` type.

## Acceptance Criteria

- RankedActivity interface has weeklySalesVolume field
- rankAllActivities passes through volume data from calculator results
- Unit tests pass for all activity types
- Existing tests still pass


## Notes

**2026-03-10T09:48:34Z**

Updated profitRanker.ts:
- Added weeklySalesVolume to RankedActivity interface
- Pass through minDropVolume from dungeons
- Pass through weeklySalesVolume from craftables
- Resources remain undefined (no market sales data)

Writing tests next.

**2026-03-10T09:49:12Z**

Tests written and passing. All 19 tests pass including 5 new tests for weeklySalesVolume propagation.
