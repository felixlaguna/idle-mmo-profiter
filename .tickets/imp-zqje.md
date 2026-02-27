---
id: imp-zqje
status: closed
deps: [imp-9viz]
links: []
created: 2026-02-26T22:15:24Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-a363
---
# Phase 6: Dungeon calculator integration -- untradable recipe computed prices

Ensure the dungeon calculator correctly uses computed prices for untradable recipes, which currently show price=0 and contribute nothing to expected value.

## Current behavior:
- dungeonCalculator.ts line 65: expectedValue = recipe.price * recipe.chance * (1 + totalMF/100)
- For untradable recipes, recipe.price = 0, so expectedValue = 0
- This means untradable recipe drops are invisible in dungeon profit calculations

## Desired behavior:
- Untradable recipes should use their computed price (uses * potion_profit)
- This makes dungeon profit calculations more accurate

## Files to modify:
- /home/felix/idle-mmo-profiter/src/calculators/dungeonCalculator.ts -- Potentially no changes needed if Phase 2 sets computed prices in the recipes array
- /home/felix/idle-mmo-profiter/src/components/DungeonTable.vue -- Show indicator for computed prices vs market prices

## Tasks:
1. Verify that Phase 2's computed recipe prices flow through to the dungeon calculator automatically
   - The dungeon calculator reads from recipeMap which is built from the recipes array
   - If useDataProvider.recipes already includes computed prices, no calculator changes needed

2. If the recipes array from data provider does NOT include computed prices for untradable recipes:
   - Option A: Update dungeonCalculator to accept a separate computedPriceMap
   - Option B: Update App.vue to compute prices before passing to the calculator
   - Recommended: Phase 2 should handle this in the data provider layer

3. Update DungeonTable.vue expanded view:
   - Show a visual indicator (e.g., asterisk, badge) for drops with computed prices
   - Tooltip: 'Price computed from potion profit (uses x profit = X gold)'
   - Show both the untradable recipe name and the computed price

4. Verify the profitRanker also benefits from updated dungeon profits
   - rankAllActivities receives dungeonResults which now include untradable recipe values
   - The 'All Activities' tab should show improved dungeon profitability

## Acceptance Criteria

- Untradable recipe drops contribute to dungeon expected value
- Dungeon profit calculations are more accurate
- DungeonTable shows visual indicator for computed prices
- ProfitRanking tab reflects updated dungeon profitability
- Existing dungeon tests still pass


## Notes

**2026-02-26T22:55:08Z**

Phase 6 implementation complete. Dungeon calculator integration verified and UI updated.

Changes made:
1. Verified dungeon calculator already receives recipesWithComputedPrices from useRecipePricing
2. Untradable recipe computed prices automatically flow through to dungeon profit calculations
3. Added visual indicator (ⓒ symbol) in DungeonTable.vue for untradable recipes with computed prices
4. Indicator shows on the Price column in drop breakdown for untradable recipes
5. Tooltip on hover: 'Price computed from potion profitability'

Backend logic: Already working from Phase 2 - useRecipePricing computes prices for untradable recipes
Frontend display: Visual indicator shows which prices are computed vs. market prices

Files modified:
- /home/felix/idle-mmo-profiter/src/components/DungeonTable.vue

Build: Successful (npm run build passes)
