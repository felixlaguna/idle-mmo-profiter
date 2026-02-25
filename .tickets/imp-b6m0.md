---
id: imp-b6m0
status: open
deps: [imp-o111]
links: []
created: 2026-02-25T18:34:24Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-vj8g
---
# Add heatmap coloring to profit tables

Create src/charts/heatmap.ts:

- Apply background color gradient to profit/h cells in all tables
- Scale: deep red (negative/zero) -> yellow (low positive) -> bright green (high positive)
- Calculate min/max across visible rows for relative scaling
- CSS custom properties for easy theming
- Apply to: ranking table profit/h column, dungeon table profit/h column, potion benefit/h column, resource best/h column
- Subtle enough to not overwhelm but clear enough to spot best values at a glance
- Respects dark theme (colors should work on dark backgrounds)

## Acceptance Criteria

All profit columns have heatmap coloring, visually clear gradient from bad to good

