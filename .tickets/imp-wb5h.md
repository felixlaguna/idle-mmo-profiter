---
id: imp-wb5h
status: closed
deps: []
links: []
created: 2026-03-02T08:17:25Z
type: bug
priority: 2
assignee: Félix Laguna Teno
tags: [dungeons, ux]
---
# Default dungeon ordering should be by cost

Dungeons should be sorted by cost by default. Currently the default ordering does not reflect this, making it harder to quickly compare dungeon profitability.

## Acceptance Criteria

- [ ] Dungeons tab defaults to sorting by cost
- [ ] Sort order is intuitive (ascending or descending — verify which makes more sense)
- [ ] User can still change to other sort options


## Notes

**2026-03-02T09:45:46Z**

Found the issue: default sort is 'profitPerHour' on line 32-33. Need to change to 'runCost' with 'desc' order.

**2026-03-02T09:46:14Z**

Implementation complete. Changed default sort in DungeonTable.vue from 'profitPerHour' to 'runCost' (descending). All 389 tests passing. Sort indicator will correctly show runCost as the default sorted column with descending arrow.

**2026-03-02T09:47:08Z**

## Code Review: APPROVED

Files reviewed:
- /home/felix/idle-mmo-profiter/src/components/DungeonTable.vue (line 32: sortKey default changed from 'profitPerHour' to 'runCost')

### Checklist

1. **Type check (vue-tsc --noEmit):** PASS -- no errors
2. **Tests (vitest run):** PASS -- 389/389 tests passing across 28 test files
3. **SortKey validity:** 'runCost' is a valid member of the SortKey union type (line 25)
4. **Sort logic:** The switch case on line 48-50 correctly maps 'runCost' to a.runCost/b.runCost
5. **Descending order:** 'desc' shows most expensive dungeons first, which is intuitive for cost comparison
6. **No test assumptions broken:** No existing tests depended on the old default sort key
7. **Style guide:** Single-line change, consistent with existing code style

No issues found. Ready for user review.

**2026-03-02T09:47:20Z**

Review: APPROVED — clean one-line change, vue-tsc clean, 389/389 tests pass.
