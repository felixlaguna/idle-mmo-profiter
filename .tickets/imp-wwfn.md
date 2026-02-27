---
id: imp-wwfn
status: closed
deps: []
links: []
created: 2026-02-27T12:47:52Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Add Alchemy/Forging sub-tabs to Potions visualization

Add two sub-tabs under all Potions sections (for visualization only): one for Alchemy and one for Forging. This is a display/UI change only - no logic changes.


## Notes

**2026-02-27T12:53:55Z**

User decisions:
1. Data source: Capture skill from API recipe data when adding potions
2. Tab layout: Two sub-tabs only (Alchemy | Forging), no 'All' tab
3. Scope: Potions tab only, other views unchanged
4. Fallback for existing potions: Check ingredients - if any ingredient name ends in 'Crystal' or 'Vial', use that as a heuristic to categorize (Crystal → Forging, Vial → Alchemy likely)

**2026-02-27T12:56:53Z**

## Planning Complete - Scouter Analysis

### Summary
Add Alchemy/Forging sub-tabs to the Potions tab. Two sub-tabs filter the PotionTable by crafting skill type. Data source: `recipeData.skill` from the API's `ItemRecipe` type. Fallback: infer from material names (Vial → alchemy, Crystal → forging).

### Architecture

**Data flow:**
```
API (ItemRecipe.skill) → MarketTable.addPotionFromRecipe → PotionCraft.skill → potionCalculator → PotionProfitResult.skill → PotionTable sub-tabs
```

**Fallback for existing potions (no skill field):**
```
PotionCraft.materials → inferSkillFromMaterials() → name ends in "Vial"? alchemy : name ends in "Crystal"? forging : undefined
```

This heuristic works because all game crafting recipes require a vendor-sold container item — Vials for alchemy, Crystals for forging (see MarketTable.vue lines 14-25 VENDOR_BUY_PRICES).

### Affected files (by phase)

**Phase 1 (imp-abvv): Data Layer** — No deps
- src/types/index.ts — Add `skill?: 'alchemy' | 'forging'` to PotionCraft
- src/composables/useDataProvider.ts — Add skill to addPotionCraft param type
- src/components/MarketTable.vue — Capture `recipeData.skill` when adding potion

**Phase 2 (imp-hi4l): Calculator** — Depends on Phase 1
- src/calculators/potionCalculator.ts — Add skill to PotionProfitResult, add inferSkillFromMaterials() fallback, pass through in results mapping

**Phase 3 (imp-k3u1): UI** — Depends on Phase 2
- src/components/PotionTable.vue — Add sub-tab navigation, filter by skill, empty state, responsive styles

**Phase 4 (imp-d36f): Tests** — Depends on Phase 2
- src/tests/calculators/potionCalculator.test.ts — 5 new tests for skill inference

### Files NOT affected (confirmed safe)
- src/App.vue — PotionTable props/events unchanged, potionProfits computed unchanged
- src/components/ProfitRankingTable.vue — All Activities tab unchanged per requirements
- src/components/charts/ — Charts unchanged per requirements
- src/data/defaults.json — potionCrafts is empty array in defaults (populated at runtime)
- src/composables/useHeatmap.ts — heatmap composable is generic, called with new filtered range
- src/api/services.ts — ItemRecipe already has skill field, no API changes needed

### Dependency chain
```
Phase 1 (imp-abvv) ──→ Phase 2 (imp-hi4l) ──→ Phase 3 (imp-k3u1)
                                             └──→ Phase 4 (imp-d36f)
```
Phase 3 (UI) and Phase 4 (tests) can be done in parallel after Phase 2.

### Risks
- **Low:** Potions added before this feature won't have `skill` stored. Mitigated by the Vial/Crystal heuristic in the calculator.
- **Low:** A potion with neither Vial nor Crystal materials would be invisible in both sub-tabs. This is unlikely for real game data (all crafting recipes use one), but documented as known behavior.
- **None:** No logic changes — this is purely additive display/data capture. Existing calculator logic, sorting, editing, and deletion are unaffected.

### Task count: 4 tickets created
- imp-abvv: Phase 1 — Data layer (skill field on PotionCraft)
- imp-hi4l: Phase 2 — Calculator (skill passthrough + fallback heuristic)
- imp-k3u1: Phase 3 — UI (sub-tab navigation in PotionTable)
- imp-d36f: Phase 4 — Tests (skill inference test coverage)

Ready for user approval.

**2026-02-27T13:03:27Z**

Implementation complete for all 4 phases.

## Summary

Successfully implemented Alchemy/Forging sub-tabs to the Potions visualization.

## Files Modified

**Phase 1 - Data Layer:**
- /home/felix/idle-mmo-profiter/src/types/index.ts
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue

