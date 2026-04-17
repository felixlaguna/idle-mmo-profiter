---
id: imp-cfb3
status: closed
deps: [imp-7xl2]
links: []
created: 2026-03-04T20:00:03Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Iteration: Fetch market price when adding API items to inventory

## Problem
When an item is found via API search, the only price available is vendor_price from the search endpoint. For inventory value tracking, we need the actual market price (what the item sells for on the marketplace), not the vendor price.

## Solution
When adding an API-sourced item to inventory, call getAverageMarketPrice() to fetch the real market price. This uses the existing market-history endpoint which is already cached (1h TTL) and rate-limited.

## Changes

### File: /home/felix/idle-mmo-profiter/src/components/CharacterTracker.vue

**Modified addItemToInventory():**
- Make it async
- After user enters quantity, call getAverageMarketPrice(hashId) to get market price
- Use market price as priceAtTime if available, fall back to vendor_price
- Show brief loading state while fetching price
- Pass item name to tracker.setItemQuantity() (from Task 1)

**Price display in search results:**
- Show vendor_price initially from search results
- Optionally show '(market price loading...)' placeholder
- Or just use vendor_price for display and fetch accurate price on add

## Edge cases
- If market price API fails: use vendor_price as fallback
- If item has no market history (never sold): use vendor_price
- If API key not configured: use price from local data (current behavior)

## Acceptance Criteria

- Items added from API search have accurate market prices (not vendor prices)
- Price fetching does not block the UI (loading indicator shown)
- Fallback to vendor_price when market price unavailable
- Rate limiting respected (uses existing apiClient queue)


## Notes

**2026-03-04T20:07:09Z**

Implementation complete. Added market price fetching when adding API items to inventory.

Files modified:
- /home/felix/idle-mmo-profiter/src/components/CharacterTracker.vue - Added market price fetching

Key features:
- Imported getAverageMarketPrice from API services
- Made addItemToInventory async
- Fetches market price via getAverageMarketPrice(hashId) when API is configured
- Falls back to vendor_price if market price fetch fails or returns null
- Uses try/catch for error handling with console warning
- Market price used as priceAtTime for accurate inventory value tracking

Edge cases handled:
- Market price API failure: falls back to vendor_price
- No market history (null): uses vendor_price
- No API key: uses price from local data (existing behavior)

Tests: 619/619 passing
Type check: PASS
