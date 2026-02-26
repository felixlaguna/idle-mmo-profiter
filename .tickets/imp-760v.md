---
id: imp-760v
status: closed
deps: []
links: []
created: 2026-02-25T18:32:48Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-64ql
---
# Implement localStorage persistence manager

Create src/storage/persistence.ts:

- StorageManager class handling all localStorage operations
- Namespaced keys: 'immo-profit:settings', 'immo-profit:prices', 'immo-profit:overrides'
- Methods:
  - getSettings(): AppSettings - load or return defaults
  - saveSettings(settings: AppSettings): void
  - getPriceOverrides(): Map<string, number> - user-edited prices
  - setPriceOverride(itemName: string, price: number): void
  - clearPriceOverride(itemName: string): void
  - clearAllOverrides(): void
  - getMfSettings(): MagicFindSettings
  - setMfSettings(mf: MagicFindSettings): void
  - exportAll(): string (JSON export of all user data)
  - importAll(json: string): void (restore from export)
- Merge strategy: default data < API data < user overrides (user always wins)
- Migration support: version number in storage, handle schema changes gracefully

## Acceptance Criteria

All user data persists across page reloads, export/import works


## Notes

**2026-02-26T08:38:14Z**

Analyzed existing codebase structure:
- Found existing useStorage.ts composable with 'idlemmo:' prefix
- Found useSettingsManager.ts with export/import functionality
- Need to create new StorageManager class with 'immo-profit:' prefix
- Types defined in src/types/index.ts (AppSettings, MagicFindSettings)
- Starting implementation of src/storage/persistence.ts

**2026-02-26T08:39:31Z**

Created src/storage/persistence.ts with StorageManager class:
- All required methods implemented
- Namespaced keys with 'immo-profit:' prefix
- Merge strategy support (default < API < user overrides)
- Migration support with version number
- Export/import functionality
- Type-safe with proper TypeScript types

Next: Setting up Vitest and writing comprehensive unit tests

**2026-02-26T08:41:36Z**

Tests complete - all 41 tests passing:
- getSettings/saveSettings with defaults and merge strategy
- getPriceOverrides/setPriceOverride/clearPriceOverride/clearAllOverrides
- getMfSettings/setMfSettings
- exportAll/importAll with version migration support
- applyPriceOverride/hasPriceOverride (merge strategy)
- clearAll/getStorageVersion
- Error handling (quota exceeded, invalid JSON)
- Integration test for full user workflow
- Namespace verification (immo-profit: prefix)

All acceptance criteria met:
✓ User data persists across page reloads
✓ Export/import works
✓ Merge strategy: default < API < user overrides
✓ Migration support with version number
✓ Type-safe with TypeScript
✓ Comprehensive test coverage
