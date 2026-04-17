---
id: imp-5r8o
status: closed
deps: [imp-nwiy, imp-b2yq]
links: []
created: 2026-03-05T09:20:32Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ebbl
---
# Phase 6: Tests & Integration Verification

## Objective
Write unit and integration tests for the new resource recipe and efficiency systems.

## Test Files to Create/Update

### 1. Resource recipe calculator tests
- /home/felix/idle-mmo-profiter/src/tests/calculators/resourceCalculator.test.ts
- Test 3-mode generation from a single recipe
- Test efficiency modifier application
- Test edge cases: zero materials, missing prices, zero time

### 2. Efficiency composable tests
- /home/felix/idle-mmo-profiter/src/tests/composables/useEfficiencyConfig.test.ts
- Test singleton behavior
- Test item selection (only one per skill)
- Test getEfficiency calculations
- Test applyEfficiency formula
- Test localStorage persistence

### 3. Component tests
- /home/felix/idle-mmo-profiter/src/components/__tests__/EfficiencyPanel.test.ts
- Test collapsible behavior
- Test skill display based on added recipes
- /home/felix/idle-mmo-profiter/src/components/__tests__/EfficiencyItemSelector.test.ts
- Test radio selection behavior
- Test modal open/close
- Test keyboard accessibility

### 4. Data provider tests
- Test addResourceRecipe / removeResourceRecipe
- Test auto-generation of 3 resourceGathering entries
- Test that existing craftable/resource logic is unaffected

### 5. Integration verification
- Verify efficiency modifies profit/hr in the ranked activities
- Verify resource recipes show up in 'All Activities' tab
- Verify export/import includes resource recipes
- Verify no regressions in crafting tab or dungeon tab

## Test Patterns to Follow
- Existing tests in /home/felix/idle-mmo-profiter/src/tests/
- Component tests in /home/felix/idle-mmo-profiter/src/components/__tests__/
- Use vitest, @vue/test-utils for component tests

## Acceptance Criteria

- All new unit tests pass
- All existing tests still pass (no regressions)
- Calculator tests cover edge cases
- Composable tests verify singleton and persistence
- Component tests verify accessibility


## Notes

**2026-03-05T15:48:51Z**

Post-release fix (e5bff62): Bug fixes applied to efficiency selection, skill mapping, and resource table UX. All changes verified by CI pipeline passing.
