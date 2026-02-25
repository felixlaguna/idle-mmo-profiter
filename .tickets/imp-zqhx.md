---
id: imp-zqhx
status: open
deps: []
links: []
created: 2026-02-25T18:34:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-5r5u
---
# Build app layout shell and navigation

Create the main app layout:

- Dark theme: bg #111722, text #e5e7eb, card bg #1a2133, border #2d3748
- Sticky top header bar with:
  - App title: 'IdleMMO Profit Calculator'
  - Best action badge: 'Best: [Activity Name] - [X] gold/h'
  - Data source indicator: 'Default data' / 'Live data (updated X min ago)'
  - Settings gear icon (opens settings panel)
- Main content area with section anchors:
  - Profit Ranking (default view)
  - Dungeons
  - Potions
  - Resources
  - Settings
- Tab-style navigation or scrollable single page with section headers
- Footer with credits and data freshness info

## Acceptance Criteria

Layout renders with dark theme, navigation works between sections

