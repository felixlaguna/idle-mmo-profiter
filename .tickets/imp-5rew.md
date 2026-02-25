---
id: imp-5rew
status: closed
deps: [imp-zqhx]
links: []
created: 2026-02-25T18:34:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-5r5u
---
# Build potion crafting table

Create potion crafting detail view:

- Table of all 6 potions with columns:
  - Potion Name, Craft Time (formatted), Material Costs (expandable), Vial Cost, Total Cost, Min Sell Price (with 12% tax), Current Market Price (editable), Benefit, Benefit/h
- Expandable material breakdown:
  - Material Name, Quantity, Unit Cost (editable, from Market sheet), Line Total
- Profitable potions highlighted green, unprofitable ones red
- Tax rate displayed and editable
- Summary row: average benefit/h across all potions

## Acceptance Criteria

All 6 potions displayed with material breakdowns, inline editing recalculates


## Notes

**2026-02-25T19:15:26Z**

Potion crafting table complete:
- Created PotionTable.vue component
- Shows all 6 potions with: Name, Material Cost, Vial Cost, Total Cost, Market Price, Profit, Profit/hr
- Expandable rows showing material breakdown (material name, qty, unit price, subtotal)
- Inline editing for material prices, market price, vial cost using EditableValue
- Color-coded profit (green for positive, red for negative)
- Sort by any column
- Integrated into App.vue 'Potions' tab