**Phase 2 - Calculator:**
- /home/felix/idle-mmo-profiter/src/calculators/potionCalculator.ts

**Phase 3 - UI:**
- /home/felix/idle-mmo-profiter/src/components/PotionTable.vue

**Phase 4 - Tests:**
- /home/felix/idle-mmo-profiter/src/tests/calculators/potionCalculator.test.ts

## Features Delivered

1. Added optional skill field to PotionCraft type (alchemy | forging)
2. Capture skill from API when adding potions from Market tab
3. Implemented inferSkillFromMaterials() fallback heuristic for legacy potions
4. Pass skill through PotionProfitResult in calculator
5. Two sub-tabs (Alchemy | Forging) in PotionTable with filtering
6. Heatmap colors recalculate per active sub-tab
7. Empty state when no potions match selected sub-tab
8. Responsive design following existing filter-controls pattern
9. Comprehensive test coverage (5 new tests for skill inference)

## Test Results

ALL TESTS PASSING: 216/216
- 5 new skill inference tests: PASS
- All existing tests: PASS (no regressions)

## Build Status

TypeScript compilation: SUCCESS
Vite build: SUCCESS

Ready for production deployment.

**2026-02-27T13:03:57Z**

Implementation complete. All 4 phases done. 216/216 tests pass. Build succeeds. Files modified: types/index.ts, useDataProvider.ts, MarketTable.vue, potionCalculator.ts, PotionTable.vue, potionCalculator.test.ts

**2026-02-27T13:05:29Z**

## Code Review: NEEDS FIXES

### Files Reviewed
- /home/felix/idle-mmo-profiter/src/types/index.ts
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue
- /home/felix/idle-mmo-profiter/src/calculators/potionCalculator.ts
- /home/felix/idle-mmo-profiter/src/components/PotionTable.vue
- /home/felix/idle-mmo-profiter/src/tests/calculators/potionCalculator.test.ts

### Build & Tests
- **Tests:** PASS (216/216, including 5 new skill inference tests)
- **TypeScript (vue-tsc):** PASS
- **Vite build:** PASS
- **ESLint:** 1 pre-existing error (MouseEvent no-undef in PotionTable.vue:125), no new errors introduced

---

### Issues Found

#### Issue 1: [Bug] profitRange crashes with Math.min/max on empty array
**File:** /home/felix/idle-mmo-profiter/src/components/PotionTable.vue
**Lines:** 137-149
**Severity:** Medium
**Problem:** When `filteredPotions` is empty (which is expected when a sub-tab has no potions), `Math.min(...[])` returns `Infinity` and `Math.max(...[])` returns `-Infinity`. While this does not crash the app because the heatmap style function is never called (the table is hidden behind `v-if`), it is still a latent bug — the computed runs eagerly and produces nonsensical values. If the template or another computed ever reads `profitRange` when the list is empty, it would produce incorrect results.
**Suggestion:** Add an early return guard for the empty case:
```ts
const profitRange = computed(() => {
  if (filteredPotions.value.length === 0) {
    return { profit: { min: 0, max: 0 }, profitPerHour: { min: 0, max: 0 } }
  }
  const profits = filteredPotions.value.map(p => p.profit)
  // ...rest
})
```

#### Issue 2: [Data Loss] exportAsDefaultsJson strips the skill field from potionCrafts
**File:** /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts
**Lines:** 777-786
**Severity:** Medium
**Problem:** The `exportAsDefaultsJson()` function explicitly maps potionCrafts but only includes `name`, `timeSeconds`, `materials`, and `currentPrice`. The new `skill` field is not included in the export. If a user exports defaults.json and re-imports it, all skill data captured from the API would be lost, and the app would fall back to the heuristic inference for every potion.
**Suggestion:** Add the skill field to the export mapping:
```ts
potionCrafts: potionCrafts.value.map(craft => ({
  name: craft.name,
  timeSeconds: craft.timeSeconds,
  materials: craft.materials.map(mat => ({
    name: mat.name,
    quantity: mat.quantity,
    unitCost: mat.unitCost,
  })),
  currentPrice: craft.currentPrice,
  ...(craft.skill && { skill: craft.skill }),
})),
```

---

### Observations (Non-blocking, for awareness)

1. **Heuristic correctness:** The `inferSkillFromMaterials()` function uses `endsWith('Vial')` and `endsWith('Crystal')` which correctly matches the vendor items listed in MarketTable.vue (Cheap Vial, Tarnished Crystal, etc.). The heuristic is well-documented with a JSDoc comment and thoroughly tested. Good.

2. **Skill validation in MarketTable.vue (lines 504-507):** The ternary chain that validates `recipeData.skill` is a reasonable defensive approach to ensure only known skill values are passed through. An alternative would be a type guard or Set-based check, but the current approach is clear and concise.

