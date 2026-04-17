---
id: imp-aon1
status: open
deps: []
links: []
created: 2026-04-15T15:45:50Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Refactor data model: unify multiple arrays into single master item array

Refactor the IdleMMO profit calculator's data model from 7+ separate arrays (resources, resourceGathering, resourceRecipes, materials, craftables, recipes, craftableRecipes, dungeons) into a single unified master array where each item expresses ALL its properties and relationships.

## Problem
Items like 'Iron Bar' exist in resourceRecipes but NOT in resources, so they do not appear in the Market tab. The multi-array approach causes data inconsistency, duplication, and maintenance burden. The data provider must perform complex cross-array syncing (e.g., auto-generating craftables from craftableRecipes, resolving material prices from multiple maps).

## Goal
Single master array where each item describes: what it is, market data, how to obtain it (gathering, crafting, dungeon drops), and all relationships.


## Notes

**2026-04-15T15:46:15Z**

## Scouter Analysis: Codebase Data Flow Map

### Data Arrays in defaults.json (current state)
- resources (19 items): Raw tradable items with marketPrice, vendorValue, hashedId. Drives Market tab 'resources' section.
- resourceGathering (35 items): Gathering activities. 7 overlap with resources, 28 do NOT (ores, fish, logs).
- resourceRecipes (31 items): Crafting recipes (e.g., Tin Ore -> Tin Bar). 19 NOT in resources, 12 overlap. Output NOT in resources = invisible on Market tab.
- materials (99 items): Crafting ingredient items with price, hashedId. Used by craftableRecipes.
- craftables (0 items in JSON, auto-generated at runtime): Output items from craftableRecipes. Auto-synced in useDataProvider.
- recipes (345 items): Dungeon drop recipes. Contains producesItemName, isUntradable, uses. ALL 345 are dungeon drops.
- craftableRecipes (311 items): Alchemy/forging recipes with materials, timeSeconds, skill.
- dungeons (18 items): Dungeon configs with drops referencing recipe names.
- allItems (891 items): Full game item catalog (hashedId, name, type, vendorPrice).
- efficiencyItems (28 items): Equipment with efficiency effects.

### Critical Cross-References
1. craftableRecipes materials -> materials array (by name)
2. resourceRecipes materials -> resourceGathering array (by name) -- 20 missing from materials!
3. dungeons drops -> recipes array (by recipeName)
4. recipes.producesItemName -> craftableRecipes (for untradable recipe pricing)
5. resourceGathering marketPrice -> synced from resources array by refresh script

### Affected Files (22 files)
DATA:
- src/data/defaults.json (22,688 lines)
- src/types/index.ts (267 lines)

CORE LOGIC:
- src/composables/useDataProvider.ts (1,432 lines) -- MOST COMPLEX
- src/composables/useRecipePricing.ts (143 lines)
- src/composables/useProfitRanking.ts (126 lines)
- src/composables/useItemUses.ts (263 lines)
- src/composables/useLowConfidenceFilter.ts (104 lines)
- src/composables/useMarketRefresh.ts

CALCULATORS:
- src/calculators/resourceCalculator.ts (97 lines)
- src/calculators/craftableCalculator.ts (294 lines)
- src/calculators/dungeonCalculator.ts (137 lines)
- src/calculators/profitRanker.ts (114 lines)

COMPONENTS:
- src/components/MarketTable.vue (2,969 lines) -- LARGEST
- src/components/ResourceTable.vue (856 lines)
- src/components/CraftableTable.vue (1,382 lines)
- src/components/DungeonTable.vue (888 lines)
- src/App.vue (orchestrates all data flow)

SCRIPTS:
- scripts/refresh-market-prices.ts (893 lines)

TESTS (50+ test files):
- src/tests/composables/useDataProvider.test.ts
- src/tests/calculators/craftableCalculator.test.ts
- src/tests/calculators/dungeonCalculator.test.ts
- src/tests/calculators/resourceCalculator.test.ts
- src/tests/scripts/refresh-market-prices.test.ts
- (and many more)

### Risk Areas
1. localStorage: Users have idlemmo:user-overrides, idlemmo:craftable-recipes, idlemmo:resource-recipes. Migration MUST preserve these.
2. refresh-market-prices.ts: Iterates 4 categories by structure. Must update to new schema.
3. exportAsDefaultsJson(): Reconstructs full defaults.json from runtime data. Must produce new format.
4. Multiple localStorage migrations already exist in useDataProvider (old prefix, potions->craftables, potion-crafts->craftable-recipes). New migration must coexist.
5. useItemUses builds 5 reverse-lookup indexes across all array types. Must work with new schema.

**2026-04-15T15:48:56Z**

## Planning Complete

### Architecture Decision: Adapter-First Migration Strategy

The refactor uses an ADAPTER-FIRST approach rather than big-bang:

1. Phase 1: Define new MasterItem type + adapter functions (old types -> new, new -> old)
2. Phase 2: Generate masterItems alongside existing arrays (dual format in defaults.json)
3. Phase 3: useDataProvider reads masterItems and produces old formats via adapters
4. Phase 4-5: Update scripts and expand Market tab (parallel)
5. Phase 6: Remove old arrays (point of no return)
6. Phase 7: Refactor consumers to use MasterItem directly (biggest phase)
7. Phase 8: Delete adapters and old types

### Why Adapter-First?

The adapter layer is the SAFETY NET. At any point during Phases 1-5, the app can fall back to old arrays. This means:
- Each phase is independently deployable
- No big-bang switchover risk
- Tests can verify adapter fidelity at each step
- Users see no changes until Phase 5 (Market tab expansion)

### Dependency Graph

```
Phase 1 (types + adapters)
    |
Phase 2 (migration script + dual-format JSON)
    |
Phase 3 (useDataProvider reads masterItems)
   / \
Phase 4    Phase 5
(refresh)  (Market tab)
   \ /
Phase 6 (remove old arrays -- POINT OF NO RETURN)
    |
Phase 7 (refactor consumers to use MasterItem directly)
    |
Phase 8 (cleanup)
```

### Key Numbers
- 802 unique item names across all arrays
- 891 items in allItems catalog (superset)
- 22 files affected
- 50+ test files to update
- 3 localStorage keys to migrate

### Risks
1. [HIGH] localStorage migration in Phase 6 -- existing users have overrides stored. Must detect and migrate seamlessly.
2. [MEDIUM] refresh-market-prices.ts writes directly to defaults.json -- must maintain ability to produce valid JSON in new format.
3. [MEDIUM] Phase 7 is large (touching 4 calculators, 5 composables, 5 components). Consider splitting into sub-phases.
4. [LOW] exportAsDefaultsJson() must produce new format -- used for data export feature.

### Phases ready for implementation
Phase 1 (imp-xjox) has no dependencies and can start immediately.
