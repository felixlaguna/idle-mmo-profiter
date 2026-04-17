---
id: imp-99yq
status: closed
deps: []
links: []
created: 2026-03-04T19:59:32Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Iteration: Store API item names alongside inventory items

## Problem
When items are added from the API search, their names cannot be resolved by resolveItemName() because the item is not in defaults.json. The itemNameMap only contains items from useDataProvider (materials, craftables, resources, recipes arrays).

## Solution
Store the item name alongside the hashId when adding items to pending changes and inventory. This way resolveItemName() can always return the correct name regardless of whether the item exists in defaults.json.

## Changes

### File: /home/felix/idle-mmo-profiter/src/types/index.ts
- Add optional `name` field to CharacterInventoryItem interface: `name?: string`

### File: /home/felix/idle-mmo-profiter/src/composables/useCharacterTracker.ts
- Add `name` to PendingInventoryEdit interface
- Update setItemQuantity() to accept optional `name` parameter
- Store name in inventory items when saving snapshots
- Add a local apiItemNames Map<string, string> (hashId -> name) populated from API results
- Update resolveItemName() to check: (1) inventory item name, (2) apiItemNames map, (3) dataProvider itemNameMap, (4) fallback to hashId
- Update resolveCurrentPrice() to check apiItemPrices map too (for price display before snapshot)

### File: /home/felix/idle-mmo-profiter/src/tests/composables/useCharacterTracker.test.ts
- Add tests for resolving names of API-sourced items not in defaults
- Add tests for name persistence across save/load cycles

## Acceptance Criteria

- resolveItemName() returns correct name for items not in defaults.json
- Item names survive page reload (stored in inventory/snapshots)
- Existing items from defaults.json still resolve correctly
- All existing tests still pass


## Notes

**2026-03-04T20:03:53Z**

Implementation complete. Added name field to CharacterInventoryItem type and composable support for API items.

Files modified:
- /home/felix/idle-mmo-profiter/src/types/index.ts - Added optional name field to CharacterInventoryItem
- /home/felix/idle-mmo-profiter/src/composables/useCharacterTracker.ts - Added API item Maps, updated setItemQuantity, resolveItemName, resolveCurrentPrice
- /home/felix/idle-mmo-profiter/src/tests/composables/useCharacterTracker.test.ts - Added 7 tests for API item handling

Key features:
- storeApiItemData() method to cache API item names/prices
- setItemQuantity() accepts optional name parameter
- resolveItemName() checks: inventory → pending → API map → defaults → fallback
- resolveCurrentPrice() checks: API map → defaults → fallback
- Names persist through save/load cycles

Tests: 619/619 passing
Type check: PASS
