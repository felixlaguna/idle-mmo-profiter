---
id: imp-h9d6
status: closed
deps: [imp-dun2]
links: []
created: 2026-03-04T19:34:02Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Phase 5: Unit tests for useCharacterTracker composable

Write comprehensive unit tests for the useCharacterTracker composable.

## File: src/tests/composables/useCharacterTracker.test.ts

### Test groups

#### Character CRUD
- addCharacter creates a character with unique id and empty inventory
- addCharacter with duplicate name is allowed (no uniqueness constraint)
- removeCharacter deletes character and clears activeCharacterId if it was active
- renameCharacter updates name correctly
- setActiveCharacter switches active character
- setActiveCharacter with invalid id is a no-op

#### Gold management
- updateGold sets gold on active character
- updateGold when no active character is a no-op

#### Inventory pending changes
- setItemQuantity adds to pendingChanges map
- setItemQuantity with quantity 0 marks item for removal
- removeItem is equivalent to setItemQuantity(hashId, 0)
- discardChanges clears all pending changes
- getEffectiveInventory merges character inventory with pending changes
- getEffectiveInventory removes items with quantity 0

#### Save snapshot
- saveSnapshot applies pending changes to inventory
- saveSnapshot creates a history entry with timestamp, gold, and inventory
- saveSnapshot clears pending changes after saving
- saveSnapshot with no active character is a no-op
- Multiple saves create multiple history entries (append-only)

#### Value calculation
- calculateSnapshotValue returns gold + sum of (quantity * price) using priceResolver
- calculateSnapshotValue with empty inventory returns just gold
- calculateSnapshotValue with unknown items (priceResolver returns 0) handles gracefully

#### Persistence
- Data persists to localStorage via useStorage
- Loading from localStorage restores characters and history
- Empty localStorage uses default empty state

## Test patterns
- Use vitest with happy-dom environment (matches existing config)
- Mock localStorage via existing test setup (src/tests/setup.ts)
- Reset useStorage singleton cache between tests to avoid state leakage

## Acceptance Criteria

All tests pass. Coverage includes CRUD, pending changes, snapshot save, value calculation, and persistence.


## Notes

**2026-03-04T19:42:53Z**

Unit tests created for useCharacterTracker with 28 test cases covering:
- Singleton pattern
- Character CRUD (add, remove, rename, set active)
- Gold management
- Inventory pending changes (add, remove, discard, effective inventory)
- Save snapshot (apply changes, create history, clear pending)
- Value calculation (using priceAtTime for historical prices)
- Persistence (localStorage sync via useStorage)

All 28 tests passing. Used resetCharacterTrackerInstance() to properly reset singleton between tests.
