---
id: imp-jeks
status: open
deps: [imp-heis]
links: []
created: 2026-03-09T08:06:45Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-m64w
---
# Phase 3: Update all dungeon calculator tests

## Summary
Update all test files that call `calculateDungeonProfits` to pass the `taxRate` parameter and verify correct tax behavior.

## Changes Required

### src/tests/calculators/dungeonCalculator.test.ts
1. All existing `calculateDungeonProfits()` calls need the taxRate parameter added (use `mockTaxRate = 0.12` which already exists in the file)
2. Update expected value calculations in test comments/assertions:
   - Tradable drops: EV = price * (1 - 0.12) * chance * (1 + MF/100)
   - Untradable drops: EV = price * chance * (1 + MF/100) (unchanged)
3. Add NEW test cases:
   - Test that tradable drop EV is reduced by tax: `EV = price * 0.88 * chance`
   - Test that untradable drop EV is NOT taxed (no double-taxation)
   - Test with mixed tradable/untradable drops in same dungeon
   - Test with taxRate = 0 (no tax applied, everything at full price)

### src/tests/calculators/stormbringer-bug.test.ts
- Update calculateDungeonProfits calls if any exist (check and update)

### src/tests/composables/useMagicFindConfig.test.ts (lines 385-466)
- Update calculateDungeonProfits calls to include taxRate
- These tests import the calculator directly

### src/tests/calculators/profitRanker.test.ts
- The profitRanker does NOT call calculateDungeonProfits directly (it receives pre-computed results), so it likely does NOT need changes. But verify.

## Files
- /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts
- /home/felix/idle-mmo-profiter/src/tests/calculators/stormbringer-bug.test.ts
- /home/felix/idle-mmo-profiter/src/tests/composables/useMagicFindConfig.test.ts
- /home/felix/idle-mmo-profiter/src/tests/calculators/profitRanker.test.ts (verify only)

## Acceptance Criteria

- All existing tests pass with updated taxRate parameter
- New test: tradable drop EV is reduced by 12% tax
- New test: untradable drop EV is NOT double-taxed
- New test: mixed tradable/untradable dungeon
- New test: taxRate = 0 edge case
- All tests pass: npm run test

