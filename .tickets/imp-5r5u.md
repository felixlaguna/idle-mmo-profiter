---
id: imp-5r5u
status: open
deps: [imp-64ql, imp-90r5]
links: []
created: 2026-02-25T18:31:13Z
type: epic
priority: 2
assignee: Félix Laguna Teno
parent: imp-jug7
---
# Epic 5: UI - Dashboard & Data Tables

Build the main dashboard UI showing all profit calculations in an actionable format. Desktop-first design with a dark theme matching IdleMMO (bg #111722, text gray-200).

Key views:
1. TOP BAR: Best action right now (highlighted), profit/h, last price update time
2. PROFIT RANKING TABLE: Unified sorted table of all activities (dungeons, potions, resources) ranked by profit/h
   - Columns: Rank, Activity Name, Type (dungeon/potion/resource), Profit/h, Profit per action, Time per action, Cost
   - Color-coded by type, sortable columns, filterable by type
3. DUNGEON DETAIL TABLE: All 18 dungeons with drops, expected values, costs, profit/h
   - Expandable rows to show individual drop breakdown
4. POTION CRAFTING TABLE: All potions with material costs, sell price, benefit/h
5. RESOURCE GATHERING TABLE: All resources with vendor vs market comparison
6. SETTINGS PANEL: API key, MF values, tax rate, data refresh controls

UI framework: Vanilla CSS with CSS Grid/Flexbox (or Tailwind if preferred - lightweight).
Tables should use inline editing (click cell to edit, save to localStorage).

