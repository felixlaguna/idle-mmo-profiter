---
id: imp-zaea
status: closed
deps: []
links: []
created: 2026-03-05T09:19:12Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ebbl
---
# Phase 1: Extend Types & Data Structures for Resource Recipes

## Objective
Add TypeScript types and data structures to support non-alchemy/crafting recipes (Smelting, Cooking, Woodcutting, etc.) and efficiency effects.

## Changes Required

### 1. Extend CraftableRecipe skill type (/home/felix/idle-mmo-profiter/src/types/index.ts)
- Expand `CraftableRecipe.skill` union from `'alchemy' | 'forging'` to include: `'smelting' | 'cooking' | 'woodcutting' | 'mining' | 'fishing'` (and any others the game has)
- OR: Create a new interface `ResourceRecipe` separate from CraftableRecipe if cleaner

### 2. Add ResourceRecipe type (if separate approach chosen)
```ts
interface ResourceRecipe {
  name: string                    // Output item name (e.g., 'Uranium Bar')
  timeSeconds: number             // Base craft time
  skill: ResourceSkill            // 'smelting' | 'cooking' | etc.
  materials: CraftableMaterial[]  // [{name: 'Coal', quantity: 1}, {name: 'Uranium Ore', quantity: 1}]
  currentPrice: number            // Market price of output
  vendorValue: number             // Vendor sell price
  hashedId?: string
  lastSaleAt?: string
}
```

### 3. Add EfficiencyItem type
```ts
interface EfficiencyEffect {
  skill: ResourceSkill
  efficiencyPercent: number       // e.g., 5 for 5% efficiency
}

interface EfficiencyItem {
  name: string
  hashedId: string
  effects: EfficiencyEffect[]
}
```

### 4. Add EfficiencySettings type (for storage)
```ts
interface EfficiencySettings {
  [skill: string]: string | null  // skill -> selected item name (only 1 per skill)
}
```

### 5. Extend DefaultData interface
- Add `resourceRecipes: ResourceRecipe[]` (or extend craftableRecipes)
- Add `efficiencyItems: EfficiencyItem[]` (items with skill efficiency effects)

## Decision Points
- Separate ResourceRecipe vs extending CraftableRecipe -- recommend SEPARATE to avoid breaking existing craftable logic
- Skill enum vs string union -- recommend string union for consistency with existing code

## Acceptance Criteria

- New TypeScript types compile without errors
- CraftableRecipe skill type extended or ResourceRecipe type created
- EfficiencyItem and EfficiencySettings types defined
- DefaultData interface updated
- No existing functionality broken


## Notes

**2026-03-05T09:27:11Z**

Phase 1 implementation complete. Changes made:

1. Extended types in /home/felix/idle-mmo-profiter/src/types/index.ts:
   - Added ResourceSkill type: 'smelting' | 'cooking' | 'woodcutting' | 'mining' | 'fishing'
   - Added ResourceRecipe interface (separate from CraftableRecipe)
   - Added EfficiencyEffect interface (skill + efficiencyPercent)
   - Added EfficiencyItem interface (name, hashedId, effects[])
   - Added EfficiencySettings interface (skill -> item name mapping)
   - Extended DefaultData interface with resourceRecipes? and efficiencyItems? (optional)

2. Updated /home/felix/idle-mmo-profiter/src/data/defaults.json:
   - Added empty resourceRecipes array
   - Added empty efficiencyItems array

All acceptance criteria met:
✓ New TypeScript types compile without errors
✓ ResourceRecipe type created (separate from CraftableRecipe)
✓ EfficiencyItem and EfficiencySettings types defined
✓ DefaultData interface updated with optional new fields
✓ No existing functionality broken (all 620 tests pass)
✓ JSON is valid

Ready for Phase 2 (Data Provider & Storage).

**2026-03-05T15:48:45Z**

Post-release fix (e5bff62): Added skill field to ResourceGather type and populated it for all 32 raw resources in defaults.json (10 ores=mining, 13 fish=fishing, 9 logs=woodcutting).
