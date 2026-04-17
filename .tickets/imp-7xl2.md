---
id: imp-7xl2
status: closed
deps: [imp-99yq]
links: []
created: 2026-03-04T19:59:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Iteration: Wire API search into CharacterTracker item search UI

## Problem
The 'Add Item' search in CharacterTracker.vue (lines 102-145) builds a local allItems array from useDataProvider and filters it synchronously. This limits search to the ~451 items in defaults.json.

## Solution
When an API key is configured, replace the synchronous local search with an async call to searchItems() from src/api/services.ts. The existing API service already handles:
- Rate limiting (20 req/min)
- Response caching (24h TTL for item/search)
- Request deduplication
- Graceful fallback on error

## Changes

### File: /home/felix/idle-mmo-profiter/src/components/CharacterTracker.vue

**Import additions:**
- Import { searchItems } from '../api/services'
- Import { apiClient } from '../api/client'

**New reactive state:**
- apiSearchResults ref<Array<{ hashId: string; name: string; price: number }>>([])
- isSearching ref<boolean>(false) - loading indicator
- searchError ref<string | null>(null)

**Modified search logic (watch on searchQuery, lines 92-100):**
- If apiClient.isConfigured() is true: debounce 300ms, then call searchItems(query) and map results to { hashId: item.hashed_id, name: item.name, price: item.vendor_price || 0 }
- If apiClient.isConfigured() is false: use existing local filtering as-is (current behavior)
- Show loading spinner during API calls
- On error: fall back to local search, show subtle error message

**Modified filteredItems computed (lines 138-145):**
- If API is configured: return apiSearchResults.value (already filtered by API)
- If API is not configured: use existing local allItems filtering

**Modified addItemToInventory (line 148):**
- Pass item name to tracker.setItemQuantity() so it can be stored (requires Task 1)
- For API items, optionally call getAverageMarketPrice() to get a more accurate price than vendor_price

**Template changes (lines 508-526):**
- Add loading indicator in search results area
- Show '0 results' message when API returns empty
- Show error state if API call failed
- Show hint text: 'API connected - searching all game items' vs 'Searching local items only'

## Debounce behavior
- 300ms debounce on keystroke (existing)
- Minimum 2 characters before triggering API search (avoid broad queries)
- Clear results when search input is cleared

## Static mode
- In static mode (VITE_STATIC_MODE=true), API is never available
- apiClient.isConfigured() returns false, so local search is always used
- No changes needed for static mode

## Acceptance Criteria

- Searching 'Uranium Ore' returns results when API key is configured
- Loading indicator appears during API search
- Search falls back to local filtering when no API key
- Search falls back to local filtering when API call fails
- Minimum 2-character query before API search fires
- Results include hashId, name, and price
- All existing search behavior preserved when no API key


## Notes

**2026-03-04T20:06:03Z**

Implementation complete. Wired API search into CharacterTracker item search UI.

Files modified:
- /home/felix/idle-mmo-profiter/src/components/CharacterTracker.vue - Added API search integration

Key features:
- Imports searchItems from API services and apiClient
- Added reactive state: apiSearchResults, isSearching, searchError
- Updated search watch to call searchItems() when API is configured
- Minimum 2-character query before API search
- 300ms debounce (existing)
- Falls back to local search when no API key or on error
- Loading indicator during API search
- Search hint shows 'API connected' vs 'Searching local items only'
- Error message on API failure
- 'No items found' message for empty results
- Stores API item data in tracker for name resolution
- Passes item name to setItemQuantity() for persistence

Tests: 619/619 passing
Type check: PASS
