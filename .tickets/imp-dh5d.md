---
id: imp-dh5d
status: closed
deps: []
links: []
created: 2026-02-27T12:25:42Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Improved Fishing Rod uses & potion cost display with/without recipe

Two changes needed: 1) Set Improved Fishing Rod to have uses=1. 2) Make potions show cost with and without recipe, matching the style used for untradable potions.


## Notes

**2026-02-27T12:28:39Z**

## Planning Complete - Scouter Analysis

### Change 1: Improved Fishing Rod uses=1
- Scope: Data-only change
- File: src/data/defaults.json (line ~134-141, recipe rec-1)
- Simply add "uses": 1 to the existing entry

### Change 2: All potions show dual profitability (with/without recipe cost)
- Root cause: potionCalculator.ts line 151 gates dual profitability behind hasUntradableAlternative
- Fix: Remove that gate so any potion with a tradable recipe (uses > 0) shows dual pricing
- UI already data-driven: PotionTable.vue reads hasRecipeCost flag and renders tooltip + expanded section

### Affected files (in order of change)
1. src/data/defaults.json - add uses=1 to rec-1
2. src/calculators/potionCalculator.ts - remove hasUntradableAlternative condition (line 151), clean up dead code (potionsWithUntradableRecipe set, lines 73-84 and 132)
3. src/tests/calculators/potionCalculator.test.ts - invert one test expectation, add edge case test
4. src/components/PotionTable.vue - NO changes needed (verification only)

### Files NOT affected (confirmed safe)
- src/types/index.ts - PotionProfitResult type unchanged
- src/composables/useRecipePricing.ts - only handles untradable recipe pricing for dungeons, unrelated
- src/composables/useDataProvider.ts - data layer unchanged
- src/App.vue - already passes dataProvider.recipes.value to calculatePotionProfits

### Dependency chain
Phase 1 (data) -> Phase 2 (calculator logic) -> Phase 3 (tests) -> Phase 4 (UI verification)

### Risks
- Low risk: The field naming in PotionProfitResult (profitWithRecipeCost actually stores WITHOUT-recipe values) is confusing but pre-existing. Documented in Phase 2 design notes.
- Recipes with uses=0 will NOT trigger dual profitability (uses > 0 check remains). This matches the existing pattern where uses=0 means unlimited/untracked uses.

### Task count: 4 tickets created
- imp-i32r: Phase 1 (data change)
- imp-i7zb: Phase 2 (calculator logic)
- imp-gfx5: Phase 3 (tests)
- imp-k655: Phase 4 (UI verification)

Ready for user approval.

**2026-02-27T12:31:55Z**

Implementation complete - All 4 phases finished successfully

Files modified:
- /home/felix/idle-mmo-profiter/src/data/defaults.json - Added uses=1 to rec-1 (Improved Fishing Rod Recipe)
- /home/felix/idle-mmo-profiter/src/calculators/potionCalculator.ts - Removed untradable-only gate, cleaned up dead code
- /home/felix/idle-mmo-profiter/src/tests/calculators/potionCalculator.test.ts - Updated tests for new behavior, added uses=0 edge case test

Tests: All 6 potionCalculator tests passing
UI: PotionTable.vue already fully data-driven, no changes needed

The feature now works as follows:
- Any potion with a tradable recipe that has uses > 0 shows dual profitability (profit with/without recipe cost)
- Improved Fishing Rod Recipe now has uses=1, which triggers dual profitability for any potions it produces
- UI automatically displays ⓡ indicator, tooltips, and expanded recipe cost sections for all eligible potions

**2026-02-27T12:33:39Z**

## Code Review: APPROVED

Files reviewed:
- /home/felix/idle-mmo-profiter/src/data/defaults.json
- /home/felix/idle-mmo-profiter/src/calculators/potionCalculator.ts
- /home/felix/idle-mmo-profiter/src/tests/calculators/potionCalculator.test.ts
- /home/felix/idle-mmo-profiter/src/components/PotionTable.vue (UI verification)

### Linter: PASS
- ESLint: No errors or warnings on TypeScript files (JSON file correctly excluded from lint config)

### TypeScript: PASS
- vue-tsc --noEmit: Clean, no type errors

### Tests: PASS (211/211)
- All 12 test files passing
- All 6 potionCalculator tests passing (including new uses=0 edge case)
- No regressions in any other test suite

### Style Guide: Compliant
- Naming conventions followed throughout
- JSDoc comment block on calculatePotionProfits properly updated to reflect new behavior
- Test file header comments updated to match new dual profitability criteria
- Type annotations present and correct (Recipe.uses is optional number, matching defaults.json usage)

### Change-by-Change Review

**1. defaults.json (rec-1 Improved Fishing Rod Recipe)**
- Added "uses": 1 -- correct placement, valid JSON, matches Recipe type definition
- Trailing comma and formatting consistent with rest of file

**2. potionCalculator.ts**
- Removed potionsWithUntradableRecipe set and hasUntradableAlternative variable -- dead code fully cleaned up
- Removed untradable recipe tracking in the forEach loop -- clean removal, no orphaned code
- Simplified dual profitability condition from (tradableRecipe && uses > 0 && hasUntradableAlternative) to (tradableRecipe && uses > 0) -- correct and minimal
- JSDoc updated to accurately describe the new behavior
- Grep confirms zero remaining references to removed identifiers (potionsWithUntradableRecipe, hasUntradableAlternative)
- No magic numbers, no hardcoded values
- Error handling unchanged (correctly relies on optional chaining via && checks)

**3. potionCalculator.test.ts**
- Existing test for tradable+untradable combo unchanged (still validates the happy path)
- Test "should NOT apply recipe cost when potion has ONLY tradable recipe" correctly flipped to "should apply recipe cost" with updated assertions
- New edge case test for uses=0 with clear comment explaining semantics (unlimited/untracked)
- Test data uses distinct recipe IDs (rec-999, rec-998) avoiding conflicts
- All assertions check the full contract: hasRecipeCost, profitWithRecipeCost, profitPerHourWithRecipeCost, recipeCostPerCraft

**4. PotionTable.vue (UI verification)**
- No changes needed -- confirmed data-driven, reads hasRecipeCost flag and optional fields
- Tooltip and expanded section both render conditionally on hasRecipeCost
- Will automatically show dual pricing for all potions that now qualify

### No Issues Found
All changes are clean, correct, complete, and consistent with the codebase style. Ready for user review.

**2026-02-27T12:41:36Z**

User Review: Perfect - work approved
