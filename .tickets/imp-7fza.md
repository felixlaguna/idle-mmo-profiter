---
id: imp-7fza
status: closed
deps: [imp-3dls]
links: []
created: 2026-02-27T20:23:07Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-yvyo
tags: [refactor, composables]
---
# Phase 4: Rename composables (useRecipePricing, useProfitRanking, useActivityFilters, useMarketRefresh)

## Purpose
Update all composables that reference potion types, variables, or string literals.

## Files & Renames

### A. src/composables/useRecipePricing.ts (~25 renames)
- Import: `PotionCraft` -> `CraftableRecipe`
- `interface PotionProfitMap` -> `interface CraftableProfitMap`
  - field `[potionName: string]` -> `[craftableName: string]`
- `function calculatePotionProfit(craft: PotionCraft, ...)` -> `function calculateCraftableProfit(craft: CraftableRecipe, ...)`
- `function createPotionProfitMap(potionCrafts: PotionCraft[], ...)` -> `function createCraftableProfitMap(craftableRecipes: CraftableRecipe[], ...)`
  - Internal: `const map: PotionProfitMap` -> `CraftableProfitMap`
  - Param: `potionCrafts` -> `craftableRecipes`
  - Callback body: `calculatePotionProfit` -> `calculateCraftableProfit`
- `useRecipePricing()` function:
  - param: `potionCrafts: Ref<PotionCraft[]>` -> `craftableRecipes: Ref<CraftableRecipe[]>`
  - Internal: `createPotionProfitMap(potionCrafts.value, ...)` -> `createCraftableProfitMap(craftableRecipes.value, ...)`
  - Variable: `potionProfit` -> `craftableProfit`
- All comments: "potion" -> "craftable" (except in-game names)

### B. src/composables/useProfitRanking.ts (~12 renames)
- Import: `PotionCraft` -> `CraftableRecipe`, `calculatePotionProfits` -> `calculateCraftableProfits`
- Interface param: `potionCrafts: ComputedRef<PotionCraft[]>` -> `craftableRecipes: ComputedRef<CraftableRecipe[]>`
- Internal: `currentPotionCrafts` -> `currentCraftableRecipes`
- `calculatePotionProfits(...)` -> `calculateCraftableProfits(...)`
- `potionResults` -> `craftableResults`
- `rankActivities(dungeonResults, potionResults, ...)` -> `rankActivities(dungeonResults, craftableResults, ...)`

### C. src/composables/useActivityFilters.ts (~10 renames)
- `ActivityFilters.potions` -> `ActivityFilters.craftables` (line 7)
- `filterPotions` -> `filterCraftables` (lines 13, 45-49, 88)
- `filters.value.potions` -> `filters.value.craftables` (lines 23, 46, 48, 66)
- `activity.activityType === 'potion'` -> `activity.activityType === 'craftable'` (line 66)
- DEFAULT VALUE: `potions: true` -> `craftables: true` (line 23)
- LOCALSTORAGE MIGRATION: The useStorage key 'active-filters' stores `{dungeons: true, potions: true, resources: true}`. Need to migrate the `potions` key to `craftables` key on load. Add migration at module level.

### D. src/composables/useMarketRefresh.ts (~10 renames)
- `RefreshCategory` type: `'potions'` -> `'craftables'` (line 20)
- All `case 'potions':` -> `case 'craftables':` (lines 106, 182, 253)
- `dataProvider.potions` -> `dataProvider.craftables` (lines 107, 183, 311)
- `dataProvider.updatePotionPrice` -> `dataProvider.updateCraftablePrice` (line 254)
- `category: 'potions'` -> `category: 'craftables'` (line 623)
- Comment: "Potions" -> "Craftables" (line 321)

## Acceptance Criteria
- [ ] All 4 composable files renamed
- [ ] localStorage migration for active-filters added
- [ ] No 'potion' references remain in composable layer (except in-game item names)
- [ ] TypeScript compiles without errors for composable layer


## Notes

**2026-02-27T20:34:07Z**

Phase 4 complete:

Composable renames:
1. useRecipePricing.ts: All types, functions, variables renamed (PotionCraft -> CraftableRecipe, etc.)
2. useProfitRanking.ts: Import, parameters, variables updated
3. useActivityFilters.ts: 
   - Interface updated (potions -> craftables)
   - localStorage migration added for 'active-filters'
   - All filter references updated
4. useMarketRefresh.ts: RefreshCategory type, case statements, dataProvider calls updated

TypeScript compilation: No errors in composable layer
