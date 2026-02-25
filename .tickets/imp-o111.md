---
id: imp-o111
status: closed
deps: []
links: []
created: 2026-02-25T18:34:24Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-vj8g
---
# Set up Chart.js and create profit comparison bar chart

Install Chart.js (lightweight, no heavy deps):
- npm install chart.js

Create src/charts/profitChart.ts:
- Horizontal bar chart showing all activities ranked by profit/h
- Color-coded bars: dungeon=purple, potion=green, resource=blue
- Dark theme: dark background, light text, subtle grid lines
- Tooltips showing exact values on hover
- Responsive: fills container width
- Updates dynamically when data changes
- Max ~30 bars visible (top 30 activities), with scroll for rest
- Negative profit bars shown in red, extending left

## Acceptance Criteria

Bar chart renders with correct data, dark theme, responsive


## Notes

**2026-02-25T19:19:19Z**

Installed chart.js and vue-chartjs packages. Starting implementation of ProfitBarChart component.

**2026-02-25T19:20:58Z**

ProfitBarChart component created and integrated into App.vue. Added Charts tab with horizontal bar chart showing profit/hr comparison. Chart uses Chart.js with dark theme colors matching project style. Build successful.
