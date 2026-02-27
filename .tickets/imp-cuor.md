---
id: imp-cuor
status: closed
deps: [imp-im87]
links: []
created: 2026-02-27T11:31:15Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-kb81
---
# Phase 3: Add unit tests for dungeon pricing of untradable limited-use recipes

Write comprehensive tests that verify the end-to-end flow: untradable recipe with limited uses -> computed dungeon price based on potion profit.

Test file: /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts (new file)

Tests to write:

1. Test: Untradable recipe with uses and producesItemName gets computed price
   - Create a recipe: isUntradable=true, uses=10, producesItemName='TestPotion', price=0
   - Create matching potionCraft for 'TestPotion' with known material costs and market price
   - Run useRecipePricing -> verify price = uses * potionProfit
   - Run calculateDungeonProfits with the computed recipe -> verify expectedValue uses the computed price

2. Test: Negative potion profit results in dungeon price of 0
   - Create a recipe: isUntradable=true, uses=10, producesItemName='UnprofitablePotion'
   - Create potionCraft where material cost > sell price after tax
   - Verify computed price = 0 (not negative)

3. Test: Untradable recipe WITHOUT uses is not affected (price stays 0)
   - Create a recipe: isUntradable=true, no uses field
   - Verify price remains 0

4. Test: Tradable recipe is not affected by this logic
   - Create a regular tradable recipe with a market price
   - Verify price stays as the market price

5. Test: Untradable recipe with unlimited uses (uses=0 or undefined) is not affected
   - Verify the condition requires uses > 0

Files to create:
- /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts

Files to reference:
- /home/felix/idle-mmo-profiter/src/tests/calculators/potionCalculator.test.ts (for test patterns)
- /home/felix/idle-mmo-profiter/src/composables/useRecipePricing.ts
- /home/felix/idle-mmo-profiter/src/calculators/dungeonCalculator.ts

## Acceptance Criteria

All tests pass. Tests cover: positive profit, negative profit (floor at 0), no uses, tradable recipe unaffected, and uses=0 case.


## Notes

**2026-02-27T11:58:36Z**

Unit tests implementation complete - ALL tests passing.

Created: /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts

Test coverage (13 tests):
✓ useRecipePricing - computed price calculation (6 tests):
  - Computes price for untradable recipe with uses and producesItemName
  - Sets price to 0 when potion profit is negative
  - Does not compute price for untradable recipe without uses field
  - Does not compute price for untradable recipe with uses = 0
  - Does not affect tradable recipes with market price
  - Does not compute price when producesItemName doesn't match any potion

✓ calculateDungeonProfits - integration (5 tests):
  - Uses computed price in dungeon expected value calculation
  - Correctly calculates dungeon profit with multiple drops (mixed tradable/untradable)
  - Handles dungeon with untradable recipe that has price = 0 (negative profit)
  - Applies Magic Find bonus to computed recipe prices
  
✓ Edge cases (2 tests):
  - Handles untradable recipe with missing producesItemName
  - Handles empty potion crafts array
  - Reactively updates when potion price changes

Test results:
- New tests: 13/13 passed
- Full suite: 210/210 tests passed
- Files: 12 test files

All requirements verified:
1. Untradable + limited uses → computed price = uses × potionProfit ✓
2. Negative profit → price = 0 ✓
3. No uses or uses=0 → not computed ✓
4. Tradable recipes unaffected ✓
5. Integration with dungeon calculator ✓
