---
id: imp-vj8g
status: closed
deps: [imp-5r5u]
links: []
created: 2026-02-25T18:31:20Z
type: epic
priority: 2
assignee: Félix Laguna Teno
parent: imp-jug7
---
# Epic 6: Charts & Visualizations

Add charts to visualize profit data. Use a lightweight charting library (Chart.js or similar).

Charts to implement:
1. BAR CHART: Profit/h comparison across all activities (horizontal bars, sorted descending)
2. BAR CHART: Dungeon profit/h comparison (all 18 dungeons)
3. PIE/DONUT CHART: Revenue breakdown by type (dungeons vs potions vs resources)
4. LINE CHART: Price history over time (if API market-history data is available)
5. TABLE HEATMAP: Color-code cells in the profit tables by profitability (green = high, red = low/negative)

Charts should:
- Match the dark theme
- Be responsive (resize with container)
- Update dynamically when prices change
- Have tooltips showing exact values
- Be exportable as images (nice to have)


## Notes

**2026-02-25T19:26:56Z**

Epic 6 complete: Charts & Visualizations fully implemented.

Files created:
- src/components/charts/ProfitBarChart.vue - Horizontal bar chart showing profit/hr comparison for all activities (top 15 with option to show all)
- src/components/charts/DungeonChart.vue - Horizontal bar chart for dungeon profits with gradient coloring
- src/components/charts/RevenueBreakdown.vue - Doughnut chart showing revenue breakdown by category (dungeons, potions, resources)
- src/components/charts/PriceHistoryChart.vue - Line chart placeholder for future price history API integration
- src/composables/useHeatmap.ts - Utility composable for heatmap color calculations

Files modified:
- src/App.vue - Added Charts tab with chart components in responsive grid layout
- src/components/ProfitRankingTable.vue - Added heatmap coloring to profit cells
- src/components/DungeonTable.vue - Added heatmap coloring to profit cells
- src/components/PotionTable.vue - Added heatmap coloring to profit cells
- src/components/ResourceTable.vue - Added heatmap coloring to profit cells
- eslint.config.js - Added HTMLCanvasElement to globals

Charts features:
- All charts use dark theme matching project colors
- Responsive design with proper mobile support
- Interactive tooltips with detailed information
- Reactive updates when data changes
- Color-coded by activity type (purple=dungeons, green=potions, blue=resources)

Heatmap features:
- Red for negative profits
- Yellow for low/break-even profits
- Light to deep green gradient for positive profits
- Applied to all profit columns in all tables

Build status: SUCCESS
Lint status: PASSED
