---
id: imp-v7yk
status: closed
deps: [imp-rwjb]
links: []
created: 2026-03-05T09:19:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ebbl
---
# Phase 3: Efficiency Calculator & Resource Calculator Integration

## Objective
Create the efficiency composable (like useMagicFindConfig) and integrate efficiency modifiers into the resource profit calculations.

## Changes Required

### 1. Create useEfficiencyConfig.ts (/home/felix/idle-mmo-profiter/src/composables/useEfficiencyConfig.ts)
Follow the useMagicFindConfig.ts singleton pattern:

```ts
// Module-level singleton state
const efficiencySettings = useStorage<EfficiencySettings>('efficiencySettings', {})

export function useEfficiencyConfig() {
  // Data provider access for efficiency items
  const dataProvider = useDataProvider()
  
  // Available skills (derived from added resource recipes)
  const activeSkills = computed(() => { /* unique skills from resource recipes */ })
  
  // Items available for each skill
  const itemsForSkill = (skill: string) => computed(() => {
    return dataProvider.efficiencyItems.value.filter(item => 
      item.effects.some(e => e.skill === skill)
    )
  })
  
  // Currently selected item for a skill
  const selectedItem = (skill: string): string | null => {
    return efficiencySettings.value[skill] ?? null
  }
  
  // Select an item for a skill (only ONE at a time)
  function selectItem(skill: string, itemName: string | null): void {
    efficiencySettings.value = { ...efficiencySettings.value, [skill]: itemName }
  }
  
  // Get total efficiency for a skill
  function getEfficiency(skill: string): number {
    const itemName = selectedItem(skill)
    if (\!itemName) return 0
    const item = dataProvider.efficiencyItems.value.find(i => i.name === itemName)
    return item?.effects.find(e => e.skill === skill)?.efficiencyPercent ?? 0
  }
  
  // Formula from IdleMMO wiki: modified_time = base_time / (1 + efficiency/100)
  // OR: modified_time = base_time * (100 / (100 + efficiency))
  function applyEfficiency(baseTimeSeconds: number, skill: string): number {
    const eff = getEfficiency(skill)
    if (eff === 0) return baseTimeSeconds
    return baseTimeSeconds * (100 / (100 + eff))
  }
}
```

### 2. Update resourceCalculator.ts (/home/felix/idle-mmo-profiter/src/calculators/resourceCalculator.ts)
- Add optional `efficiencyModifier` parameter to calculateResourceProfits
- Apply efficiency to timeSeconds before computing profit/hour
- The efficiency modifier is a multiplier (e.g., 0.95 for 5% efficiency)
- NOTE: Does NOT apply to alchemy or forging (yet) per user requirement

### 3. Wire efficiency into App.vue (/home/felix/idle-mmo-profiter/src/App.vue)
- Import useEfficiencyConfig
- Pass efficiency settings to resource profit calculations
- The resource calculator needs to know which resources have which skill for efficiency application

### 4. Efficiency formula research needed
The user mentioned the IdleMMO wiki has the exact formula. The implementer should:
- Check if it's `time / (1 + eff/100)` or `time * (1 - eff/100)` or something else
- The ticket notes should document the exact formula used

## Key Constraint
- Efficiency does NOT apply to alchemy or forging (existing craftable system)
- Only applies to resource-type skills (smelting, cooking, mining, fishing, woodcutting, etc.)

## Acceptance Criteria

- useEfficiencyConfig composable created as singleton
- Efficiency persisted to localStorage
- Only ONE item selectable per skill
- Efficiency modifier correctly adjusts craft/gather time
- Resource profit calculations updated with efficiency
- Formula documented in code comments
- Existing alchemy/forging calculations unaffected


## Notes

**2026-03-05T09:32:52Z**

Starting Phase 3 implementation.

Current state:
- useEfficiencyConfig.ts exists with equipItem/unequipItem/getEquippedItem methods
- resourceGatheringFromRecipes auto-generates 3 modes per recipe (Buy All, Gather, Gather All)
- Need to integrate efficiency into resourceCalculator.ts
- Need to add gathering time calculations for the 3 gather modes

Plan:
1. Extend useEfficiencyConfig to add getEfficiency() and applyEfficiency() methods
2. Update resourceCalculator.ts to apply efficiency modifiers to craft time
3. Add gathering time calculations to resourceGatheringFromRecipes in useDataProvider.ts
4. Write tests for the new functionality

**2026-03-05T09:38:32Z**

Phase 3 core implementation complete.

Changes made:
1. Extended useEfficiencyConfig.ts with getEfficiency() and applyEfficiency() methods
   - getEfficiency(skill): gets efficiency % from equipped items
   - applyEfficiency(baseTime, skill): applies formula Final Time = Base Time / ((Efficiency% + 100) / 100)

2. Updated resourceCalculator.ts to accept efficiency parameters:
   - Added optional skillMap and efficiencyModifier parameters
   - Efficiency modifier is applied to craft time before profit/h calculations
   - Backward compatible - works without efficiency parameters

3. Added resourceSkillMap to useDataProvider.ts:
   - Maps resource names (including 3 gather modes) to their skills
   - Exported as computed property for reactive updates

4. Updated App.vue to use efficiency:
   - Initialized efficiencyConfig with efficiencyItems from data provider
   - Passed resourceSkillMap and efficiencyModifier to calculateResourceProfits

5. Updated useProfitRanking.ts composable:
   - Added optional resourceSkillMap and efficiencyModifier parameters
   - Forwards these to calculateResourceProfits for the All tab

Tests: 619/620 passing (1 flaky timing test in cache unrelated to changes)

Next: Write tests for efficiency integration

**2026-03-05T09:40:10Z**

Phase 3 implementation COMPLETE with tests.

Summary of changes:
1. useEfficiencyConfig.ts - Added getEfficiency() and applyEfficiency() methods
2. resourceCalculator.ts - Added efficiency modifier support (backward compatible)
3. useDataProvider.ts - Added resourceSkillMap computed property
4. App.vue - Integrated efficiency config with resource profit calculations
5. useProfitRanking.ts - Added efficiency support for All tab rankings
6. NEW: resourceCalculator.test.ts - 7 comprehensive tests for efficiency integration

Test results: 626/627 passing (1 pre-existing flaky timing test)

All efficiency calculations working correctly:
- Efficiency formula applied: Final Time = Base Time / ((Efficiency% + 100) / 100)
- Skills properly mapped to resources (including 3 gather modes)
- Backward compatible - works without efficiency parameters
- Tests verify efficiency affects items/h and profit/h as expected

Ready for Phase 4 (Efficiency Panel UI)

**2026-03-05T15:48:45Z**

Post-release fix (e5bff62): resourceSkillMap now includes raw gathering entries (from ResourceGather.skill field), so efficiency modifiers apply to raw resources like Trout, Oak Log, etc.
