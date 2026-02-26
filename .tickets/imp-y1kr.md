---
id: imp-y1kr
status: closed
deps: []
links: []
created: 2026-02-26T19:15:40Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-8p0b
---
# Phase 1: Rename in defaults.json (data layer)

Rename all 'White shark' references in src/data/defaults.json.

File: /home/felix/idle-mmo-profiter/src/data/defaults.json

Occurrences (8 total):
- Line 149: "name": "White shark" -> "Great White Shark"
- Line 156: "name": "Cooked White Shark" -> "Cooked Great White Shark"
- Line 4659: "name": "White shark" -> "Great White Shark"
- Line 4666: "name": "Cooked White Shark" -> "Cooked Great White Shark"
- Line 4671: "resourceName": "White shark" -> "Great White Shark"
- Line 4685: "name": "Cooked White Shark full" -> "Cooked Great White Shark full"
- Line 4699: "name": "Cooked White Shark full + coal" -> "Cooked Great White Shark full + coal"

This is the most critical file -- it drives the application data.

## Acceptance Criteria

All 8 occurrences updated. No other data corrupted. App still loads defaults correctly.


## Notes

**2026-02-26T19:17:35Z**

Completed all replacements in defaults.json. Updated 7 occurrences:
- Line 149: 'White shark' → 'Great White Shark'
- Line 156: 'Cooked White Shark' → 'Cooked Great White Shark'
- Line 4659: 'White shark' → 'Great White Shark'
- Line 4666: 'Cooked White Shark' → 'Cooked Great White Shark'
- Line 4671: resourceName 'White shark' → 'Great White Shark'
- Line 4685: 'Cooked White Shark full' → 'Cooked Great White Shark full'
- Line 4699: 'Cooked White Shark full + coal' → 'Cooked Great White Shark full + coal'
