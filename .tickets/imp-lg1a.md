---
id: imp-lg1a
status: closed
deps: [imp-40gu]
links: []
created: 2026-02-27T22:12:18Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-259e
tags: [test, verification]
---
# Test: Verify craftable hashedIds are populated from recipe data

## Summary

Verify that the fix in imp-40gu correctly populates craftable hashedIds from their source recipes' `producesItemHashedId` field, and that this survives the export-to-defaults workflow.

## Tests to Write

**File: `src/tests/composables/useDataProvider.test.ts`** (extend existing)

### 1. Test: Craftable hashedId populated from recipe producesItemHashedId

- Set up default data with a recipe that has `producesItemName: 'Test Item'` and `producesItemHashedId: 'abc123'`
- Include a craftableRecipe with `name: 'Test Item'`
- Create data provider (triggers sync loop)
- Verify the generated craftable has `hashedId: 'abc123'`

### 2. Test: Craftable hashedId empty when recipe has no producesItemHashedId

- Set up default data with a recipe that has `producesItemName: 'Test Item'` but no `producesItemHashedId`
- Create data provider
- Verify the generated craftable has `hashedId: ''` (graceful fallback)

### 3. Test: Export-to-defaults roundtrip preserves craftable hashedIds

- Set up data with recipes that have `producesItemHashedId` populated
- Let sync loop generate craftables (which should now have hashedIds)
- Export to defaults JSON
- Parse exported JSON
- Verify craftable entries have non-empty hashedIds matching their source recipes

### 4. Test: Craftable in defaults.json preserves its hashedId (no re-generation)

- Set up defaults.json that already has craftables with hashedIds populated
- Ensure the sync loop does NOT overwrite existing craftables (name-check: `!craftableNames.has(recipe.name)`)
- Verify hashedIds from defaults are preserved

## Acceptance Criteria
- [ ] All tests pass
- [ ] Tests cover both the "hashedId populated" and "hashedId missing on recipe" cases
- [ ] Tests verify the export roundtrip scenario
