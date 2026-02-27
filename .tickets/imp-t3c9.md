---
id: imp-t3c9
status: closed
deps: [imp-qes7]
links: []
created: 2026-02-27T20:22:01Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-yvyo
tags: [refactor, types]
---
# Phase 1: Rename types and interfaces (src/types/index.ts)

## Purpose
The type layer is the foundation. Renaming types first causes TypeScript compilation errors everywhere downstream, which serves as a checklist for remaining renames.

## File
`src/types/index.ts`

## Renames (exact mapping)
1. `interface Potion` -> `interface Craftable` (line 11)
2. `interface PotionMaterial` -> `interface CraftableMaterial` (line 55)
3. `interface PotionCraft` -> `interface CraftableRecipe` (line 61)
   - Internal field `materials: PotionMaterial[]` -> `materials: CraftableMaterial[]` (line 64)
4. `ActivityType = 'dungeon' | 'potion' | 'resource'` -> `ActivityType = 'dungeon' | 'craftable' | 'resource'` (line 112)
5. `interface DefaultData` fields:
   - `potions: Potion[]` -> `craftables: Craftable[]` (line 149)
   - `potionCrafts: PotionCraft[]` -> `craftableRecipes: CraftableRecipe[]` (line 153)

## IMPORTANT: Do NOT rename yet in other files
After this phase, run `npx tsc --noEmit` to get a complete list of type errors. The errors are our checklist for Phase 2-6.

## Acceptance Criteria
- [ ] All 6 renames applied in src/types/index.ts
- [ ] TypeScript compiler reports errors only in downstream files (expected)
- [ ] No tests are run yet (they will break until later phases are done)


## Notes

**2026-02-27T20:27:50Z**

Phase 1 complete. All type renames applied:
1. Potion -> Craftable
2. PotionMaterial -> CraftableMaterial
3. PotionCraft -> CraftableRecipe
4. ActivityType 'potion' -> 'craftable'
5. DefaultData.potions -> craftables
6. DefaultData.potionCrafts -> craftableRecipes

TypeScript compilation shows expected errors in downstream files (calculator, composables, components, etc). This serves as our checklist for subsequent phases.
