---
id: imp-rja2
status: closed
deps: [imp-myur]
links: []
created: 2026-03-24T08:16:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-28f5
---
# Phase 2: Update tests for recursive resolution

Update the existing test file and add new test cases for recursive material resolution.

## File
- src/tests/calculators/iron-fitting-cross-recipe-bug.test.ts

## Test cases to update/add

1. **Update existing test**: 'Iron Fitting gather modes should have DIFFERENT timeSeconds than buy-all mode' (line 135-179)
   - Currently expects gather time = buyAll + Iron Bar craftTime * 3 = 115 + 62.7 = 177.7
   - Must expect gather time = buyAll + (Iron Bar craftTime + Iron Ore gatherTime) * 3 = 115 + (20.9+20.9)*3 = 240.4
   - Must expect gather-all time = buyAll + (Iron Bar craftTime + Iron Ore gatherTime + Coal gatherTime) * 3 = 115 + (20.9+20.9+10.9)*3 = 273.1

2. **New test**: 'Gather mode should include raw material gather times recursively'
   - Verify Iron Fitting (gather) includes Iron Ore mining time but NOT Coal mining time
   - Verify Iron Fitting (gather all) includes BOTH Iron Ore and Coal mining times

3. **New test**: 'Gather mode baseCost should include coal purchase cost'
   - Verify Iron Fitting (gather) baseCost = 3 * Coal market price (buying coal)
   - Verify Iron Fitting (gather all) baseCost = 0 (gathering everything)

4. **New test**: 'Buy-all mode should be unaffected by recursive resolution'
   - Verify Iron Fitting (buy all) time = 115s, baseCost = 3 * Iron Bar market price

5. **New test**: 'Non-cross-recipe items should be unaffected'
   - Pick a simple recipe (e.g., Iron Bar itself) and verify its 3 modes are unchanged

## Acceptance Criteria

- All tests pass
- Existing tests updated with correct expected values
- New tests cover: recursive time calculation, coal exclusion in gather mode, baseCost correctness, non-regression for simple recipes


## Notes

**2026-03-24T08:20:09Z**

Tests updated to reflect correct recursive resolution values. Replaced shallow-fix assertions with precise expected values: Buy All=115s/84g, Gather=240.4s/16.8g, Gather All=273.1s/0g. Added 11 focused tests covering prerequisites, each mode, and ordering invariants. All 685 tests passing.
