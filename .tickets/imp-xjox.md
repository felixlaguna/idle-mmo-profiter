---
id: imp-xjox
status: closed
deps: []
links: []
created: 2026-04-15T15:46:36Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-aon1
---
# Phase 1: Design unified item type and adapter layer

Design the new unified MasterItem type and create an adapter layer that converts from the new format to old formats. This lets us change the data model without breaking any downstream consumers.

## 1A. Design the MasterItem interface (src/types/index.ts)

```typescript
export type ItemCategory = 'raw-material' | 'gathered-resource' | 'smelted' | 'cooked' | 'crafted-resource' | 'craftable' | 'recipe' | 'dungeon' | 'equipment' | 'efficiency-item'

export interface GatheringInfo {
  timeSeconds: number
  baseCost: number
  skill: ResourceSkill
  inputs?: ResourceInput[]
}

export interface CraftingRecipeInfo {
  timeSeconds: number
  skill: ResourceSkill | 'alchemy' | 'forging'
  materials: CraftableMaterial[]
}

export interface DungeonDropInfo {
  dungeonName: string
  expectedValue: number
}

export interface RecipeInfo {
  chance: number
  uses?: number
  producesItemName?: string
  producesItemHashedId?: string
  producesItemVendorValue?: number
  isUntradable?: boolean
  tradableCounterpartId?: string
}

export interface MasterItem {
  id: string
  name: string
  hashedId?: string
  categories: ItemCategory[]

  // Market data
  marketPrice: number
  vendorValue: number
  lastUpdated?: string
  suggestedRefreshMinutes?: number
  lastSaleAt?: string
  weeklySalesVolume?: number

  // Obtainment methods (optional, present if applicable)
  gathering?: GatheringInfo
  craftingRecipe?: CraftingRecipeInfo
  recipe?: RecipeInfo
  dungeonDrops?: DungeonDropInfo[]
}
```

## 1B. Create adapter functions (src/data/adapters.ts)

Create functions that convert MasterItem[] into the old array formats:
- toResources(items: MasterItem[]): Resource[]
- toResourceGathering(items: MasterItem[]): ResourceGather[]
- toResourceRecipes(items: MasterItem[]): ResourceRecipe[]
- toMaterials(items: MasterItem[]): Material[]
- toCraftables(items: MasterItem[]): Craftable[]
- toRecipes(items: MasterItem[]): Recipe[]
- toCraftableRecipes(items: MasterItem[]): CraftableRecipe[]
- toDungeons(items: MasterItem[], dungeonConfigs: DungeonConfig[]): Dungeon[]

## 1C. Write comprehensive tests for adapters

Test that round-tripping (old -> master -> old) produces identical data.

## Key decisions
- MasterItem uses marketPrice (not price) as the canonical price field
- categories is an array because items can be multiple things (e.g., Coal is both a raw-material and a gathered-resource)
- dungeons remain as a separate config (they are not items), but dungeon drops reference MasterItem by name
- Adapter layer is the safety net: all existing code continues to consume old types via adapters

## Acceptance Criteria

1. MasterItem type defined with all necessary fields
2. Adapter functions convert MasterItem[] to all 7 old array types
3. Unit tests verify round-trip fidelity for every array type
4. No existing code is modified yet


## Notes

**2026-04-15T16:11:58Z**

Implementation complete.

Files created/modified:
- src/types/index.ts — Added MasterItem types: ItemCategory, GatheringInfo, MasterCraftingMaterial, CraftingRecipeInfo, RecipeInfo, MasterItem (appended, no existing types removed)
- src/data/adapters.ts — NEW: forward adapters (toMaterials, toCraftables, toResources, toRecipes, toCraftableRecipes, toResourceRecipes, toResourceGathering) and reverse adapters (fromXxx) for all 7 array types
- src/tests/data/adapters.test.ts — NEW: 45 tests covering filtering, field mapping, and round-trip fidelity for all adapters

Key design decisions:
- MasterCraftingMaterial (not CraftableMaterial) used in MasterItem to support optional hashedId in resourceRecipe materials
- smelted/cooked/crafted-resource categories drive toResourceRecipes filtering; craftable drives toCraftableRecipes
- fromResourceRecipes/fromCraftableRecipes use name-based IDs since those source arrays have no id field
- vendorValue defaults to 0 in fromMaterials/fromCraftables/fromRecipes when absent (matches actual data patterns)

Tests: 922/922 passing, 49/49 files. Lint: clean.
