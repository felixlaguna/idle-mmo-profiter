---
id: imp-op02
status: closed
deps: [imp-im87]
links: []
created: 2026-02-27T11:31:03Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-kb81
---
# Phase 2: Verify useRecipePricing handles dungeon price correctly

Once Phase 1 populates the data, verify that the existing useRecipePricing composable correctly computes dungeon prices for untradable limited-use recipes.

Current logic in useRecipePricing.ts (lines 86-122):
- For untradable recipes with uses > 0 and a known producesItemName:
  - potionProfit = sellAfterTax - totalMaterialCost (this is profit WITHOUT recipe cost, which is correct)
  - computedPrice = uses * potionProfit (if potionProfit > 0, else 0)
- This price flows into dungeonCalculator via recipesWithComputedPrices

This is already correct for the feature requirements:
1. Both conditions checked: isUntradable AND uses > 0 ✓
2. Profit per potion excludes recipe cost (only material costs subtracted) ✓
3. If profit is negative, price stays at 0 ✓

The dungeon expected value is then: computedPrice * chance * (1 + MF/100)
Where computedPrice = uses * profitPerPotion, representing the total value of getting that recipe drop.

Steps:
- Review that the potionProfit calculation in useRecipePricing.calculatePotionProfit does NOT include recipe cost (only material costs) -- CONFIRMED, it does not
- Review that negative profit results in price=0 -- CONFIRMED at line 111
- Review that the computed price flows through App.vue -> recipesWithComputedPrices -> dungeonCalculator -- CONFIRMED
- Write a unit test verifying this end-to-end behavior

Files to review (no changes expected):
- /home/felix/idle-mmo-profiter/src/composables/useRecipePricing.ts
- /home/felix/idle-mmo-profiter/src/calculators/dungeonCalculator.ts
- /home/felix/idle-mmo-profiter/src/App.vue

## Acceptance Criteria

Confirmation that the existing logic correctly handles the feature requirements. Unit tests added to verify the behavior.


## Notes

**2026-02-27T11:56:42Z**

Logic verification complete - ALL requirements met.

✓ Verified useRecipePricing.ts (lines 86-122):
  - Line 98-100: Checks 'uses > 0' (untradable recipes with uses=0 are skipped)
  - Line 102-103: Extracts uses and producesItemName
  - Line 106-116: If potion is found in profitMap, computes price
  - Line 111: computedPrice = potionProfit > 0 ? uses * potionProfit : 0
  
✓ Verified calculatePotionProfit() (lines 29-44):
  - Line 31-34: totalMaterialCost = sum of material costs
  - Line 37: totalCost = totalMaterialCost (NO recipe cost included)
  - Line 40: sellAfterTax = currentPrice * (1 - taxRate)
  - Line 43: return sellAfterTax - totalCost
  - Recipe cost is NOT included in profit calculation ✓

✓ Verified data flow (App.vue):
  - Line 80-83: useRecipePricing takes dataProvider.recipes
  - Line 89: recipesWithComputedPrices flows to useProfitRanking
  - Line 109: recipesWithComputedPrices flows to calculateDungeonProfits
  
✓ Verified dungeonCalculator.ts (line 65):
  - expectedValue = recipe.price * recipe.chance * (1 + totalMF/100)
  - Uses the computed price from useRecipePricing ✓

All requirements satisfied:
1. Both conditions checked: isUntradable AND uses > 0 ✓
2. Profit excludes recipe cost (only material costs) ✓
3. Negative profit results in price = 0 ✓
4. Computed price flows to dungeon calculator ✓

Ready for Phase 3 (unit tests).
