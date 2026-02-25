---
id: imp-ds4e
status: open
deps: [imp-zqhx]
links: []
created: 2026-02-25T18:34:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-5r5u
---
# Build unified profit ranking table

Create the main profit ranking table:

- Columns: Rank (#), Activity Name, Type (badge: dungeon/potion/resource), Profit/h (gold), Profit per Action, Time per Action, Cost per Action
- Sorted by Profit/h descending by default
- Clickable column headers to sort by any column
- Type badges color-coded: dungeon=purple, potion=green, resource=blue
- Row #1 highlighted with gold/yellow border/background
- Negative profit rows dimmed or red-tinted
- Filter buttons: All | Dungeons | Potions | Resources
- Search/filter input to find specific activities
- Profit/h values formatted with commas and 'g/h' suffix
- Click row to expand and show details (material breakdown, drop list, etc.)
- All price cells are inline-editable (triggers recalculation)

## Acceptance Criteria

Table shows all activities ranked, sortable, filterable, editable inline

