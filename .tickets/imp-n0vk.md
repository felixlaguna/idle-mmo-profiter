---
id: imp-n0vk
status: closed
deps: [imp-i7r1]
links: []
created: 2026-04-15T15:48:13Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-aon1
---
# Phase 7: Simplify calculators and composables to use MasterItem directly

With the adapter layer proven and old arrays removed, refactor calculators and composables to consume MasterItem[] directly instead of going through adapters.

## 7A. Refactor calculators

### resourceCalculator.ts
Current: takes ResourceGather[]
New: takes MasterItem[] filtered to items with gathering info
Benefit: no more adapter conversion, direct access to all item data

### craftableCalculator.ts
Current: takes CraftableRecipe[], separate materialPriceMap, separate recipes for dual profitability
New: takes MasterItem[] filtered to craftable items, can resolve material prices and recipe info directly from the same array
Benefit: eliminates materialPriceMap parameter, eliminates separate recipes parameter

### dungeonCalculator.ts
Current: takes Dungeon[], Recipe[]
New: takes Dungeon[], MasterItem[] (can look up recipe data directly)
Benefit: eliminates separate Recipe[] parameter

### profitRanker.ts
May need minimal changes since it consumes calculator output types.

## 7B. Refactor composables

### useRecipePricing.ts
Current: takes recipes and craftableRecipes separately
New: takes MasterItem[], filters internally
Benefit: simpler API

### useProfitRanking.ts
Current: takes 10+ parameters
New: takes masterItems + dungeon configs + settings
Benefit: dramatically simpler interface

### useItemUses.ts
Current: builds 5 separate reverse-lookup indexes
New: single pass over masterItems to build all indexes
Benefit: simpler, faster, more maintainable

## 7C. Update useDataProvider return type

Instead of returning 7 separate array computeds + 6 price maps, return:
- masterItems (the full reactive array with overrides applied)
- dungeons
- Convenience computed properties for filtered views (e.g., craftableItems, gatherableItems)
- Price lookup still available but simplified

## 7D. Update App.vue and components

Components now receive MasterItem-based data instead of old types.

## Files to modify
- src/calculators/*.ts (4 files)
- src/composables/useDataProvider.ts
- src/composables/useRecipePricing.ts
- src/composables/useProfitRanking.ts
- src/composables/useItemUses.ts
- src/App.vue
- src/components/*.vue (4 table components)
- All related test files

## Risk: Large change surface
This is the biggest phase. Consider splitting into sub-phases:
7A (calculators), 7B (composables), 7C (components).

## Acceptance Criteria

1. Adapter layer no longer needed (can be deleted)
2. Calculators consume MasterItem[] directly
3. All composables simplified
4. All components updated
5. All tests updated and passing
6. Type-safe throughout


## Notes

**2026-04-15T17:07:58Z**

Implementation complete. All 939 tests passing across 49 files.

Files modified:
- src/calculators/craftableCalculator.ts — new signature: calculateCraftableProfits(masterItems: MasterItem[], taxRate: number)
- src/calculators/dungeonCalculator.ts — new signature: calculateDungeonProfits(dungeons: Dungeon[], masterItems: MasterItem[], magicFind)
- src/composables/useRecipePricing.ts — new signature: useRecipePricing(masterItems: Ref<MasterItem[]>, taxRate: Ref<number>)
- src/composables/useProfitRanking.ts — uses masterItems directly, removed old per-type arrays
- src/composables/useItemUses.ts — builds indexes from single masterItems pass
- src/composables/useDataProvider.ts — removed adapter imports, added masterItems computed with override support
- src/App.vue — uses masterItemsWithComputedPrices, simplified all calculator calls
- src/tests/calculators/craftableCalculator.test.ts — fully rewritten for MasterItem API
- src/tests/calculators/dungeonCalculator.test.ts — fully rewritten for MasterItem API
- src/tests/calculators/stormbringer-bug.test.ts — rewritten for MasterItem API
- src/tests/composables/useMagicFindConfig.test.ts — updated mockRecipes to MasterItem format

Tests: 939 passed / 939 total (100%)
