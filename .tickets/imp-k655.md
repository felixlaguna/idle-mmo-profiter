---
id: imp-k655
status: closed
deps: [imp-gfx5]
links: []
created: 2026-02-27T12:27:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-dh5d
---
# Phase 4: Verify PotionTable.vue displays dual pricing for all applicable potions

Verify that the existing PotionTable.vue component correctly displays dual pricing for all potions that now have hasRecipeCost=true, with NO component changes needed.

Files to verify (read-only):
- src/components/PotionTable.vue

The PotionTable.vue component already renders dual profitability based on the hasRecipeCost flag:
- Profit column (line 228-262): shows recipe indicator ⓡ and tooltip with/without recipe values
- Profit/hr column (line 269-303): same dual display
- Expanded row (line 355-392): shows full recipe cost breakdown section

Since the component is already data-driven (it reads hasRecipeCost, profitWithRecipeCost, profitPerHourWithRecipeCost, recipeCostPerCraft, tradableRecipeName, tradableRecipePrice, recipeUses from PotionProfitResult), no template changes are needed. The calculator change in Phase 2 will automatically populate these fields for ALL potions with tradable recipes, and the UI will display them.

Verification checklist:
1. Potions that previously had dual pricing (untradable+tradable) still show it correctly
2. Potions with only tradable recipes (uses > 0) NOW show dual pricing (new behavior)
3. Potions with no recipe still show single pricing
4. Tooltip content renders correctly for all dual-priced potions
5. Expanded row recipe cost section renders correctly for all dual-priced potions

## Acceptance Criteria

1. Visual inspection confirms dual pricing shows for all applicable potions
2. No changes to PotionTable.vue were necessary (the component is already data-driven)
3. The ⓡ indicator and tooltip appear on all potions with tradable recipes that have uses > 0


## Notes

**2026-02-27T12:31:40Z**

Verified PotionTable.vue component (read-only):
- ⓡ indicator and tooltips (lines 228-262, 269-303) render when hasRecipeCost=true
- Expanded row recipe cost section (lines 355-392) renders when hasRecipeCost=true
- Component is fully data-driven, no changes needed
- All newly-eligible potions (tradable recipe with uses > 0) will automatically show dual pricing
