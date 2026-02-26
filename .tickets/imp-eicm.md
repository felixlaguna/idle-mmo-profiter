---
id: imp-eicm
status: closed
deps: [imp-y1kr]
links: []
created: 2026-02-26T19:15:53Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-8p0b
---
# Phase 3: Rename in test documentation

Rename all 'White shark' references in the test documentation file.

File: /home/felix/idle-mmo-profiter/src/tests/resource-cost-calculation.test.md (12 occurrences)

Lines to update: 66, 72, 74, 77, 79, 83, 93, 94, 95, 96, 123

Rename mapping:
- 'White shark' -> 'Great White Shark' (all case variants)
- 'Cooked White Shark' -> 'Cooked Great White Shark'
- 'Cooked White Shark full' -> 'Cooked Great White Shark full'
- 'Cooked White Shark full + coal' -> 'Cooked Great White Shark full + coal'

Note: This is a markdown test spec, so bold markers (**White shark**) should become (**Great White Shark**).

## Acceptance Criteria

All 12 occurrences updated. Markdown formatting preserved.


## Notes

**2026-02-26T19:19:29Z**

Completed all replacements in test documentation. Updated 12 occurrences in resource-cost-calculation.test.md:

- Line 66: Test scenario title
- Lines 72, 74, 77, 79, 83: Test steps and expected result
- Lines 93-96: Resource input requirements (4 resource descriptions)
- Line 123: Manual testing checklist item
