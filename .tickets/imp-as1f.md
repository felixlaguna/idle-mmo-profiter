---
id: imp-as1f
status: closed
deps: []
links: []
created: 2026-02-26T19:51:11Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mpxc
---
# Phase 1: Add exportDefaultsJson utility function in useDataProvider

Create a new method on the data provider that builds a complete DefaultData JSON object with all user overrides merged in.

## What to build
Add an 'exportAsDefaultsJson()' method to the data provider (singleton in useDataProvider.ts) that:
1. Takes the current merged state (defaults + user overrides) and produces a full DefaultData object
2. For materials, potions, resources, recipes: use the already-computed arrays (which have overrides applied) -- these include user-updated prices, hashedIds, vendorValues
3. For dungeons, potionCrafts, resourceGathering: use the computed versions (potionCrafts and resourceGathering already have price overrides flowed through)
4. Include magicFindDefaults and marketTaxRate from defaults (these are not user-overridable at the JSON level)
5. Return the object as a JSON string (pretty-printed with 2-space indent)

## Key files
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts -- add exportAsDefaultsJson() method
- /home/felix/idle-mmo-profiter/src/types/index.ts -- reference DefaultData interface (no changes needed)

## Implementation notes
- The computed arrays (materials, potions, resources, recipes) already have overrides applied via applyOverrides()
- potionCrafts computed already updates material unitCost and currentPrice from price maps
- resourceGathering computed already updates marketPrice and cost from price maps
- The exported JSON must match the exact shape of src/data/defaults.json (same field names, same structure) so it can be used as a drop-in replacement
- Strip any transient/computed-only fields that are not in defaults.json (e.g., 'cost' field on resourceGathering is computed, check if it exists in defaults.json)
- For potionCrafts: the defaults.json stores material unitCost values -- the export should write back the updated unitCost values
- For resourceGathering: the defaults.json stores marketPrice -- the export should write back updated marketPrice values. The 'cost' field is NOT in defaults.json (it is computed dynamically), so omit it.

## Acceptance Criteria

- exportAsDefaultsJson() method exists on dataProvider
- Returns valid JSON string matching DefaultData schema
- User-modified prices, hashedIds, vendorValues are all reflected in the output
- PotionCraft material unitCosts reflect overridden material prices
- ResourceGathering marketPrices reflect overridden resource prices
- Output is structurally identical to src/data/defaults.json (can be used as drop-in replacement)


## Notes

**2026-02-26T19:58:27Z**

Phase 1 complete. Added exportAsDefaultsJson() method to useDataProvider.ts.

Key implementation details:
- Merges defaults.json with user overrides from localStorage
- Strips computed 'cost' field from resourceGathering (not in original JSON)
- Maintains field ordering consistent with defaults.json structure
- Updates potionCraft material unitCost from overridden material prices
- Updates resourceGathering marketPrice from overridden resource prices
- Returns pretty-printed JSON with 2-space indentation

Files modified:
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts

Build status: All TypeScript checks pass
