---
id: imp-rwjb
status: closed
deps: [imp-zaea]
links: []
created: 2026-03-05T09:19:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ebbl
---
# Phase 2: Data Provider - Resource Recipes & Efficiency Storage

## Objective
Extend useDataProvider to store, load, and manage resource recipes and efficiency item data. Follow the same patterns as craftableRecipes storage.

## Changes Required

### 1. Add resource recipes to defaults.json (/home/felix/idle-mmo-profiter/src/data/defaults.json)
- Add `resourceRecipes` array with initial data (user will provide specific items later)
- Example structure: Uranium Bar = 1 Coal + 1 Uranium Ore, skill: smelting, timeSeconds: TBD
- Add `efficiencyItems` array with initial data (user will provide specific items later)
- Both can start as empty arrays `[]` until the user provides the game data

### 2. Extend useDataProvider (/home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts)

**Storage (follow craftableRecipes pattern):**
- Add `RESOURCE_RECIPES_KEY = 'idlemmo:resource-recipes'`
- Add `loadResourceRecipes()` function (like `loadCraftableRecipes()`)
- Add `saveResourceRecipes()` function (like `saveCraftableRecipes()`)

**Computed properties:**
- `resourceRecipes` computed ref (with price overrides from materialPriceMap)
- `efficiencyItems` computed ref

**CRUD methods (follow addCraftableRecipe pattern):**
- `addResourceRecipe(recipe)` - Add a new resource recipe
- `removeResourceRecipe(name)` - Remove by name
- `updateResourceRecipeTime(name, timeSeconds)` - Update craft time

### 3. Auto-generate 3 resourceGathering entries per recipe
This is the KEY transformation. For each ResourceRecipe, generate 3 ResourceGather entries:

1. **Buy All mode**: `name: 'Uranium Bar'`, cost = sum of all material market prices, time = craft time only
2. **Gather Except Coal mode**: `name: 'Uranium Bar (gather)'`, cost = coal market price only, time = craft time + gathering time for non-coal materials  
3. **Gather All mode**: `name: 'Uranium Bar (gather all)'`, cost = 0, time = craft time + gathering time for ALL materials including coal

Each mode produces the same output with the same vendorValue and marketPrice.

### 4. Extend exportAsDefaultsJson
- Include resourceRecipes in export
- Include efficiencyItems in export

## Patterns to Follow
- loadCraftableRecipes / saveCraftableRecipes pattern for persistence
- addCraftableRecipe pattern for CRUD operations
- resourceGathering computed for auto-generating entries from recipes

## Acceptance Criteria

- Resource recipes persist to localStorage
- 3 resourceGathering entries auto-generated per resource recipe
- CRUD operations work (add, remove, update time)
- Export includes resource recipes
- Existing craftable and resource functionality unchanged


## Notes

**2026-03-05T09:31:36Z**

Phase 2 implementation complete.

**Files created:**
- /home/felix/idle-mmo-profiter/src/composables/useEfficiencyConfig.ts

**Files modified:**
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts

**Implementation details:**

1. **useEfficiencyConfig.ts composable (singleton pattern):**
   - One equipped item per skill (smelting, cooking, woodcutting, mining, fishing)
   - Persists to localStorage via useStorage
   - Methods: equipItem, unequipItem, getEquippedItem, isItemEquipped, clearAllEquippedItems
   - Computed: equippedItems, equippedItemCount

2. **useDataProvider.ts extensions:**
   - Added RESOURCE_RECIPES_KEY storage constant
   - Added saveResourceRecipes() and loadResourceRecipes() functions (follows craftableRecipes pattern)
   - Loaded resourceRecipes from localStorage with lastSaleAt merging
   - Added efficiencyItems computed property
   - Added resourceRecipes computed property (with price overrides)
   
3. **Auto-generated 3 gather modes per resource recipe:**
   - resourceGatheringFromRecipes computed property generates 3 entries per ResourceRecipe:
     * Buy All: name = recipe.name, cost = sum of all material market prices
     * Gather Except Coal: name = recipe.name + ' (gather)', cost = coal market price only
     * Gather All: name = recipe.name + ' (gather all)', cost = 0
   - Merged with manual resourceGathering entries from defaults.json
   
4. **CRUD operations:**
   - addResourceRecipe(recipe) - Add new resource recipe
   - removeResourceRecipe(name) - Remove by name
   - updateResourceRecipeTime(name, timeSeconds) - Update craft time

5. **Export support:**
   - exportAsDefaultsJson() now includes resourceRecipes and efficiencyItems arrays

**Test results:**
- All 620 tests passing
- TypeScript compiles without errors

**Notes:**
- Gather time calculations are placeholder (timeSeconds = craftTime) - Phase 3 will add efficiency formula and gather time logic
- Coal detection is case-insensitive (mat.name.toLowerCase() === 'coal')
- Empty arrays in defaults.json are loaded correctly

**2026-03-05T15:48:51Z**

Post-release fix (e5bff62): 47 non-equipment efficiency items removed from defaults.json (15 consumables + 32 alchemy-recipe items). 28 equipment items remain (fishing rods, pickaxes, felling axes).
