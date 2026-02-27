---
id: imp-hi4l
status: closed
deps: [imp-abvv]
links: []
created: 2026-02-27T12:55:44Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-wwfn
---
# Phase 2: Pass skill through PotionProfitResult for UI consumption

Add the skill field to PotionProfitResult so the UI (PotionTable.vue) can filter potions by skill type. Also add a deterministic fallback for potions that were added before this feature (no skill field stored).

### Files to modify:

1. **src/calculators/potionCalculator.ts**
   - Add to PotionProfitResult interface (line 10-26): skill?: 'alchemy' | 'forging'
   - In the results mapping (line 88-159), pass potion.skill through to the result object (line 125-135):
     skill: potion.skill
   - Add a helper function inferSkillFromMaterials(materials: PotionMaterial[]) that implements the fallback heuristic:
     - If any material name ends with 'Crystal', return 'forging'
     - If any material name ends with 'Vial', return 'alchemy'
     - Otherwise return undefined
   - In the result mapping, use: skill: potion.skill || inferSkillFromMaterials(potion.materials)

### Heuristic rationale:
The game has vendor-sold crafting containers at every tier:
- Alchemy potions use: Cheap Vial, Tarnished Vial, Gleaming Vial, Elemental Vial, Eldritch Vial, Arcane Vial
- Forging items use: Cheap Crystal, Tarnished Crystal, Gleaming Crystal, Elemental Crystal, Eldritch Crystal, Arcane Crystal
(See MarketTable.vue lines 14-25 VENDOR_BUY_PRICES for the full list)

### Design decision:
The inferSkillFromMaterials function is placed in potionCalculator.ts (not the UI) because:
1. It operates on the PotionMaterial data structure already available there
2. It keeps the UI layer (PotionTable.vue) simple -- just reads result.skill
3. The calculator already transforms PotionCraft -> PotionProfitResult, this is the right place to resolve/enrich

### No changes needed:
- The function signature and return type of calculatePotionProfits stay the same
- Sort order is unaffected (still sorts by profitPerHour)

## Acceptance Criteria

- PotionProfitResult has optional skill field
- skill is passed through from PotionCraft.skill when present
- Fallback heuristic correctly identifies Vial->alchemy, Crystal->forging
- Potions with neither Vial nor Crystal materials have skill=undefined
- TypeScript compiles without errors
- Existing tests still pass


## Notes

**2026-02-27T13:00:39Z**

Phase 2 implementation complete.

Files modified:
- /home/felix/idle-mmo-profiter/src/calculators/potionCalculator.ts - Added skill field to PotionProfitResult, implemented inferSkillFromMaterials() helper function, and pass skill through in result mapping

Tests: ALL PASSED (216/216)
- 5 new skill inference tests added and passing
- All existing tests still passing (no regressions)
