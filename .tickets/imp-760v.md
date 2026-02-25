---
id: imp-760v
status: open
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

