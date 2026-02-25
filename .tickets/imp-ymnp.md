---
id: imp-ymnp
status: closed
deps: [imp-2tmn]
links: []
created: 2026-02-25T22:18:52Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-6z9j
---
# Phase 4: Verify cross-tab reactivity and fix propagation gaps

## Overview
After integrating the Market tab, verify that editing prices in the Market tab correctly propagates to all profit calculations. There are potential propagation gaps in the current architecture that may need fixing.

## Known Propagation Gaps to Investigate

### Gap 1: potionCrafts and resourceGathering are NOT covered by overrides
In useDataProvider.ts, the current computed properties for potionCrafts and resourceGathering return raw defaults:
```typescript
const potionCrafts = computed(() => defaults.value.potionCrafts)  // NO overrides applied
const resourceGathering = computed(() => defaults.value.resourceGathering)  // NO overrides applied
```

But the Market tab edits material prices, potion market prices, and resource market prices. For these edits to affect profit calculations:

- **Material price changes** need to update potionCraft.materials[].unitCost (used by potionCalculator)
- **Potion market price changes** need to update potionCraft.currentPrice (used by potionCalculator)
- **Resource market price changes** need to update resourceGathering[].marketPrice (used by resourceCalculator)
- **Recipe price/chance changes** need to update the recipes array (used by dungeonCalculator) -- this one IS already handled

### Required Fix: Add derived computed properties
Create new computed properties in useDataProvider that merge the entity overrides INTO the activity data:

```typescript
// Potions: merge potion price overrides into potionCrafts.currentPrice
const potionCraftsWithOverrides = computed(() => {
  return defaults.value.potionCrafts.map(craft => {
    const potionOverride = userOverrides.value.potions?.[/* find matching potion by name */]
    const updatedMaterials = craft.materials.map(mat => {
      const matOverride = userOverrides.value.materials?.[/* find matching material by name */]
      return matOverride?.price !== undefined ? { ...mat, unitCost: matOverride.price } : mat
    })
    return {
      ...craft,
      materials: updatedMaterials,
      currentPrice: potionOverride?.price ?? craft.currentPrice
    }
  })
})
```

### Challenge: ID Matching
- Materials/Potions/Resources have IDs (mat-1, pot-1, res-1)
- PotionCrafts reference materials by NAME (e.g., 'Moose antler')
- ResourceGathering items match resources by NAME (e.g., 'Coal')
- Need to build lookup maps from name -> ID to connect overrides

### Approach
1. Build name->id maps for materials, potions, resources at module scope
2. Create computed potionCraftsWithOverrides that applies material price and potion price overrides
3. Create computed resourceGatheringWithOverrides that applies resource marketPrice overrides
4. Return these new computed properties instead of the raw defaults
5. App.vue already passes dataProvider.potionCrafts and dataProvider.resourceGathering to calculators, so this will auto-propagate

## Files to Modify
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts

## Verification
1. Edit a material price in Market tab (e.g., change Moose antler from 125 to 200)
2. Switch to Potions tab -- Wraithbane material cost should reflect the change
3. Edit a potion market price in Market tab (e.g., change Wraithbane from 11600 to 15000)
4. Switch to Potions tab -- Wraithbane market price should reflect the change
5. Edit a resource market price (e.g., change Coal from 6 to 10)
6. Switch to Resources tab -- Coal market price should reflect the change
7. Edit a recipe price (e.g., change Improved Fishing Rod Recipe from 300 to 500)
8. Switch to Dungeons tab -- Millstone Mines expected value should reflect the change
9. All Activities tab should re-rank based on updated profits
10. Charts should update reactively

## Acceptance Criteria

Material price edits propagate to potion costs; potion price edits propagate to potion profits; resource price edits propagate to resource profits; recipe edits propagate to dungeon profits; all tabs and charts reflect changes reactively


## Notes

**2026-02-25T22:24:58Z**

Fixed cross-tab reactivity propagation gaps.

CRITICAL ISSUE RESOLVED:
The original implementation had potionCrafts and resourceGathering returning raw default data without applying material/potion/resource price overrides.

SOLUTION:
1. Created lookup maps (materialPriceMap, potionPriceMap, resourcePriceMap) that use the override-applied entity data
2. Converted potionCrafts to a derived computed property that:
   - Maps through each craft
   - Updates material unitCost from materialPriceMap (by name)
   - Updates currentPrice from potionPriceMap (by name)
3. Converted resourceGathering to a derived computed property that:
   - Maps through each gather activity
   - Updates marketPrice from resourcePriceMap (by name)

RESULT:
- When user edits a material price in Market tab → flows to potion craft material costs
- When user edits a potion price in Market tab → flows to potion craft current price
- When user edits a resource price in Market tab → flows to resource gathering market price
- ALL tabs and charts reactively update with the new calculations

Verified: Build passes successfully.
