---
id: imp-o6lg
status: closed
deps: []
links: []
created: 2026-03-04T20:18:31Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Iteration 2a: Revert runtime API search from CharacterTracker

Revert the runtime API search UI changes added in iteration 1. The Character Tracker should go back to searching only from local data.

## Files to modify

### /home/felix/idle-mmo-profiter/src/components/CharacterTracker.vue

REMOVE:
- Line 7-8: Remove imports of searchItems, getAverageMarketPrice from ../api/services and apiClient from ../api/client
- Lines 22-25: Remove apiSearchResults, apiSearchCompleted, isSearching, searchError reactive refs
- Lines 101-152: Revert the search watch handler. Remove the API search path (apiClient.isConfigured branch). Keep the simple debounce pattern that sets debouncedSearchQuery.
- Lines 190-203 (filteredItems computed): Remove the API branch (apiClient.isConfigured && apiSearchCompleted). Always use local allItems filtering.
- Lines 206-236 (addItemToInventory): Make it a synchronous function again. Remove the async keyword, remove the market price fetch via getAverageMarketPrice. Simply call tracker.setItemQuantity with the item price from local data. Keep passing item.name to setItemQuantity.
- Template lines 589-611: Remove the search-status div (API connected / local search hints), search-error span, search-loading div with spinner, and loading spinner animation. Keep the search-no-results div.
- CSS: Remove .search-status, .search-hint, .search-hint.api-connected, .search-hint.local-search, .search-error, .search-loading, .loading-spinner, @keyframes spin styles.

KEEP:
- The allItems computed (lines 155-187) that gathers items from dataProvider - this will be expanded in a later ticket to also include allItems from defaults.json
- The name parameter being passed to tracker.setItemQuantity
- The basic debounce pattern for search

### /home/felix/idle-mmo-profiter/src/composables/useCharacterTracker.ts

REMOVE:
- Lines 73-75: Remove apiItemNames and apiItemPrices Maps (ref<Map<string, string>> and ref<Map<string, number>>)
- Line 182: Simplify resolveCurrentPrice to only use itemPriceMap (remove apiItemPrices.value.get check)
- Lines 325-327: Remove the API items map check from resolveItemName (remove the apiItemNames.value.get branch)
- Lines 341-346: Remove the storeApiItemData function entirely
- Remove storeApiItemData from the return object

KEEP:
- name field on PendingInventoryEdit
- name parameter on setItemQuantity
- resolveItemName checking inventory item name and pending name (steps 1 and 2 of the lookup chain)
- resolveItemName checking itemNameMap (defaults.json lookup, step 3)

### /home/felix/idle-mmo-profiter/src/tests/components/CharacterTracker.test.ts

DELETE this entire file. It only tests API search integration which is being removed.

### /home/felix/idle-mmo-profiter/src/tests/composables/useCharacterTracker.test.ts

Update the 'API item name handling' describe block (around line 428):
- Remove tests that reference storeApiItemData
- Keep tests that verify name persistence through save/load cycle (the name field on inventory items is still useful)
- Update test descriptions to not reference 'API items'

## Acceptance Criteria

- No imports from api/services or api/client in CharacterTracker.vue
- No apiSearchResults, isSearching, searchError refs in CharacterTracker.vue
- addItemToInventory is a synchronous function
- filteredItems always uses local allItems filtering
- No API search UI elements (loading spinner, API connected hint, error state)
- No apiItemNames/apiItemPrices Maps in useCharacterTracker.ts
- No storeApiItemData function
- CharacterTracker.test.ts deleted
- All remaining tests pass
- TypeScript type check passes


## Notes

**2026-03-04T20:23:07Z**

Revert complete. Removed API search functionality from CharacterTracker.vue and useCharacterTracker.ts.

Changes:
- Removed searchItems and getAverageMarketPrice imports
- Removed API search state (apiSearchResults, isSearching, searchError, etc.)
- Reverted search watch handler to simple debounce
- Made addItemToInventory synchronous
- Removed API search UI elements (loading spinner, status hints, error display)
- Removed apiItemNames and apiItemPrices Maps from composable
- Removed storeApiItemData function
- Deleted CharacterTracker.test.ts
- Updated useCharacterTracker.test.ts to remove storeApiItemData tests

All tests passing (617/617). TypeScript type check passes.
