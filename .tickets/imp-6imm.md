---
id: imp-6imm
status: closed
deps: [imp-o6do]
links: []
created: 2026-03-09T08:20:39Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-acs4
---
# Phase 5: Tests

Write unit tests for the item uses feature.

## Files to Create
- `/home/felix/idle-mmo-profiter/src/tests/useItemUses.test.ts`
- `/home/felix/idle-mmo-profiter/src/tests/ItemUsesPopover.test.ts`

## Test Coverage for useItemUses Composable

### Index Building Tests
- Materials used in craftable recipes are correctly indexed
- Materials used in resource recipes are correctly indexed
- Recipe names mapped to dungeons correctly
- Gathering sources mapped correctly
- Recipe product mappings correct

### getItemUses() Tests
- Item with multiple use types returns all of them (e.g., Trout: craftable material + resource material + gathering source)
- Item with no uses returns empty array
- Item used in only one recipe returns correct single use
- Quantities are correctly reported
- Profit/hr values are included when available

### Edge Cases
- Item name that doesn't exist in any data source
- Item that appears in the same recipe twice (if possible)
- Empty data provider (no recipes, no dungeons)

## Test Coverage for ItemUsesPopover Component

### Rendering Tests
- Renders with correct item name
- Shows correct number of uses grouped by category
- Shows 'No demand sources found' when item has no uses
- Category headers show correct type colors

### Interaction Tests
- Closes on Escape key
- Closes on click outside
- Does not close on click inside

### Positioning Tests (if feasible with test utils)
- Positions near anchor rect
- Adjusts when near viewport edge

## Testing Infrastructure
- Use vitest (already configured)
- Use @vue/test-utils for component tests
- Mock useDataProvider data for controlled test scenarios

## Acceptance Criteria

- useItemUses composable has 90%+ coverage
- All 5 reverse-lookup indexes tested with at least 2 scenarios each
- getItemUses returns correct results for Trout (multi-use), Coal (multi-use), and a single-use item
- Edge case: item not found returns empty
- ItemUsesPopover renders correctly in happy path
- All tests pass with vitest run

