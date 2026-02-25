---
id: imp-dv3g
status: closed
deps: [imp-zqhx]
links: []
created: 2026-02-25T18:34:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-5r5u
---
# Build resource gathering table with vendor vs market comparison

Create resource gathering detail view:

- Table with columns:
  - Resource/Activity, Time (formatted), Cost (editable), Vendor Value (editable), Vendor Benefit/h, Market Price (editable), Market After Tax, Market Benefit/h, Best Option (Market/Vendor badge), Best Benefit/h
- Group related activities: raw resources, cooked versions, full chains (catch+cook)
- Visual indicator for recommended sell method (Market vs Vendor)
- Multi-step chain rows indented under their parent resource
- All values editable inline
- 'Full chain' rows auto-calculate when component times/prices change
- Tax rate shown at top (editable)

## Acceptance Criteria

All resource activities displayed, chains calculate correctly, vendor/market comparison clear


## Notes

**2026-02-25T19:16:35Z**

Resource gathering table complete:
- Created ResourceTable.vue component
- Shows all resource gathering activities with: Resource, Time, Cost, Vendor Price, Market Price, Best Method, Profit/hr
- Best Method column shows Vendor or Market with appropriate styling
- Inline editing for prices, costs, time using EditableValue
- Color-coded profit (green for positive, red for negative)
- Sort by any column
- Integrated into App.vue 'Resources' tab
