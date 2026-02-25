---
id: imp-4ra7
status: open
deps: [imp-iolq, imp-o9wf]
links: []
created: 2026-02-25T18:33:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-90r5
---
# Build unified profit ranking and best-action recommender

Create src/calc/ranking.ts:

Combine results from all three calculators into a single ranked list:

1. Take all DungeonProfitResult[] (profit/h for each dungeon)
2. Take all PotionProfitResult[] (benefit/h for each potion)
3. Take all ResourceProfitResult[] (max/h for each resource, using the better of vendor/market)
4. Normalize to a common ProfitResult[] interface:
   { activityName, type: 'dungeon'|'potion'|'resource', profitPerHour, profitPerAction, timePerAction, cost, details: string }
5. Sort by profitPerHour descending
6. Mark the #1 entry as 'recommended'
7. Filter out negative profit activities (optional toggle to show/hide)

Function: rankAllActivities(dungeonResults, potionResults, resourceResults) -> RankedActivity[]
Function: getBestAction(rankedActivities) -> RankedActivity

Also create a recalculate() function that:
- Reads current prices (defaults + API cache + user overrides, in that priority order)
- Runs all three calculators
- Returns the full ranked list
- Is called whenever any price changes

## Acceptance Criteria

Unified ranking correctly sorts all activities, #1 pick matches Excel 'Winner' cell logic

