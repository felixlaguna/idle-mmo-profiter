---
id: imp-gfx5
status: closed
deps: [imp-i7zb]
links: []
created: 2026-02-27T12:27:34Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-dh5d
---
# Phase 3: Update potionCalculator tests for new dual profitability scope

Update existing tests in src/tests/calculators/potionCalculator.test.ts to match the new behavior where dual profitability triggers for ANY potion with a tradable recipe that has uses > 0 (not just potions that also have an untradable alternative).

File to modify:
- src/tests/calculators/potionCalculator.test.ts

Tests to update:

1. Test: 'should NOT apply recipe cost when potion has ONLY tradable recipe (no untradable alternative)' (line 65-97)
   - INVERT the expectation: this should now SHOW dual profitability
   - Rename to: 'should apply recipe cost when potion has tradable recipe with uses > 0 (even without untradable alternative)'
   - Change expects:
     * result.hasRecipeCost -> true
     * result.profitWithRecipeCost -> toBeDefined()
     * result.profitPerHourWithRecipeCost -> toBeDefined()
     * result.recipeCostPerCraft -> toBe(10000 / 10) = 1000

2. Existing test: 'should apply recipe cost when potion has both tradable AND untradable recipes' (line 29-63)
   - Should continue to pass without changes (still valid)

3. Existing test: 'should NOT apply recipe cost when potion has no recipes at all' (line 99-107)
   - Should continue to pass without changes

4. Existing test: 'should NOT apply recipe cost when potion has ONLY untradable recipe' (line 109-129)
   - Should continue to pass without changes (untradable recipe has price=0, so it doesn't enter the tradable map)

5. Optional new test: 'should NOT apply recipe cost when tradable recipe has uses=0'
   - Create a test with a tradable recipe with uses=0 to verify it is excluded

## Acceptance Criteria

1. All updated tests pass (npm run test)
2. The inverted test correctly validates dual profitability for tradable-only potions
3. All other existing tests still pass without modification


## Notes

**2026-02-27T12:31:24Z**

Updated potionCalculator tests:
- Updated top-level comment to reflect new dual profitability behavior
- Renamed test 'should NOT apply...' to 'should apply recipe cost...'
- Inverted expectations: hasRecipeCost=true, profitWithRecipeCost defined
- Added new test for uses=0 edge case (should NOT apply recipe cost)
All 6 potionCalculator tests passing
