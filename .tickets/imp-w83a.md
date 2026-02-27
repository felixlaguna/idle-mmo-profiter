---
id: imp-w83a
status: closed
deps: [imp-9viz, imp-k9eq, imp-zqje, imp-jrmb]
links: []
created: 2026-02-26T22:15:49Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-a363
---
# Phase 8: Tests for new pricing logic and dual profitability

Write comprehensive tests for all new functionality.

## Files to create/modify:
- /home/felix/idle-mmo-profiter/src/tests/calculators/potionCalculator.test.ts -- Dual profitability tests
- /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts -- Computed recipe price tests
- /home/felix/idle-mmo-profiter/src/tests/composables/useDataProvider.test.ts -- Extend with recipe pricing tests

## Test Cases:

### Untradable Recipe Pricing:
- Recipe with price=0 and uses=10, potion profit=1000 -> computed_price = 10000
- Recipe with price=0 but no linked potion -> computed_price remains 0
- Recipe with price>0 (tradable) -> price unchanged
- Computed price updates reactively when potion price changes
- Computed price updates reactively when material prices change

### Dual Profitability:
- Potion with tradable recipe: profit_without_recipe > profit_with_recipe
- recipeCostPerCraft = tradable_recipe_price / uses
- profitPerHourWithRecipeCost correctly computed
- Potion without recipe: hasRecipeCost = false, no dual profit fields
- Edge case: recipe with 1 use vs many uses

### Dungeon Calculator:
- Untradable recipe drops now contribute to expected value
- Expected value = computed_price * chance * (1 + mf/100)
- Overall dungeon profit increases when untradable recipes have computed prices

### Data Provider:
- addPotionCraft adds entry correctly
- Duplicate detection works
- Recipe-potion linking computed properties work
- User overrides for new potionCrafts persist to localStorage

## Acceptance Criteria

- All new test cases pass
- Existing tests still pass
- Good coverage of edge cases
- Tests verify reactivity chain for computed prices


## Notes

**2026-02-27T11:24:50Z**

Tests updated and all passing (197/197). potionCalculator.test.ts rewritten with correct dual profitability expectations. useDataProvider.test.ts and mock-provider.test.ts updated for empty potions array.
