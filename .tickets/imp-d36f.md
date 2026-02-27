---
id: imp-d36f
status: closed
deps: [imp-hi4l]
links: []
created: 2026-02-27T12:56:21Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-wwfn
---
# Phase 4: Tests for skill inference and sub-tab filtering

Add tests covering the new skill field, the material-based inference heuristic, and verify existing tests still pass.

### Files to modify:

1. **src/tests/calculators/potionCalculator.test.ts**
   Add a new describe block 'skill inference' with these test cases:

   a) 'should pass through skill from PotionCraft when present'
      - Create a PotionCraft with skill: 'alchemy'
      - Verify result.skill === 'alchemy'

   b) 'should infer alchemy from Vial material name'
      - Create a PotionCraft without skill field
      - Give it a material named 'Gleaming Vial' (quantity 1)
      - Verify result.skill === 'alchemy'

   c) 'should infer forging from Crystal material name'
      - Create a PotionCraft without skill field
      - Give it a material named 'Elemental Crystal' (quantity 1)
      - Verify result.skill === 'forging'

   d) 'should return undefined skill when no Vial or Crystal in materials'
      - Create a PotionCraft without skill field
      - Give it materials with names like 'Moose antler', 'Minotaur Hide'
      - Verify result.skill === undefined

   e) 'should prefer explicit skill over inferred skill'
      - Create a PotionCraft with skill: 'forging' but materials containing a Vial
      - Verify result.skill === 'forging' (explicit wins)

### Test data patterns:
- Reuse the existing mockPotionCraft as a base, spread and override as needed
- Use mockTaxRate (0.12) already defined in the file
- No recipes needed for these tests (pass empty array)

### Existing tests:
- All 6 existing tests in 'recipe cost logic' and 'basic profitability calculations' must still pass
- The existing mockPotionCraft has materials 'Moose antler' and 'Minotaur Hide' (neither Vial nor Crystal), so it should have skill=undefined — verify this does not break existing assertions (it should not, since existing assertions do not check result.skill)

### No new test files needed:
- All tests go in the existing potionCalculator.test.ts file

## Acceptance Criteria

- All 5 new skill inference tests pass
- All 6 existing tests still pass (no regressions)
- Tests cover: explicit skill passthrough, Vial inference, Crystal inference, no-match returns undefined, explicit beats inferred
- vitest run completes with zero failures


## Notes

**2026-02-27T13:03:04Z**

Phase 4 implementation complete.

Phase 4 tests were already implemented in Phase 2 as part of the TDD approach.

Files modified:
- /home/felix/idle-mmo-profiter/src/tests/calculators/potionCalculator.test.ts - Added 5 new tests for skill inference

Tests added:
1. should pass through skill from PotionCraft when present
2. should infer alchemy from Vial material name
3. should infer forging from Crystal material name
4. should return undefined skill when no Vial or Crystal in materials
5. should prefer explicit skill over inferred skill

All tests passing (216/216):
- 5 new skill inference tests: PASS
- All existing tests: PASS (no regressions)
