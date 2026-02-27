---
id: imp-abvv
status: closed
deps: []
links: []
created: 2026-02-27T12:55:20Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-wwfn
---
# Phase 1: Add skill field to PotionCraft type and data layer

Add an optional 'skill' field to the PotionCraft interface and wire it through the data provider so it gets persisted to localStorage.

### Files to modify:

1. **src/types/index.ts** (line 61-70, PotionCraft interface)
   - Add: skill?: 'alchemy' | 'forging'

2. **src/composables/useDataProvider.ts** (line 634-643, addPotionCraft function)
   - Add 'skill' to the parameter type on addPotionCraft (line 634)
   - The field will flow through to potionCrafts computed (line 228-245) via the spread operator already in place

3. **src/components/MarketTable.vue** (lines 378, 504-511)
   - After line 378 (const recipeData = recipeDetails.recipe), recipeData.skill is available from the API's ItemRecipe type
   - At line 504, when building the potionCraft object, add: skill: recipeData.skill === 'alchemy' ? 'alchemy' : recipeData.skill === 'forging' ? 'forging' : undefined
   - This captures the skill from the API response and stores it with the potion craft

### No changes needed:
- defaults.json: potionCrafts array is empty in defaults (populated at runtime)
- potionCalculator.ts: skill is display-only, calculator does not need it (Phase 2 passes it through)

## Acceptance Criteria

- PotionCraft interface has optional skill field typed as 'alchemy' | 'forging'
- addPotionCraft accepts and persists skill
- MarketTable captures recipeData.skill when adding potions
- TypeScript compiles without errors
- Existing potions without skill field still work (backward compatible)


## Notes

**2026-02-27T12:59:17Z**

Phase 1 implementation complete.

Files modified:
- /home/felix/idle-mmo-profiter/src/types/index.ts - Added optional skill field to PotionCraft interface
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts - Added skill to addPotionCraft parameter type
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue - Capture recipeData.skill when adding potions

TypeScript compilation: PASSED
Build: SUCCESS
