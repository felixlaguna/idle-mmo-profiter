---
id: imp-7w6h
status: open
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

