---
id: imp-zpq7
status: closed
deps: [imp-y1kr]
links: []
created: 2026-02-26T19:15:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-8p0b
---
# Phase 2: Rename in test scripts

Rename all 'White shark' references in test/validation scripts.

File 1: /home/felix/idle-mmo-profiter/scripts/test-resource-costs.ts (12 occurrences)
- Lines 46-49: Scenario 1 expected costs keys
- Lines 79-82: Scenario 2 expected costs keys + comments
- Lines 112-115: Scenario 3 expected costs keys

Rename mapping for all keys and comments:
- 'White shark' -> 'Great White Shark'
- 'Cooked White Shark' -> 'Cooked Great White Shark'
- 'Cooked White Shark full' -> 'Cooked Great White Shark full'
- 'Cooked White Shark full + coal' -> 'Cooked Great White Shark full + coal'
- Update comment text on line 80 ('White shark (56)' -> 'Great White Shark (56)')

File 2: /home/felix/idle-mmo-profiter/scripts/validate-vendor-values.js (2 occurrences)
- Line 13: 'White shark' -> 'Great White Shark'
- Line 14: 'Cooked White Shark' -> 'Cooked Great White Shark'

## Acceptance Criteria

All 14 occurrences across both script files updated. Scripts still run without errors.


## Notes

**2026-02-26T19:18:34Z**

Completed all replacements in test scripts. Updated 14 occurrences:

validate-vendor-values.js (2):
- Line 13: 'White shark' → 'Great White Shark'
- Line 14: 'Cooked White Shark' → 'Cooked Great White Shark'

test-resource-costs.ts (12):
- Lines 46-49: All 4 variants in first test case
- Lines 79-82: All 4 variants in second test case (including comment update)
- Lines 112-115: All 4 variants in third test case
