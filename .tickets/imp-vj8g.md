---
id: imp-vj8g
status: open
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

