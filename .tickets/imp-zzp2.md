---
id: imp-zzp2
status: closed
deps: []
links: []
created: 2026-03-04T17:38:08Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mshp
---
# Phase 1: Data layer - MF-only dungeons and completed dungeons storage

## Goal
Add the 6 MF-only dungeon names to the data layer and create localStorage-backed storage for completed dungeon selections.

## Files to Create/Modify

### NEW: src/composables/useMagicFindConfig.ts
A composable that encapsulates all Magic Find UI state. This is the central data hook for the feature.

- **completedDungeons**: `Ref<Set<string>>` persisted via useStorage (key: 'completedDungeons', stored as array, loaded into Set)
- **MF_ONLY_DUNGEONS**: constant array of 6 extra dungeon names: Silverleaf Enclave, Stone Hollow, Pumpkin Hollow, Wickedroot Patch, Winter Wonderland, Snowbound Forest
- **allSelectableDungeons**: computed that merges dungeon names from useDataProvider().dungeons with MF_ONLY_DUNGEONS (sorted alphabetically)
- **dungeonMF**: computed that returns completedDungeons.value.size (each completed dungeon = +1 MF)
- **toggleDungeon(name: string)**: add/remove from completedDungeons set, trigger reactivity
- **totalMF**: computed that sums magicFind.streak + dungeonMF + magicFind.item + magicFind.bonus (reads streak/item/bonus from useStorage('magicFind'))
- Singleton pattern (matching useActivityFilters.ts pattern with module-level state)

### MODIFY: src/types/index.ts
No changes needed -- MagicFindSettings already has the 4 fields (streak, dungeon, item, bonus). The dungeon field will now be auto-computed from completedDungeons.

## Key Decisions
- Store completed dungeons as a string array in localStorage (serializable), convert to Set in memory for O(1) lookups
- The composable owns the mapping: completedDungeons.size -> magicFind.dungeon
- The composable must write back to the existing useStorage('magicFind') ref so that the dungeonCalculator picks up the updated dungeon MF value automatically
- The 6 MF-only dungeons are hardcoded constants (not in defaults.json) since they have no profit data

## Acceptance Criteria
- [ ] useMagicFindConfig composable created with all described reactive state
- [ ] completedDungeons persisted to localStorage and survives page reload
- [ ] dungeonMF correctly returns count of completed dungeons
- [ ] totalMF correctly sums all 4 MF components
- [ ] allSelectableDungeons returns merged + sorted list of all 18 + 6 = 24 dungeon names
- [ ] Writing dungeonMF back to magicFind.dungeon causes profit recalculation

## Acceptance Criteria

Composable created, completedDungeons persists, dungeonMF auto-calculates, totalMF sums correctly


## Notes

**2026-03-04T17:45:23Z**

Implementation complete. Files created:

/home/felix/idle-mmo-profiter/src/composables/useMagicFindConfig.ts - Main composable with:
- completedDungeons: Ref<Set<string>> persisted to localStorage
- MF_ONLY_DUNGEONS: 6 hardcoded MF-only dungeon names
- allSelectableDungeons: computed (18 profit dungeons + 6 MF-only dungeons, sorted)
- dungeonMF: computed (count of completed dungeons)
- totalMF: computed (streak + dungeon + item + bonus)
- toggleDungeon(), isDungeonCompleted(), clearCompletedDungeons() methods
- Writes back to magicFind.dungeon automatically for profit calculator

/home/felix/idle-mmo-profiter/src/tests/composables/useMagicFindConfig.test.ts - Comprehensive unit tests (27 tests, all passing)

All tests passing (511/511).

The composable is a singleton pattern matching useActivityFilters.ts. It syncs completedDungeons to localStorage as an array, loads it into a Set, and auto-updates magicFind.dungeon for the dungeon calculator.
