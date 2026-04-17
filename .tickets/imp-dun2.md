---
id: imp-dun2
status: closed
deps: [imp-j645]
links: []
created: 2026-03-04T19:33:14Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Phase 2: useCharacterTracker composable (storage and business logic)

Create the core composable that manages character data, inventory, and history snapshots.

## File: src/composables/useCharacterTracker.ts

### Storage
- Use existing useStorage<CharacterStore> composable with key 'characterTracker'
- Default value: { characters: [], activeCharacterId: null }
- All data persists to localStorage via the existing singleton useStorage pattern

### Exposed state (reactive refs/computed)
- characters: Ref<Character[]>
- activeCharacter: Computed<Character | null> (derived from activeCharacterId)
- pendingChanges: Ref<Map<string, PendingInventoryEdit>> (tracks unsaved edits per hashId)
- hasPendingChanges: Computed<boolean>

### PendingInventoryEdit type (internal to composable)
- hashId: string
- quantity: number (0 means remove)

### Character CRUD methods
- addCharacter(name: string): string (returns generated id)
- removeCharacter(id: string): void
- renameCharacter(id: string, name: string): void
- setActiveCharacter(id: string): void
- updateGold(gold: number): void (updates active character's gold)

### Inventory editing (bulk/pending pattern)
- setItemQuantity(hashId: string, quantity: number): void
  - Adds to pendingChanges map; does NOT write to character.inventory yet
  - If quantity is 0, marks for removal
- removeItem(hashId: string): void
  - Shorthand for setItemQuantity(hashId, 0)
- discardChanges(): void
  - Clears pendingChanges map
- getEffectiveInventory(): Computed<CharacterInventoryItem[]>
  - Merges character.inventory with pendingChanges for display

### Save (creates history snapshot)
- saveSnapshot(): void
  1. Apply pendingChanges to active character's inventory
  2. Create a CharacterSnapshot with current timestamp, gold, and inventory
  3. Append snapshot to character.history
  4. Clear pendingChanges
  - This is the ONLY way changes become permanent

### Value calculation helper
- calculateSnapshotValue(snapshot: CharacterSnapshot, priceResolver: (hashId: string) => number): number
  - Returns snapshot.gold + sum(item.quantity * priceResolver(item.hashId))
  - priceResolver will be provided by the component using useDataProvider price maps

### Item lookup helper
- resolveItemName(hashId: string): string
  - Uses useDataProvider to look up item name from hashId across materials, craftables, resources, recipes
  - Falls back to hashId string if not found

## Notes
- Follows the singleton composable pattern used by useDataProvider
- Uses useStorage for automatic localStorage sync (no manual JSON.parse/stringify needed)
- The pending changes pattern ensures multiple edits = one history entry on save
- priceResolver is injected from the component layer so the composable stays decoupled from useDataProvider

## Acceptance Criteria

Composable created with full CRUD, bulk edit, snapshot save, and value calculation. Unit tests pass for all methods.


**2026-03-04T19:38:13Z**

useCharacterTracker composable created with:
- Singleton pattern using useStorage
- CRUD: addCharacter, removeCharacter, renameCharacter, setActiveCharacter, updateGold
- Pending changes pattern: setItemQuantity, removeItem, discardChanges
- getEffectiveInventory computed for preview
- saveSnapshot with HISTORICAL PRICES (stores priceAtTime at save time)
- calculateSnapshotValue uses item.priceAtTime for true historical values
- Helper methods: resolveItemName, resolveCurrentPrice
