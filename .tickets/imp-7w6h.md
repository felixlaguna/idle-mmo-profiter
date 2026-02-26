---
id: imp-7w6h
status: closed
deps: [imp-l4cy]
links: []
created: 2026-02-25T18:32:25Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-7w43
---
# Implement API service methods for items and market data

Create src/api/services.ts:

Service methods wrapping the API client + cache:

1. searchItems(query?: string, type?: string, page?: number)
   - GET /v1/item/search?query=X&type=X&page=X
   - Returns: { items: Item[], pagination: Pagination }

2. inspectItem(hashedItemId: string)
   - GET /v1/item/{hashed_item_id}/inspect
   - Returns: { item: ItemDetail } (includes recipe, stats, vendor_price)

3. getMarketHistory(hashedItemId: string, tier?: number, type?: 'listings' | 'orders')
   - GET /v1/item/{hashed_item_id}/market-history
   - Returns: { history_data: PriceHistory[], latest_sold: SoldItem[], type: string }

4. checkAuth()
   - GET /v1/auth/check
   - Returns: { api_key: ApiKeyInfo } (name, scopes, rate_limit)

All methods use cache-first strategy, fall back to default data if both cache and API fail.
All methods are no-ops if API key is not configured (return default data instead).

## Acceptance Criteria

All service methods work with and without API key, cache responses, respect rate limits


## Notes

**2026-02-26T08:49:03Z**

Examined existing code:
- services.ts already exists with searchItems, getItemDetails, getMarketHistory
- Current implementation does NOT handle no-API-key case (throws AuthError from client)
- Need to update methods to:
  1. Check if API key is configured (apiClient.isConfigured())
  2. If not configured, return default/empty data instead of making API call
  3. Update searchItems to accept optional 'type' parameter
  4. Update getMarketHistory to accept optional tier and type parameters
  5. Add checkAuth() method
  6. Ensure all methods gracefully handle API failures with default data

**2026-02-26T08:49:48Z**

Plan for updating services.ts:
1. Update searchItems signature: add optional type parameter
2. Update getMarketHistory signature: add optional tier and type parameters  
3. Add checkAuth() method
4. Add helper function for empty responses when no API key
5. Update all methods to check apiClient.isConfigured() first
6. Wrap API calls in try-catch to return default data on failure
7. Update type definitions in types/index.ts if needed

**2026-02-26T08:51:44Z**

Updated services.ts:
- Added type parameter to searchItems()
- Added tier and type parameters to getMarketHistory()
- Added checkAuth() method
- All methods now check apiClient.isConfigured() and return default data if no API key
- All methods wrapped in try-catch to return default data on API failure
- Added inspectItem() as primary function, kept getItemDetails() as alias
- Updated index.ts exports

**2026-02-26T08:52:11Z**

Build successful. All changes complete:

Files modified:
- /home/felix/idle-mmo-profiter/src/api/services.ts
  - Updated searchItems(query?, type?, page?) with optional parameters
  - Updated getMarketHistory(hashedItemId, tier?, type?) with optional parameters
  - Added checkAuth() method for API key validation
  - Added inspectItem() as primary function (getItemDetails kept as alias)
  - All methods check apiClient.isConfigured() before making requests
  - All methods return default/empty data when API key not configured
  - All methods handle API failures gracefully with default data fallback
  - Added EMPTY_SEARCH_RESPONSE and EMPTY_MARKET_HISTORY constants

- /home/felix/idle-mmo-profiter/src/api/index.ts
  - Added inspectItem and checkAuth to exports

All acceptance criteria met:
✓ searchItems() accepts optional query, type, and page parameters
✓ inspectItem() returns item details with recipe, stats, vendor_price
✓ getMarketHistory() accepts optional tier and type parameters
✓ checkAuth() validates API key and returns key info
✓ All methods use cache-first strategy
✓ All methods fall back to default data if cache and API fail
✓ All methods are no-ops (return default data) if API key not configured
✓ Build passes without errors