3. **Sub-tab CSS matches existing patterns:** The `.sub-tab-button.active` styling uses the same green accent (`rgba(34, 197, 94, 0.2)` / `#4ade80`) consistent with the app's accent color scheme. Good.

4. **EmptyState usage is correct:** Props passed (`icon`, `title`, `description`) all match the EmptyState component's interface. Good.

5. **Type consistency:** The `'alchemy' | 'forging'` union type is consistently used across PotionCraft (types/index.ts), PotionProfitResult (potionCalculator.ts), addPotionCraft param (useDataProvider.ts), and PotionSubTab (PotionTable.vue). Good.

6. **Test coverage is solid:** The 5 new tests cover passthrough, vial inference, crystal inference, undefined fallback, and explicit-over-inferred priority. Edge cases are well-handled.

---

### Summary
Two issues must be fixed before this is ready:
1. Guard `profitRange` computed against empty `filteredPotions` array (defensive programming)
2. Include `skill` in `exportAsDefaultsJson()` to prevent data loss on export/import

Everything else looks good — types are consistent, the heuristic is correct and well-tested, the UI follows existing patterns, and all tests/build pass.

**2026-02-27T13:05:49Z**

Review: 2 issues found. 1) profitRange crashes on empty array (Math.min/max on empty). 2) exportAsDefaultsJson strips skill field. Invoking Implementer to fix.

**2026-02-27T13:07:34Z**

## Code Review (Re-review): APPROVED

### Fixes Verified

**Fix 1: PotionTable.vue profitRange empty-array guard (lines 138-144)**
Correct. When filteredPotions is empty, the computed now returns { profit: { min: 0, max: 0 }, profitPerHour: { min: 0, max: 0 } } before reaching Math.min/Math.max. This prevents the Infinity/-Infinity values that would occur with Math.min(...[]) / Math.max(...[]).

**Fix 2: useDataProvider.ts skill field in exportAsDefaultsJson (line 779)**
Correct. The mapping now includes skill: craft.skill unconditionally, which is clean because JSON.stringify automatically strips undefined values, so potions without a skill field will not produce a spurious key in the exported JSON. Functionally equivalent to the conditional spread originally suggested, but simpler.

### Checks

- **Tests:** PASS (216/216, all 12 test files pass, including 5 skill inference tests)
- **TypeScript (vue-tsc --noEmit):** PASS (no errors)
- **Vite build:** PASS (built in 2.41s, no errors)

### Files Reviewed
- /home/felix/idle-mmo-profiter/src/components/PotionTable.vue (lines 137-158)
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts (lines 777-787)

No issues found. Both fixes are correct and complete. Ready for user review.

**2026-02-27T13:08:47Z**

User feedback: Heuristic wrong. Both Vial AND Crystal ingredients → alchemy. Everything else → forging. Need to fix inferSkillFromMaterials().

**2026-02-27T13:10:37Z**

## Re-review after heuristic fix: APPROVED

### Changes Reviewed
- `src/calculators/potionCalculator.ts` — `inferSkillFromMaterials()` updated
- `src/tests/calculators/potionCalculator.test.ts` — Tests updated to match

### Verification

**Code correctness:**
1. `inferSkillFromMaterials()` (lines 20-27): Both `endsWith('Vial')` and `endsWith('Crystal')` now return `'alchemy'`. Default returns `'forging'`. Return type narrowed from `'alchemy' | 'forging' | undefined` to `'alchemy' | 'forging'`. Correct per user requirements.
2. JSDoc (lines 13-18) updated to document that Crystals are alchemy, not forging. Correct.
3. Line 155 (`potion.skill || inferSkillFromMaterials(...)`) still works correctly — `||` is appropriate since the inference can no longer return `undefined`, and an explicit `'alchemy'`/`'forging'` is always truthy.

**Test correctness (5 tests, lines 192-278):**
1. "infer alchemy from Vial material name" → expects `'alchemy'` ✅
2. "infer alchemy from Crystal material name" → expects `'alchemy'` ✅ (was the key fix)
3. "default to forging when no Vial or Crystal" → expects `'forging'` ✅ (was the other key fix)
4. "pass through skill from PotionCraft" → expects `'alchemy'` ✅ (unchanged)
5. "prefer explicit skill over inferred" → expects `'forging'` ✅ (unchanged)

### Checks
- **Tests:** 216/216 PASS (all 12 test files, including 11 potionCalculator tests)
- **TypeScript (vue-tsc --noEmit):** PASS
- **Vite build:** PASS

No issues found. Fix is correct and complete.

**2026-02-27T13:11:44Z**

User Review: Perfect - work approved
