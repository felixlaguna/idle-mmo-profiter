---
id: imp-lmn0
status: closed
deps: [imp-o111]
links: []
created: 2026-02-25T18:34:24Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-vj8g
---
# Create dungeon profit/h comparison chart

Create src/charts/dungeonChart.ts:

- Horizontal bar chart comparing profit/h across all 18 dungeons
- Sorted by profit/h descending
- Same dark theme styling
- Shows dungeon name on Y axis, profit/h on X axis
- Tooltip shows: dungeon name, profit/h, profit per run, run cost, run time
- Optional: toggle between profit/h and profit per run views

## Acceptance Criteria

Dungeon comparison chart renders correctly for all 18 dungeons


## Notes

**2026-02-25T19:22:10Z**

DungeonChart component created with gradient coloring from low to high profit. Added detailed tooltips showing time, cost, and profit metrics. Integrated into Charts tab. Build successful.
