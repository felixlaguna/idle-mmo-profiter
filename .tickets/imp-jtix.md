---
id: imp-jtix
status: closed
deps: [imp-ukfp]
links: []
created: 2026-02-28T18:54:20Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-430x
---
# Task 2: Implement market price fetch via market-history API

Add the fetchMarketPrice(hashedId, apiKey) function that calls /item/{hashedId}/market-history?tier=0&type=listings, extracts latest_sold entries, and computes average price_per_item from last 10 transactions. Returns number | null. Handles errors gracefully (API errors, empty data, no latest_sold). Uses the same fetch+Bearer pattern as the populate script.

## Acceptance Criteria

Function returns correct average price for a known item hashedId, returns null when no market data


## Notes

**2026-02-28T18:54:33Z**

## Detailed Design

### API Endpoint
`GET /item/{hashedId}/market-history?tier=0&type=listings`

### Response type (from src/api/services.ts):
```typescript
interface MarketHistoryResponse {
  history_data: Array<{ date: string; total_sold: number; average_price: number }>
  latest_sold: Array<{
    item: { hashed_id: string; name: string; image_url: string }
    tier: number
    quantity: number
    price_per_item: number
    total_price: number
    sold_at: string
  }>
  type: string
  endpoint_updates_at: string
}
```

### Price calculation (matches src/api/services.ts getAverageMarketPrice):
```typescript
async function fetchMarketPrice(hashedId: string, apiKey: string): Promise<number | null> {
  const url = `${API_BASE_URL}/item/${hashedId}/market-history?tier=0&type=listings`
  // fetch with Bearer auth
  // parse MarketHistoryResponse
  // take latest_sold.slice(0, 10)
  // average price_per_item
  // return average or null if empty
}
```

### Error handling:
- HTTP errors: log and return null
- Empty latest_sold: return null
- Network errors: log and return null

### Key: Round to 1 decimal place
Looking at defaults.json, prices are stored with 1 decimal (e.g., 121.1, 411.2). The fetched average should be rounded to 1 decimal:
`Math.round(average * 10) / 10`

**2026-02-28T18:58:53Z**

Market price fetch function implemented successfully.

Function added:
- fetchMarketPrice(hashedId, apiKey, limit=10): Promise<number | null>

Features:
- Calls /item/{hashedId}/market-history?tier=0&type=listings
- Averages last 10 transactions from latest_sold
- Rounds to 1 decimal place (matching defaults.json format)
- Returns null if no market data
- Proper error handling for HTTP errors and network failures

Test successful:
- Moose antler (dgBq1boWYek4QkJ3rXaD): fetched 110.1 (current: 121.1)
