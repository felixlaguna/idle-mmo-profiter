---
id: imp-i7zb
status: closed
deps: [imp-i32r]
links: []
created: 2026-02-27T12:27:20Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-dh5d
---
# Phase 2: Remove untradable-only gate from dual profitability in potionCalculator.ts

Currently, dual profitability display (showing cost with/without recipe) only appears for potions that have BOTH an untradable AND tradable recipe. The user wants ALL potions with a tradable recipe (that has uses > 0) to show dual pricing, even if no untradable variant exists.

File to modify:
- src/calculators/potionCalculator.ts

Current logic (line 151):
  if (tradableRecipe && tradableRecipe.uses && tradableRecipe.uses > 0 && hasUntradableAlternative)

This requires 3 conditions:
1. A tradable recipe exists for this potion
2. The recipe has uses > 0
3. An untradable alternative exists (hasUntradableAlternative)

Change: Remove condition #3 (hasUntradableAlternative) so the check becomes:
  if (tradableRecipe && tradableRecipe.uses && tradableRecipe.uses > 0)

This means ANY potion with a tradable recipe that has limited uses will show dual profitability (profit with recipe cost amortized + profit without recipe cost).

Lines ~71-94 build the potionRecipeMap and potionsWithUntradableRecipe set. The potionsWithUntradableRecipe set and hasUntradableAlternative variable will become dead code—they should be cleaned up.

After this change the field naming (profitWithRecipeCost/profitPerHourWithRecipeCost) is confusing since it stores 'without recipe' values. This is a pre-existing naming issue—see design notes.

## Design

The current field naming in PotionProfitResult is misleading:
- result.profit = profit WITH recipe cost (the main display value)
- result.profitWithRecipeCost = profit WITHOUT recipe cost (used in tooltip)
The field 'profitWithRecipeCost' actually stores the WITHOUT-recipe values.

This is a pre-existing naming issue from the original untradable-only implementation and is preserved here for backwards compatibility. A future cleanup ticket could rename these for clarity, but is out of scope.

## Acceptance Criteria

1. All potions with a tradable recipe that has uses > 0 show dual profitability (hasRecipeCost=true)
2. Potions without any recipe still show single profitability (hasRecipeCost=false)
3. The potionsWithUntradableRecipe set and hasUntradableAlternative references are removed as dead code
4. Existing test for untradable+tradable still passes
5. Test for tradable-only recipe (currently expects hasRecipeCost=false) is updated to expect hasRecipeCost=true


## Notes

**2026-02-27T12:30:19Z**

Removed untradable-only gate from dual profitability:
- Removed potionsWithUntradableRecipe set (dead code)
- Removed hasUntradableAlternative variable (dead code)
- Updated condition on line 151 to only check for tradable recipe with uses > 0
- Updated top-level documentation to reflect new behavior
