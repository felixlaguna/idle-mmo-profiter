---
id: imp-9viz
status: closed
deps: [imp-mwtk]
links: []
created: 2026-02-26T22:14:25Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-a363
---
# Phase 2: Untradable recipe pricing in data provider

Implement the computed pricing for untradable recipes in the data provider layer.

## Formula:
When a recipe has market price = 0 (untradable):
  computed_price = uses * potion_profit
Where potion_profit = potion_market_price * (1 - taxRate) - potion_total_craft_cost

## Files to modify:
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts

## Tasks:
1. Create a new computed property 'recipesWithComputedPrices' that:
   - For each recipe, checks if price == 0 (untradable)
   - If untradable, looks up the potion it produces via producesItemName
   - Calculates potion profit using existing potionCrafts data (material costs + vial + tax)
   - Sets computed_price = uses * potion_profit
   - For tradable recipes, keeps the existing price

2. Create a lookup map: recipePotionMap (recipe name -> potion profit)
   - This needs the potionCrafts computed data and taxRate
   - Could accept taxRate as a parameter or use the default

3. Update the recipes computed property to include computed prices for untradable recipes
   - The existing dungeonCalculator already reads recipe.price from the recipes array
   - By setting the computed price here, it will flow through to dungeon profit calculations automatically

4. Ensure reactivity chain: when potion prices or material prices change, untradable recipe prices recalculate

## Key Consideration:
- The taxRate is needed for potion profit calculation but is currently not in useDataProvider
- Options: (a) pass taxRate to the data provider, (b) compute recipe prices in a separate composable, (c) add taxRate to data provider
- Recommended: extend the recipes computed to accept taxRate from App.vue level, or create a new composable useRecipePricing that combines recipe + potion data

## Acceptance Criteria

- Untradable recipes (price=0) display a computed price = uses * potion_profit
- Computed prices react to changes in potion prices, material prices, and tax rate
- Dungeon calculator automatically uses computed prices for untradable recipe drops
- All existing tests still pass


## Notes

**2026-02-26T22:47:06Z**

Created useRecipePricing composable:
- Calculates potion profit per craft (price after tax - material costs)
- Creates map of potion names to profits
- Returns computed recipes with prices for untradable recipes = uses × potion_profit
- Only computes price if recipe.producesItemName is set and matches a potion in potionCrafts
- Next: integrate into App.vue and populate producesItemName for recipes

**2026-02-26T22:49:15Z**

Completed Phase 2:
- Created useRecipePricing composable to compute prices for untradable recipes
- Formula: price = uses × potion_profit, where potion_profit = sell_after_tax - total_cost
- Created link-recipes-to-potions.js script to populate producesItemName field
- Linked 14 recipes to 6 existing potions (Wraithbane, Thunderfury, Gourmet, Dungeon master, Frenzy, Cosmic)
- Integrated useRecipePricing into App.vue
- Recipes with computed prices now flow to dungeon calculator and profit ranking
- Reactivity chain: potion prices → potion profit → recipe prices → dungeon profits
- TypeScript compiles, app builds, tests pass (1 unrelated pre-existing test failure)
- Ready for Phase 3
