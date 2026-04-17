---
id: imp-10qg
status: closed
deps: []
links: []
created: 2026-03-09T15:45:24Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ib1d
---
# Phase 1: Add skill field to ItemUse interface and populate it

## Changes

### File: /home/felix/idle-mmo-profiter/src/composables/useItemUses.ts

1. Add optional `skill` field to the `ItemUse` interface:
   ```ts
   skill?: 'alchemy' | 'forging' | string  // For tab grouping
   ```

2. Populate `skill` when creating craftable-material uses (line ~158):
   ```ts
   uses.push({
     type: 'craftable-material',
     context: `${recipe.name}${skillText}`,
     detail: quantityText,
     skill: recipe.skill,  // ADD THIS
   })
   ```

3. Populate `skill` when creating resource-material uses (line ~172):
   ```ts
   uses.push({
     type: 'resource-material',
     context: `${recipe.name} (${recipe.skill})`,
     detail: quantityText,
     skill: recipe.skill,  // ADD THIS - smelting, cooking, etc.
   })
   ```

4. Optionally populate `skill` for gathering-source uses with the gathering skill.

This enables the popover to group uses by skill without regex-parsing the context string.

## Acceptance Criteria

- ItemUse interface has skill field
- All craftable-material uses have skill = 'alchemy' | 'forging'
- All resource-material uses have skill populated
- No changes to consumer components needed
- TypeScript compiles without errors


## Notes

**2026-03-09T15:49:20Z**

Phase 1 implementation complete:
- Added skill field to ItemUse interface
- Populated skill field for craftable-material uses (alchemy/forging)
- Populated skill field for resource-material uses (smelting, cooking, etc.)
- Populated skill field for gathering-source uses
- TypeScript compilation passes with no errors
- Build successful
