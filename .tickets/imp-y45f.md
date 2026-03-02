---
id: imp-y45f
status: closed
deps: []
links: []
created: 2026-03-02T08:20:36Z
type: bug
priority: 1
assignee: Félix Laguna Teno
tags: [data-accuracy]
---
# Fix Great White Shark hashed ID and refresh vendor price

The Great White Shark has an incorrect hashed ID in the data. The correct ID is 3Zbym56qLxRNBRp7Eekd. After fixing the ID, the vendor price needs to be refreshed from the source to ensure accuracy.

## Acceptance Criteria

- [ ] Update Great White Shark hashed ID to 3Zbym56qLxRNBRp7Eekd
- [ ] Refresh vendor price using the corrected ID
- [ ] Verify the item displays correctly across all tabs


## Notes

**2026-03-02T08:53:29Z**

Investigation: Found Great White Shark at line 908 in defaults.json. Current hashedId is 'ZqEegBydNw7NkA59J61b', needs to be updated to '3Zbym56qLxRNBRp7Eekd'. Current vendor value is 77, but expected should be 41 based on line 15176.

**2026-03-02T08:54:00Z**

Failing test created: great-white-shark.test.ts - confirms both hashedId (wrong: 'ZqEegBydNw7NkA59J61b', expected: '3Zbym56qLxRNBRp7Eekd') and vendorValue (wrong: 77, expected: 41) are incorrect.

**2026-03-02T08:55:07Z**

Fix applied:
- Updated Great White Shark hashedId from 'ZqEegBydNw7NkA59J61b' to '3Zbym56qLxRNBRp7Eekd'
- Updated Great White Shark vendorValue from 77 to 41 (correct value)
- Files modified: /home/felix/idle-mmo-profiter/src/data/defaults.json
- Tests: All 362 tests passing (including new great-white-shark.test.ts with 3 tests)
- Vendor validation: Great White Shark vendor value confirmed correct (41)

**2026-03-02T08:55:26Z**

Fixer agent completed: Fixed hashedId from ZqEegBydNw7NkA59J61b to 3Zbym56qLxRNBRp7Eekd, fixed vendorValue from 77 to 41. All 362 tests pass.

**2026-03-02T08:56:29Z**

## Code Review: APPROVED

Files reviewed:
- /home/felix/idle-mmo-profiter/src/data/defaults.json (lines 907-914)
- /home/felix/idle-mmo-profiter/src/tests/data/great-white-shark.test.ts (new file, 23 lines)

### Data Change Verification
- hashedId correctly updated from ZqEegBydNw7NkA59J61b to 3Zbym56qLxRNBRp7Eekd
- vendorValue correctly updated from 77 to 41
- No other fields were inadvertently modified (marketPrice, lastUpdated, suggestedRefreshMinutes all unchanged)
- No remaining references to the old hashed ID (ZqEegBydNw7NkA59J61b) in source code

### Test Quality
- 3 focused tests covering: hashed ID correctness, vendor value correctness, and resource presence/identity
- Each test is self-contained with clear assertions
- Proper use of optional chaining and toBeDefined() guard
- Tests follow project conventions (vitest, describe/it blocks)

### Results
- Linter: PASS (ESLint clean on test file; JSON file correctly excluded from ESLint config)
- Tests: All 362 passing (25 test files), including 3 new Great White Shark tests
- Style Guide: Compliant
- No stale references: Confirmed no source files reference the old hashed ID

No issues found. Ready for user review.

**2026-03-02T08:56:42Z**

Review: APPROVED - All changes correct, no stale references, 362 tests pass, linter clean.
