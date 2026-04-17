---
id: imp-9ex6
status: closed
deps: [imp-n5wx]
links: []
created: 2026-03-04T20:19:18Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Iteration 2d: Update tests for local-only Character Tracker search

Update tests to cover the new local-only search behavior after reverting API search and adding allItems support.

## Files to modify

### /home/felix/idle-mmo-profiter/src/tests/composables/useCharacterTracker.test.ts

Update existing tests in the 'API item name handling' section:
- Remove references to storeApiItemData (function no longer exists)
- Keep tests for name persistence on inventory items (the name field is still used)
- Add tests for resolveItemName with items from allItems (via dataProvider)
- Add tests for resolveCurrentPrice with items from allItems

New tests to add:
- resolveItemName returns correct name for items in allItems
- resolveCurrentPrice returns vendorPrice for items in allItems
- Categorized items take priority over allItems entries (if same hashId exists in both)

### Test considerations
- The useDataProvider mock needs to expose an allItems ref
- Verify the deduplication logic (categorized items override allItems entries)
- Verify name field still persists through save/load cycles

## Acceptance Criteria

- All tests pass (existing + new)
- No references to storeApiItemData in any test
- Test coverage for allItems name and price resolution
- Test coverage for categorized items taking priority over allItems
- TypeScript type check passes


## Notes

**2026-03-04T20:27:33Z**

Updated tests for local-only Character Tracker search.

Changes:
- Added 3 new tests to useCharacterTracker.test.ts:
  1. Test for resolving names from allItems (when not in other categories)
  2. Test for resolving prices from allItems (when not in other categories)
  3. Test for verifying categorized items take priority over allItems

Test coverage:
- Name persistence through save/load cycle
- Pending changes name preservation
- Priority chain: inventory item > pending changes > defaults.json > fallback
- Categorized items take priority over allItems entries
- Fallback behavior when item not found

All 620 tests passing (added 3 new tests). TypeScript type check passes.
