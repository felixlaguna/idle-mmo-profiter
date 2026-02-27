---
id: imp-xs77
status: closed
deps: [imp-cuor]
links: []
created: 2026-02-27T11:31:27Z
type: task
priority: 3
assignee: Félix Laguna Teno
parent: imp-kb81
---
# Phase 4: Add computed-price indicator for untradable recipes in DungeonTable

The DungeonTable.vue component already has a computed-price indicator (ⓒ icon) for untradable recipes in the drop breakdown. Verify this works correctly with the new computed prices.

Current logic in DungeonTable.vue (line 152-154):
  const isUntradableRecipe = (recipeName: string): boolean => {
    return recipeName.includes('(Untradable)')
  }

This is a simple name-based check. When the drop breakdown shows the price column, untradable recipes get a ⓒ indicator with a tooltip saying 'Price computed from potion profitability'.

Verify:
1. After Phase 1 data population, the ⓒ indicator shows next to recipes that now have computed prices
2. The tooltip text is clear and accurate
3. Consider enhancing the tooltip to show the calculation breakdown:
   - 'Price = {uses} uses × {profitPerPotion}/potion = {totalPrice}'
   - This would require passing additional data through the calculator

Optional enhancement: If the tooltip enhancement is desired, the DungeonDropResult interface in dungeonCalculator.ts would need additional fields (isComputed, uses, profitPerUse). This is a nice-to-have, not required for the core feature.

Files to review:
- /home/felix/idle-mmo-profiter/src/components/DungeonTable.vue

Files to potentially modify (optional enhancement):
- /home/felix/idle-mmo-profiter/src/calculators/dungeonCalculator.ts (add isComputed flag to DungeonDropResult)
- /home/felix/idle-mmo-profiter/src/components/DungeonTable.vue (enhanced tooltip)

## Acceptance Criteria

The ⓒ indicator correctly appears for untradable recipes with computed prices. Tooltip clearly indicates the price is computed from potion profitability.


## Notes

**2026-02-27T11:59:13Z**

UI indicator verification complete.

Current implementation in DungeonTable.vue:
✓ Line 152-154: isUntradableRecipe() helper checks for '(Untradable)' in name
✓ Line 251-254: Computed price indicator (ⓒ) shown for untradable recipes
✓ Tooltip text: 'Price computed from potion profitability'
✓ Line 533-544: Styled with accent color, opacity effects, cursor help

Verification:
1. Indicator appears for untradable recipes ✓
2. Tooltip text is clear and accurate ✓
3. Visual styling follows design system (accent-primary color) ✓
4. Hover effect enhances visibility ✓

The indicator correctly identifies all recipes with '(Untradable)' in the name and displays the ⓒ symbol next to their computed prices. With the data now properly populated (uses=30 for limited-use recipes), these recipes will show computed prices based on potion profitability.

Optional enhancement consideration:
The task mentioned showing calculation breakdown in tooltip:
- 'Price = {uses} uses × {profitPerPotion}/potion = {totalPrice}'
- This would require passing additional data through dungeonCalculator
- Not required for core feature functionality

Decision: Current implementation is sufficient and meets acceptance criteria. The basic indicator clearly shows which prices are computed. Adding detailed breakdown can be a future enhancement if user feedback requests it.
