---
id: imp-c7lc
status: closed
deps: [imp-t3c9]
links: []
created: 2026-02-27T20:22:26Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-yvyo
tags: [refactor, data]
---
# Phase 2: Rename data layer (defaults.json + data provider)

## Purpose
The data layer is the next foundation: the JSON schema keys and the composable that loads/exposes them.

## Files & Renames

### A. src/data/defaults.json
- Top-level key `"potions": []` -> `"craftables": []` (line 81)
- Top-level key `"potionCrafts": []` -> `"craftableRecipes": []` (line 4735)
- NOTE: In-game item names like "Frenzy Potion", "Potion of the Gods", "Protection Potion Recipe" etc. are GAME DATA and must NOT be renamed. Only structural/code keys change.

### B. src/composables/useDataProvider.ts (~80 renames)
- localStorage key: `POTION_CRAFTS_KEY` -> `CRAFTABLE_RECIPES_KEY` (line 19)
  - MIGRATION WARNING: The localStorage key value `idlemmo:potion-crafts` must be changed to `idlemmo:craftable-recipes` BUT we need migration code to read old key and write to new key on first load, then delete old key. Otherwise existing users lose their saved craftable data.
- `UserOverrides.potions` -> `UserOverrides.craftables` (line 30)
- `savePotionCrafts()` -> `saveCraftableRecipes()` (line 86)
- `loadPotionCrafts()` -> `loadCraftableRecipes()` (line 97)
- `const potions = computed(...)` -> `const craftables = computed(...)` (line 179)
- `potionPriceMap` -> `craftablePriceMap` (line 207)
- `const potionCrafts = computed(...)` -> `const craftableRecipes = computed(...)` (line 228)
- `updatePotionPrice()` -> `updateCraftablePrice()` (line 319)
- `addPotionCraft()` -> `addCraftableRecipe()` (line 634)
- `addPotion()` -> `addCraftable()` (line 668)
- `updatePotionCraftTime()` -> `updateCraftableRecipeTime()` (line 687)
- `removePotionCraft()` -> `removeCraftableRecipe()` (line 699)
- All `'potions'` string literals in category unions -> `'craftables'`
- All internal references to `defaults.value.potions` -> `defaults.value.craftables`
- All internal references to `defaults.value.potionCrafts` -> `defaults.value.craftableRecipes`
- Export object keys at bottom of file (~lines 821-862):
  `potions` -> `craftables`, `potionCrafts` -> `craftableRecipes`,
  `updatePotionPrice` -> `updateCraftablePrice`, `addPotionCraft` -> `addCraftableRecipe`,
  `updatePotionCraftTime` -> `updateCraftableRecipeTime`, `removePotionCraft` -> `removeCraftableRecipe`,
  `addPotion` -> `addCraftable`
- Category type literals throughout: `'materials' | 'potions' | 'resources' | 'recipes'` -> `'materials' | 'craftables' | 'resources' | 'recipes'`
- Exclusion stats section (~lines 580-613): rename all `potionsTotal`, `potionsExcluded` to `craftablesTotal`, `craftablesExcluded`

### C. localStorage Migration
Add a one-time migration at the top of the data provider init:
```typescript
// Migrate old localStorage keys
const oldKey = 'idlemmo:potion-crafts'
const newKey = 'idlemmo:craftable-recipes'
const oldData = localStorage.getItem(oldKey)
if (oldData && !localStorage.getItem(newKey)) {
  localStorage.setItem(newKey, oldData)
  localStorage.removeItem(oldKey)
}
```

Also migrate user-overrides: rename `potions` key to `craftables` inside the overrides JSON if present.

## Acceptance Criteria
- [ ] defaults.json keys renamed
- [ ] useDataProvider fully renamed with no 'potion' references (except in-game item name strings)
- [ ] localStorage migration code added for both keys
- [ ] TypeScript compiler happy for this file (downstream files may still error)


## Notes

**2026-02-27T20:31:18Z**

Phase 2 complete:

Data layer renames:
1. defaults.json: 'potions' -> 'craftables', 'potionCrafts' -> 'craftableRecipes'
2. useDataProvider.ts: All function names, variables, and localStorage keys renamed
3. localStorage migration code added for:
   - idlemmo:potion-crafts -> idlemmo:craftable-recipes
   - user-overrides.potions -> user-overrides.craftables
4. Export object updated with all new names

TypeScript compilation: No errors in useDataProvider.ts (other files still have expected errors)
