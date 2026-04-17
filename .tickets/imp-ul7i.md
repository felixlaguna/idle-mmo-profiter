---
id: imp-ul7i
status: closed
deps: []
links: []
created: 2026-03-23T09:58:11Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-28f5
---
# Phase 1: Add 'construction' to ResourceSkill type and UI skill maps

Update the TypeScript type definitions and UI components to recognize 'construction' as a valid resource skill.

Files to modify:
- src/types/index.ts: Add 'construction' to ResourceSkill union type (line 99)
- src/components/ResourceTable.vue: Add 'construction' to formatSkillShort() map (line 242) and add .skill-construction CSS class with a distinct color
- src/utils/formatting.ts: No change needed (auto-capitalizes)

Details:
1. In src/types/index.ts line 99, change:
   export type ResourceSkill = 'smelting' | 'cooking' | 'woodcutting' | 'mining' | 'fishing' | 'hunt' | 'dungeon'
   to include 'construction':
   export type ResourceSkill = 'smelting' | 'cooking' | 'woodcutting' | 'mining' | 'fishing' | 'hunt' | 'dungeon' | 'construction'

2. In ResourceTable.vue formatSkillShort(), add:
   construction: 'Build'

3. In ResourceTable.vue CSS, add .skill-construction with a unique color (suggest orange/amber since it is not yet used)

## Acceptance Criteria

- 'construction' is a valid ResourceSkill type
- Skill badge renders with correct short name and color in ResourceTable
- No TypeScript errors


## Notes

**2026-03-23T10:01:01Z**

Phase 1 complete: Added 'construction' to ResourceSkill union type in src/types/index.ts and added short label 'Build' and yellow CSS badge color in ResourceTable.vue
