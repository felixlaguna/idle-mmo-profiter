---
id: imp-5r5u
status: closed
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


## Notes

**2026-02-25T19:17:48Z**

Epic 5: UI - Dashboard & Data Tables COMPLETE

All components implemented and integrated:

## Files Created:
- /home/felix/idle-mmo-profiter/src/components/ProfitRankingTable.vue - Unified profit ranking table
- /home/felix/idle-mmo-profiter/src/components/DungeonTable.vue - Dungeon detail table with expandable drop breakdowns
- /home/felix/idle-mmo-profiter/src/components/PotionTable.vue - Potion crafting table with material breakdowns
- /home/felix/idle-mmo-profiter/src/components/ResourceTable.vue - Resource gathering table with vendor vs market comparison

## Files Modified:
- /home/felix/idle-mmo-profiter/src/App.vue - Main app layout with hero section, tab navigation, and settings modal

## Features:
1. Top bar with app title, last update time, and settings gear icon
2. Hero section showing the best action with large profit/hr display
3. Tab navigation for All Activities, Dungeons, Potions, Resources
4. Profit ranking table with sortable columns and type filters
5. Dungeon table with expandable rows showing drop breakdowns and inline editing
6. Potion table with material breakdowns and inline editing
7. Resource table with vendor vs market comparison
8. Settings modal integration with reactive recalculations
9. Dark theme using CSS variables
10. Fully responsive design

## Quality:
- Build: PASSED (npm run build)
- Lint: PASSED (npm run lint)
- All TypeScript errors resolved
- All components properly integrated and wired up
- Reactive data flow working correctly

The app is fully functional end-to-end!
