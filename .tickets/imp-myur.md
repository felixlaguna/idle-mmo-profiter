---
id: imp-myur
status: closed
deps: []
links: []
created: 2026-03-24T08:16:35Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-28f5
---
# Phase 1: Implement recursive material resolution in resourceGatheringFromRecipes

Replace the flat gatherTimeMap lookup in resourceGatheringFromRecipes (useDataProvider.ts:508-594) with a recursive resolver function.

## Implementation Details

Create a helper function `resolveRecursive(materialName, quantity, excludeCoal)` that:
1. If the material is in resourceGathering (raw material like Iron Ore, Coal): return its gather time and baseCost
2. If the material is in resourceRecipes (intermediate recipe like Iron Bar): return its craft time PLUS recursively resolve all of its own materials
3. `excludeCoal` flag: when true, Coal is bought at market price instead of gathered

### Changes to resourceGatheringFromRecipes computed

**Mode 1 (Buy All)**: No change needed - already correct (buy all materials at market price)

**Mode 2 (Gather except Coal)**: For each material:
  - If material is a raw gatherable (in resourceGathering) and NOT coal: add gatherTime * qty, add baseCost * qty
  - If material is a recipe output (in resourceRecipes): add recipe craftTime * qty, then recursively resolve the recipe's own materials (excluding coal)
  - If material is coal: add coalMarketPrice * qty to baseCost (buy it)

**Mode 3 (Gather All)**: Same as Mode 2 but coal is gathered instead of bought

### Data structures needed
- `recipeMap`: Map<string, ResourceRecipe> for O(1) recipe lookup
- `gatherMap`: Map<string, ResourceGathering> for O(1) gathering lookup

### File
- src/composables/useDataProvider.ts - resourceGatheringFromRecipes computed (lines 508-594)

## Acceptance Criteria

- Iron Fitting (gather) timeSeconds = ~240.4s (was 177.7s)
- Iron Fitting (gather all) timeSeconds = ~273.1s (was 177.7s)  
- Iron Fitting (gather) baseCost = ~16.8g (3x Coal market price)
- Iron Fitting (gather all) baseCost = 0g
- Iron Fitting (buy all) unchanged at 115s / 84g
- All other existing recipes unchanged (they have no cross-recipe deps)
- Handles arbitrary recursion depth with cycle detection


## Notes

**2026-03-24T08:18:43Z**

Recursive resolver implemented in useDataProvider.ts. resolveMaterial() function handles: 1) coal exclusion at all levels, 2) raw resources (leaf), 3) sub-recipes (recursive), 4) cycle detection. Iron Fitting Gather now correctly computes 240.4s instead of 177.7s. One test fails because it expected the old wrong value - fixing in imp-rja2.
