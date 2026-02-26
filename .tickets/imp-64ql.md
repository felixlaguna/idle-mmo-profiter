---
id: imp-64ql
status: closed
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


## Notes

**2026-02-26T08:42:18Z**

imp-760v COMPLETE - localStorage persistence manager implemented

Files created:
- /home/felix/idle-mmo-profiter/src/storage/persistence.ts (StorageManager class)
- /home/felix/idle-mmo-profiter/src/storage/persistence.test.ts (41 comprehensive tests)
- /home/felix/idle-mmo-profiter/src/storage/index.ts (module exports)
- /home/felix/idle-mmo-profiter/src/tests/setup.ts (test configuration)

Configuration updates:
- Updated vite.config.ts with test configuration
- Updated package.json with test scripts (test, test:ui, test:run)
- Installed Vitest + testing dependencies

Implementation details:
- StorageManager class with all required methods
- Namespaced keys: 'immo-profit:settings', 'immo-profit:overrides'
- Merge strategy support (default < API < user overrides)
- Migration support with version number
- Export/import functionality for user data backup
- Comprehensive error handling (quota exceeded, invalid JSON)
- Type-safe with TypeScript
- Singleton instance available (storageManager)

Test results: 41/41 tests passing
Build status: SUCCESS (no TypeScript errors)

All acceptance criteria met:
✓ User data persists across page reloads
✓ Export/import works
✓ All methods implemented per specification
✓ Full test coverage
