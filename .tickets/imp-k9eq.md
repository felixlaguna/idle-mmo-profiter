---
id: imp-k9eq
status: closed
deps: [imp-mwtk, imp-9viz]
links: []
created: 2026-02-26T22:14:40Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-a363
---
# Phase 3: Dual profitability for potions from limited-use recipes

Potions that come from recipes with limited uses should compute 2 profitabilities:
1. Profitability WITHOUT recipe cost (assumes you already have the recipe)
2. Profitability WITH recipe cost amortized (assumes you bought the tradable recipe on market)

This applies to potions where a tradable recipe exists on the market.

## Formula:
- profit_without_recipe = potion_sell_after_tax - material_cost - vial_cost (existing formula)
- recipe_cost_per_craft = tradable_recipe_market_price / recipe_uses
- profit_with_recipe = profit_without_recipe - recipe_cost_per_craft

Per hour variants:
- profitPerHour_without_recipe = profit_without_recipe / (craft_time / 3600)
- profitPerHour_with_recipe = profit_with_recipe / (craft_time / 3600)

## Files to modify:
- /home/felix/idle-mmo-profiter/src/calculators/potionCalculator.ts
- /home/felix/idle-mmo-profiter/src/types/index.ts (if needed for new result fields)

## Tasks:
1. Extend PotionProfitResult interface with new fields:
   - 'profitWithRecipeCost?: number' -- profit after amortizing recipe purchase
   - 'profitPerHourWithRecipeCost?: number'
   - 'recipeCostPerCraft?: number' -- tradable_recipe_price / uses
   - 'recipeUses?: number' -- number of uses
   - 'tradableRecipePrice?: number' -- market price of the tradable recipe version
   - 'hasRecipeCost: boolean' -- whether dual profitability applies

2. Update calculatePotionProfits() to:
   - Accept additional parameter: recipes array (or recipe pricing map)
   - For each potion, look up the matching tradable recipe
   - Calculate both profitabilities
   - Include recipe cost info in results

3. Update App.vue to pass recipe data to calculatePotionProfits()

## Key Consideration:
- Not all potions have recipes with limited uses -- the existing 6 potions (Wraithbane etc.) are crafted from materials, not recipes
- The dual profitability mainly applies to potions produced by the untradable recipes once those potions are added to potionCrafts (Phase 5)
- However, some existing potions like Frenzy have both a recipe (Frenzy Potion Recipe) and potionCraft data

## Acceptance Criteria

- PotionProfitResult contains both profit values (with and without recipe cost)
- Calculator correctly amortizes recipe cost over uses
- Existing potions without recipes show only standard profitability
- Potions with tradable recipes show dual profitability


## Notes

**2026-02-26T22:51:00Z**

Completed Phase 3:
- Extended PotionProfitResult interface with dual profitability fields:
  - hasRecipeCost, profitWithRecipeCost, profitPerHourWithRecipeCost
  - recipeCostPerCraft, recipeUses, tradableRecipePrice, tradableRecipeName
- Updated calculatePotionProfits to accept optional recipes parameter
- For each potion, finds the cheapest tradable recipe that produces it
- Computes dual profitability:
  - Profit WITHOUT recipe cost (assumes recipe already owned)
  - Profit WITH recipe cost (recipe_price / uses per craft)
- Integrated into App.vue by passing recipes to calculatePotionProfits
- TypeScript compiles, app builds successfully
- Ready for Phase 4 (UI display)
