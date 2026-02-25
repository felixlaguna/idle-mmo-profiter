---
id: imp-64ql
status: in_progress
deps: [imp-dv3t]
links: []
created: 2026-02-25T18:30:48Z
type: epic
priority: 2
assignee: Félix Laguna Teno
parent: imp-jug7
---
# Epic 3: Local Storage Persistence & Manual Data Entry

Implement localStorage persistence for all user-editable values and the settings UI. Every price and configurable value in the app must be manually editable and persisted to localStorage. When the user edits a value, it overrides both the default and API-fetched value.

Key features:
- API key entry and validation (stored in localStorage)
- All market prices for materials, potions, resources, recipes editable inline
- MF (Magic Find) settings editable: MF Streak, MF Dung, MF Item, MF Bonus
- Dungeon parameters editable: run cost, time
- Resource gathering parameters editable: time, cost, vendor value
- Potion crafting parameters editable: time, material quantities, vial cost
- 12% market tax configurable
- Reset to default / Reset to API values buttons
- Import/Export settings as JSON

