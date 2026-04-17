---
id: imp-gko5
status: closed
deps: [imp-xjox]
links: []
created: 2026-04-15T15:46:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-aon1
---
# Phase 2: Convert existing defaults.json arrays into unified format

Create a one-time conversion script that reads the existing arrays in defaults.json and merges them into a single masterItems array. This is a conversion of existing data, not a fresh generation.

## 2A. Conversion script (scripts/migrate-to-unified.ts)

Read current defaults.json arrays and convert into masterItems by:
1. Start with allItems (891 items) as the base catalog
2. Enrich with data from each existing array:
   - materials: set marketPrice, vendorValue, hashedId, lastSaleAt, weeklySalesVolume
   - resources: set marketPrice, vendorValue, hashedId
   - resourceGathering: add gathering info (timeSeconds, baseCost, skill)
   - resourceRecipes: add craftingRecipe info (timeSeconds, skill, materials)
   - craftableRecipes: add craftingRecipe info (timeSeconds, skill, materials, currentPrice)
   - recipes: add recipe info (chance, uses, producesItemName, isUntradable, etc.)
   - dungeons: add dungeonDrops references
3. Handle items NOT in allItems (create new entries)
4. Assign categories based on which arrays the item appeared in
5. Validate: no data loss compared to original

## 2B. New defaults.json structure

```json
{
  "masterItems": [...],
  "dungeons": [...],
  "efficiencyItems": [...],
  "magicFindDefaults": {...},
  "marketTaxRate": 0.12
}
```

Note: dungeons stay separate because they are activity configs, not items. Their drops reference masterItems by name.

## 2C. Validation step

Script must:
- Print count of items migrated per category
- Warn about any data that could not be mapped
- Verify no existing item names are lost
- Produce a diff report showing what changed

## 2D. Update DefaultData type

Add masterItems to the DefaultData interface (alongside old arrays for backward compat during transition):
```typescript
export interface DefaultData {
  // New unified format
  masterItems?: MasterItem[]
  // Legacy arrays (kept during transition)
  materials: Material[]
  ...
}
```

## Files to create/modify
- CREATE: scripts/migrate-to-unified.ts
- MODIFY: src/types/index.ts (add masterItems to DefaultData)
- GENERATE: src/data/defaults.json (add masterItems array)

## Acceptance Criteria

1. Migration script runs successfully and produces masterItems array
2. No data loss: every item from every old array is represented in masterItems
3. DefaultData type updated with optional masterItems field
4. defaults.json contains both old arrays AND new masterItems (dual format)
5. Validation report shows zero data loss


## Notes

**2026-04-15T16:18:16Z**

Implementation complete.

Files created/modified:
- scripts/migrate-to-unified.ts (NEW) — conversion script reading all existing arrays and merging into masterItems via reverse adapters
- src/types/index.ts — DefaultData interface updated with optional masterItems field
- src/data/defaults.json — masterItems array added (1366 items, ~48k lines total)

Migration results:
- Total masterItems: 1366
- 38 items appeared in multiple arrays (all correctly merged with combined categories)
- Zero data loss: all items from all source arrays represented
- Round-trip verification: NONE errors (all original array items correctly reconstructable from masterItems)

Category breakdown:
- equipment: 525 (from allItems types like SWORD, SHIELD, etc.)
- recipe: 370 (from recipes array)
- craftable: 311 (from craftableRecipes)
- raw-material: 112 (materials + allItems CRAFTING_MATERIAL/ORE/FISH)
- gathered-resource: 47 (resources + resourceGathering merged)
- cooked: 14
- smelted: 9
- crafted-resource: 9

Tests: 922/922 passed (1 skipped), lint clean
