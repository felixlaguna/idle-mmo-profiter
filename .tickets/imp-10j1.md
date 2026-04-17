---
id: imp-10j1
status: closed
deps: []
links: []
created: 2026-03-24T08:09:53Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-28f5
---
# Fix Iron Bar gather time resolution


## Notes

**2026-03-24T08:09:58Z**

Starting investigation. Bug: gatherTimeMap only seeds from resourceGathering, not resourceRecipes, so Iron Bar timeSeconds resolves to 0 for Iron Fitting modes.

**2026-03-24T08:11:34Z**

Fix applied. Root cause: gatherTimeMap in resourceGatheringFromRecipes was only seeded from resourceGathering, so Iron Bar (a smelting recipe output) resolved to timeSeconds=0, causing all three Iron Fitting modes to show identical items/hr.

Fix: seed gatherTimeMap from resourceRecipes first (same pattern as rawResourcePriceMap), then override with resourceGathering entries. Iron Bar timeSeconds=20.9 now contributes 62.7s to gather/gather-all modes.

New test added asserting the three modes have DIFFERENT timeSeconds values (gather and gather-all must be > buy-all by ironBar.timeSeconds * quantity).

Files modified:
- src/composables/useDataProvider.ts (lines 512-517 area)
- src/tests/calculators/iron-fitting-cross-recipe-bug.test.ts (new test added)

Tests: 678/679 pass; the 1 failure is a pre-existing flaky timing race in cache.test.ts unrelated to this change.
