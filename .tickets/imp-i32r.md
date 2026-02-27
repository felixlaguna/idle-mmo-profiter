---
id: imp-i32r
status: closed
deps: []
links: []
created: 2026-02-27T12:27:02Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-dh5d
---
# Phase 1: Add uses=1 to Improved Fishing Rod Recipe in defaults.json

The Improved Fishing Rod Recipe (id: rec-1) in src/data/defaults.json currently has no 'uses' field. Add uses=1 to this recipe entry.

File to modify:
- /home/felix/idle-mmo-profiter/src/data/defaults.json (line ~134-141)

Current state (rec-1):
  {
    "id": "rec-1",
    "name": "Improved Fishing Rod Recipe",
    "price": 260.1,
    "chance": 0.05,
    "hashedId": "JZdg5V3PQo4vNEyWq0zl",
    "vendorValue": 10
  }

Target state:
  {
    "id": "rec-1",
    "name": "Improved Fishing Rod Recipe",
    "price": 260.1,
    "chance": 0.05,
    "hashedId": "JZdg5V3PQo4vNEyWq0zl",
    "vendorValue": 10,
    "uses": 1
  }

This is a simple data-only change. No logic changes needed.

## Acceptance Criteria

Improved Fishing Rod Recipe (rec-1) has uses=1 in defaults.json


## Notes

**2026-02-27T12:29:40Z**

Added uses=1 field to rec-1 (Improved Fishing Rod Recipe) in defaults.json
