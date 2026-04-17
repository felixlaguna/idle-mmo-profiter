---
id: imp-o6do
status: closed
deps: []
links: []
created: 2026-03-09T08:19:28Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-acs4
---
# Phase 1: Item Uses Lookup Composable (useItemUses)

Create a composable that builds reverse-lookup indexes for item uses across all data sources.

## Files to Create
- `/home/felix/idle-mmo-profiter/src/composables/useItemUses.ts`

## Implementation Details

### Data Structures
```typescript
interface ItemUse {
  type: 'craftable-material' | 'resource-material' | 'dungeon-drop' | 'gathering-source' | 'recipe-product'
  context: string        // e.g., 'Radiant Crest (alchemy)' or 'Millstone Mines'
  detail: string         // e.g., '500x needed' or 'Cooking: Trout -> Cooked Trout'
  profitPerHour?: number // If available, to show profitability context
}

interface ItemUsesResult {
  itemName: string
  uses: ItemUse[]
  totalDemandSources: number
}
```

### Reverse-Lookup Indexes to Build (computed, reactive)
Build these from `useDataProvider()` data:

1. **materialToCraftables**: Map<materialName, CraftableRecipe[]>
   - Iterate all `craftableRecipes`, for each material, record the recipe
   - Example: Trout -> [{name: 'Radiant Crest', quantity: 500, skill: 'forging'}]

2. **materialToResourceRecipes**: Map<materialName, ResourceRecipe[]>
   - Iterate all `resourceRecipes`, for each material, record the recipe
   - Example: Trout -> [{name: 'Cooked Trout', skill: 'cooking'}]

3. **recipeNameToDungeons**: Map<recipeName, Dungeon[]>
   - Iterate all `dungeons` and their drops, record which dungeons drop each recipe
   - Example: 'Improved Fishing Rod Recipe' -> [{name: 'Millstone Mines'}]

4. **itemToGatheringSource**: Map<itemName, ResourceGather>
   - Map resource gathering entries by name
   - Example: Trout -> {skill: 'fishing', timeSeconds: ...}

5. **recipeToProduct**: Map<recipeName, {producesItemName, ...}>
   - From recipes with producesItemName set

### Main function: getItemUses(itemName: string): ItemUsesResult
- Queries all 5 indexes
- Returns combined, deduplicated results
- Includes profit/hr data where available (from calculator results)

### Performance Considerations
- All indexes are `computed` so they update reactively when data changes
- Build indexes once, not per-query
- The composable should be a singleton (same pattern as useDataProvider)

## Acceptance Criteria

- Composable created and exported
- All 5 reverse-lookup indexes built from data provider
- getItemUses() returns correct uses for test items (Trout, Coal, Iron Ore)
- TypeScript types exported for use by UI components
- Unit tests cover: material in craftable, material in resource recipe, recipe in dungeon, gathering source


## Notes

**2026-03-09T08:25:17Z**

Created useItemUses.ts composable with 5 reverse-lookup indexes:
- materialToCraftables
- materialToResourceRecipes
- recipeNameToDungeons
- itemToGatheringSource
- recipeToProduct

Main API: getItemUses(itemName) returns ItemUsesResult with all uses.
