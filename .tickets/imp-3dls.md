---
id: imp-3dls
status: closed
deps: [imp-c7lc]
links: []
created: 2026-02-27T20:22:45Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-yvyo
tags: [refactor, calculators]
---
# Phase 3: Rename calculator layer

## Purpose
Rename the calculator module. This includes the file rename and all internal identifiers.

## Files & Renames

### A. File rename
- `src/calculators/potionCalculator.ts` -> `src/calculators/craftableCalculator.ts`

### B. src/calculators/craftableCalculator.ts (formerly potionCalculator.ts)
- `import type { PotionCraft, Recipe, PotionMaterial }` -> `import type { CraftableRecipe, Recipe, CraftableMaterial }`
- `interface PotionMaterialResult` -> `interface CraftableMaterialResult` (line 3)
- `function inferSkillFromMaterials(materials: PotionMaterial[])` -> `...(materials: CraftableMaterial[])`
- `interface PotionProfitResult` -> `interface CraftableProfitResult` (line 29)
  - field `materials: PotionMaterialResult[]` -> `materials: CraftableMaterialResult[]`
- `export function calculatePotionProfits(` -> `export function calculateCraftableProfits(`
  - param `potionCrafts: PotionCraft[]` -> `craftableRecipes: CraftableRecipe[]`
  - return type `PotionProfitResult[]` -> `CraftableProfitResult[]`
- All internal variable names:
  - `potionRecipeMap` -> `craftableRecipeMap`
  - `const results: PotionProfitResult[]` -> `const results: CraftableProfitResult[]`
  - Loop var `potion` -> `craftable` (in the .map callback)
  - `materialResults: PotionMaterialResult[]` -> `materialResults: CraftableMaterialResult[]`
  - `const result: PotionProfitResult` -> `const result: CraftableProfitResult`
- All comments: replace "potion" references with "craftable" (but keep in-game item names like "Alchemy potions: Cheap Vial...")

### C. src/calculators/index.ts (line 10-13)
- `import { calculatePotionProfits, type PotionProfitResult, type PotionMaterialResult } from './potionCalculator'`
  -> `import { calculateCraftableProfits, type CraftableProfitResult, type CraftableMaterialResult } from './craftableCalculator'`
- Re-export names updated accordingly

### D. src/calculators/profitRanker.ts
- `import type { PotionProfitResult } from './potionCalculator'` -> `import type { CraftableProfitResult } from './craftableCalculator'`
- `potionResults: PotionProfitResult[]` -> `craftableResults: CraftableProfitResult[]`
- `activityType: 'potion'` -> `activityType: 'craftable'`
- Loop var `potion` -> `craftable` in forEach
- Comment: "potions" -> "craftables"

## Acceptance Criteria
- [ ] File renamed from potionCalculator.ts to craftableCalculator.ts
- [ ] All exports renamed
- [ ] profitRanker.ts updated
- [ ] index.ts barrel re-exports updated
- [ ] No 'potion' references remain in calculator layer (except in-game item names in comments)


## Notes

**2026-02-27T20:32:45Z**

Phase 3 complete:

Calculator layer renames:
1. File renamed: potionCalculator.ts -> craftableCalculator.ts (via git mv)
2. All types renamed: PotionProfitResult -> CraftableProfitResult, PotionMaterialResult -> CraftableMaterialResult
3. Function renamed: calculatePotionProfits -> calculateCraftableProfits
4. All internal variables updated (craftable instead of potion)
5. profitRanker.ts updated: imports, parameter names, activityType 'craftable'
6. index.ts barrel exports updated

TypeScript compilation: No errors in calculator layer
Note: In-game terminology preserved (e.g., 'Alchemy potions' in comments)
