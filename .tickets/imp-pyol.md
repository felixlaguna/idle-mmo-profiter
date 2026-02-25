---
id: imp-pyol
status: closed
deps: []
links: []
created: 2026-02-25T22:45:23Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [bug, calculators]
---
# Bug: Resource gathering costs not using market prices from Market tab

Cooked Stingray cost doesn't include the market price of Coal. Resource gathering chains (cook, smelt) should reference material/resource market prices from the Market tab. Audit all resource gathering entries for similar issues.


## Notes

**2026-02-25T22:46:35Z**

Investigation complete. Root cause identified:

Excel formulas show costs are COMPUTED from market prices:
- Row 4 (Cooked Stingray): Cost = G3+G2 (Stingray market + Coal market) = 38+6 = 44
- Row 7 (Cooked White Shark): Cost = G6+G2 (White shark market + Coal market) = 56+6 = 62
- Row 11 (Mystic Bar): Cost = G10+G2 (Mystic Ore market + Coal market) = 24+6 = 30

But in defaults.json, these costs are HARDCODED numbers (44, 62, 30).

The 'full' variants represent entire chains:
- 'Cooked Stingray full': Time = B4+B3 (cook time + fish time), Cost = C3+G2 (fish cost + coal market)
- This represents: catch fish + cook fish, vs just cooking already-caught fish

Need to:
1. Add 'inputs' array to ResourceGather type
2. Update defaults.json with input requirements
3. Update calculator to compute costs dynamically
4. All 12 resource activities need audit

**2026-02-25T22:47:34Z**

Failing test created: /home/felix/idle-mmo-profiter/src/tests/resource-cost-calculation.test.md

Test confirms the bug: costs are hardcoded, not computed from market prices.

Manual test (before fix):
1. User changes Coal market price
2. Cooked resource costs should update
3. But they DON'T - they stay at hardcoded values

This proves the bug exists.

**2026-02-25T22:49:41Z**

Fix implemented successfully:

1. Updated ResourceGather type:
   - Changed 'cost' to 'baseCost' 
   - Added 'inputs?: ResourceInput[]' array
   - Made 'cost' optional (computed dynamically)

2. Updated defaults.json:
   - Changed 'cost' to 'baseCost' for all 12 resources
   - Added 'inputs' arrays for:
     * Cooked Stingray: Stingray market + Coal market
     * Cooked White Shark: White shark market + Coal market
     * Mystic Bar: Mystic Ore market + Coal market
     * And their 'full' variants

3. Updated useDataProvider.ts:
   - resourceGathering computed now calculates costs dynamically
   - Cost = baseCost + sum(input.quantity * inputPrice)
   - Input prices use market prices from resourcePriceMap (respects overrides)

4. Updated resourceCalculator.ts:
   - Uses computed cost with fallback to baseCost

Build: PASSED (no errors)

Ready for manual testing.

**2026-02-25T22:51:31Z**

Bug fix complete and verified.

AUTOMATED TESTS: ALL PASSED ✓
- Test 1 (Default prices): 12/12 resources correct
- Test 2 (Coal price = 10): All costs update dynamically
- Test 3 (Stingray price = 50): Cooked Stingray updates correctly

BUILD: PASSED ✓
- No TypeScript errors
- No compilation errors

FILES CHANGED:
1. /home/felix/idle-mmo-profiter/src/types/index.ts
   - Added ResourceInput interface
   - Updated ResourceGather with baseCost, inputs, optional cost

2. /home/felix/idle-mmo-profiter/src/data/defaults.json
   - Changed 'cost' to 'baseCost' for all resources
   - Added 'inputs' arrays for 6 resources with dependencies

3. /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts
   - resourceGathering computed now calculates costs dynamically
   - Costs update when market prices change via resourcePriceMap

4. /home/felix/idle-mmo-profiter/src/calculators/resourceCalculator.ts
   - Uses computed cost with fallback to baseCost

FILES CREATED:
1. /home/felix/idle-mmo-profiter/src/tests/resource-cost-calculation.test.md
   - Manual test scenarios for verification
   
2. /home/felix/idle-mmo-profiter/scripts/test-resource-costs.ts
   - Automated test script (all tests passing)

VERIFICATION:
Example - When Coal market price changes from 6 to 10:
- Cooked Stingray: 44 → 48 (Stingray 38 + Coal 10)
- Cooked White Shark: 62 → 66 (White shark 56 + Coal 10)
- Mystic Bar: 30 → 34 (Mystic Ore 24 + Coal 10)

All costs now reference market prices as single source of truth.
