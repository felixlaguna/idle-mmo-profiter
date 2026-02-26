---
id: imp-kdmp
status: closed
deps: []
links: []
created: 2026-02-26T08:22:57Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [bug, filters, ranking]
---
# Fix: Filters don't update rankings or hero winner, persist filter state

When disabling type filters (dungeon/potion/resource) on the profit ranking page: 1) Rank numbers don't update for remaining items, 2) Hero 'best action' at top doesn't update to reflect filtered results, 3) Filter state should be persisted in localStorage.


## Notes

**2026-02-26T08:23:26Z**

Investigation: Analyzed the codebase structure. Found:
- ProfitRankingTable.vue has filter state (filterDungeons, filterPotions, filterResources) local to component
- App.vue uses bestAction from useProfitRanking which is always the global #1
- Rank numbers in table come from activity.rank property which is set by profitRanker
- No localStorage persistence for filters yet

Root causes:
1. filteredAndSortedActivities filters but doesn't re-rank - it uses original activity.rank values
2. bestAction in App.vue is computed from all activities, not filtered ones
3. Filter state is local refs in ProfitRankingTable, never saved to storage

Solution approach:
- Add re-ranking computed property that assigns new rank numbers to filtered items
- Lift filter state to shared composable or emit to parent
- Use useStorage for filter persistence

**2026-02-26T08:23:52Z**

Created failing test document at src/tests/filter-ranking-sync.test.md. Now implementing fixes.

**2026-02-26T08:25:14Z**

Fix implemented successfully:

1. Created src/composables/useActivityFilters.ts:
   - Manages filter state (dungeons, potions, resources)
   - Persists state to localStorage with key 'idlemmo:active-filters'
   - Provides getFilteredAndRerankedActivities() that filters AND re-ranks

2. Updated ProfitRankingTable.vue:
   - Now uses useActivityFilters() instead of local refs
   - Applies getFilteredAndRerankedActivities() so visible items show ranks 1, 2, 3...
   - Filter toggles now persist across page reloads

3. Updated App.vue:
   - Imported getBestAction and useActivityFilters
   - Changed bestAction to computed property that uses filtered activities
   - Hero section now shows best action among visible/filtered items only

All three bugs fixed:
✓ Filtered items re-rank starting from 1
✓ Hero best action reflects current filters
✓ Filter state persists in localStorage

Build passes. Ready for manual testing.
