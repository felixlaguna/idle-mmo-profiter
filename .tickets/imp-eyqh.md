---
id: imp-eyqh
status: closed
deps: [imp-9kjk]
links: []
created: 2026-03-04T17:39:31Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mshp
---
# Phase 5: Tests - unit and integration tests for MF config feature

## Goal
Write tests to verify the MF configuration feature works correctly.

## Files to Create

### NEW: src/tests/composables/useMagicFindConfig.test.ts
- Test completedDungeons persistence (add/remove/toggle)
- Test dungeonMF computed returns correct count
- Test totalMF sums all 4 components correctly
- Test allSelectableDungeons merges and sorts correctly (18 profit + 6 MF-only = 24)
- Test MF_ONLY_DUNGEONS contains exactly the 6 expected names
- Test toggleDungeon adds if missing, removes if present
- Test that dungeonMF syncs back to magicFind.dungeon

### NEW: src/tests/components/MagicFindPanel.test.ts
- Test total MF text displays correctly
- Test collapse/expand toggle
- Test dungeon button shows correct count
- Test dungeon button emits 'open-dungeon-selector' event
- Test EditableValue inputs for streak, items, bonus

### NEW: src/tests/components/DungeonSelector.test.ts  
- Test all 24 dungeons rendered
- Test checkbox toggle updates completedDungeons
- Test MF-only dungeons have distinguishing badge
- Test Select All / Deselect All
- Test close via X button and Escape key
- Test count display updates

### Existing test updates:
- src/tests/calculators/dungeonCalculator.test.ts: Add test verifying dungeon profits update when magicFind.dungeon changes
- Verify no regressions in existing dungeon calculator tests

## Testing Approach
- Use vitest + @vue/test-utils (matching existing test patterns)
- Mock localStorage for composable tests
- Use mount/shallow for component tests
- The existing test setup at src/tests/setup.ts should be followed

## Acceptance Criteria
- [ ] useMagicFindConfig composable fully tested
- [ ] MagicFindPanel component tested for rendering and interaction
- [ ] DungeonSelector component tested for selection logic
- [ ] No regressions in existing dungeonCalculator tests
- [ ] All tests pass: npm run test

## Acceptance Criteria

All new tests pass, no regressions in existing tests


## Notes

**2026-03-04T17:53:20Z**

Reviewing existing test coverage:
- useMagicFindConfig.test.ts: 27 tests ✓ (already created)
- DungeonSelector.test.ts: 30 tests ✓ (already created)
- dungeonCalculator.test.ts: Tests for recipe pricing, MF bonus applied to profits ✓

Missing tests:
- MagicFindPanel.test.ts: Component rendering, collapse/expand, event emission
- Integration test: Verify MF settings changes update dungeon profits reactively

**2026-03-04T17:54:24Z**

Created MagicFindPanel.test.ts with comprehensive tests covering:
- Rendering (summary display, buttons, initial state)
- Collapse/expand functionality
- Dungeon button click event emission
- EditableValue component integration
- Breakdown summary display
- Integration with useMagicFindConfig
- Reactivity of all MF components
- Accessibility attributes
- Edge cases (zero values, large values, rapid toggling)

Now adding integration test to verify MF changes update dungeon profits reactively.

**2026-03-04T17:56:38Z**

Test implementation complete:

✓ MagicFindPanel.test.ts (35 tests) - NEW
  - Rendering tests (summary, buttons, initial state)
  - Collapse/expand functionality
  - Dungeon button event emission
  - EditableValue integration
  - Breakdown summary display
  - useMagicFindConfig integration
  - Reactivity tests
  - Accessibility tests
  - Edge case tests

✓ dungeonCalculator.test.ts integration tests (6 new tests)
  - MF reactivity for streak changes
  - MF reactivity for dungeon changes
  - MF reactivity for all components
  - Total profit updates with MF
  - Multiple dungeons update with MF
  - Multiple drops per dungeon with MF

✓ useMagicFindConfig.test.ts (27 tests) - Already existed
✓ DungeonSelector.test.ts (30 tests) - Already existed

Total: 98 tests for Magic Find feature
All tests passing (582/582 total in project)
