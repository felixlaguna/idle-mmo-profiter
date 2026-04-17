---
id: imp-heis
status: open
deps: [imp-2fex]
links: []
created: 2026-03-09T08:06:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-m64w
---
# Phase 2: Wire taxRate through all dungeonCalculator call sites

## Summary
Update all call sites of `calculateDungeonProfits()` to pass the `taxRate` parameter.

## Changes Required

### src/composables/useProfitRanking.ts (line 89-93)
Pass `currentTaxRate` to `calculateDungeonProfits`:
```ts
const dungeonResults = calculateDungeonProfits(
  currentDungeons,
  currentRecipes,
  currentMagicFind,
  currentTaxRate   // ADD THIS
)
```

### src/App.vue (line 140-144)
Pass `marketTaxRate.value` to the direct `calculateDungeonProfits` call:
```ts
return calculateDungeonProfits(
  dataProvider.dungeons.value,
  recipesWithComputedPrices.value,
  mfSettings,
  marketTaxRate.value   // ADD THIS
)
```

## Files
- /home/felix/idle-mmo-profiter/src/composables/useProfitRanking.ts
- /home/felix/idle-mmo-profiter/src/App.vue

## Acceptance Criteria

- useProfitRanking passes taxRate to calculateDungeonProfits
- App.vue direct call passes marketTaxRate.value to calculateDungeonProfits
- No other call sites missed (verify with grep)

