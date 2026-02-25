---
id: imp-4jzm
status: closed
deps: [imp-o111]
links: []
created: 2026-02-25T18:34:24Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-vj8g
---
# Create revenue breakdown pie chart and price history line chart

Create two additional charts:

1. src/charts/breakdownChart.ts - Pie/donut chart:
   - Segments: Dungeons (total profit/h), Potions (total benefit/h), Resources (total benefit/h)
   - Shows which category is most profitable overall
   - Dark theme with semi-transparent segments
   - Legend below the chart

2. src/charts/historyChart.ts - Line chart (only if API market-history data available):
   - X axis: dates, Y axis: average price
   - Multiple lines for different items (selectable)
   - Fallback: show 'Price history requires API key with market_history scope'
   - Tooltip with date and price
   - Zoom/pan if possible

## Acceptance Criteria

Pie chart renders with correct proportions, line chart works with mock/real data


## Notes

**2026-02-25T19:23:55Z**

Created RevenueBreakdown and PriceHistoryChart components. RevenueBreakdown shows doughnut chart with profit distribution by category (dungeons, potions, resources). PriceHistoryChart shows placeholder for future API integration with line chart. Both integrated into Charts tab with responsive grid layout. Build successful.
