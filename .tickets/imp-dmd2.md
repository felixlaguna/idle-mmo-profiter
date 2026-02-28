---
id: imp-dmd2
status: closed
deps: [imp-jtix]
links: []
created: 2026-02-28T18:54:42Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-430x
---
# Task 3: Implement item processing loop and price update logic

Implement the main processing loop that iterates through materials, resources, and recipes (all items with hashedId), fetches market price for each, and updates the correct price field. Key details:

- materials: update 'price' field (99 items)
- resources: update 'marketPrice' field (7 items)  
- recipes: update 'price' field (345 items), SKIP items with isUntradable=true (34 items)
- craftables: skip (0 items currently, but handle gracefully)
- resourceGathering: sync marketPrice from matching resources array entry by name (no API call needed)

Rate limiting: delay REQUEST_DELAY_MS between each API call. Show progress [current/total] with item name and old->new price. Handle --limit=N to cap items processed.

## Acceptance Criteria

All 451 items with hashedId are processed (minus ~34 untradable), prices updated in-memory, progress shown, rate limiting respected


## Notes

**2026-02-28T18:55:00Z**

## Detailed Design

### Processing order
1. **materials** (99 items) — all have hashedId, update `price` field
2. **craftables** (0 items) — skip, but handle array gracefully
3. **resources** (7 items) — all have hashedId, update `marketPrice` field
4. **recipes** (345 items) — have hashedId, update `price` field
   - **SKIP** items where `isUntradable === true` (34 items) — these can't be on the market
5. **resourceGathering** (12 items) — NO API call. After resources are updated, sync `marketPrice` by matching name to the `resources` array. Items without a match (e.g., "Cooked Stingray full") keep their existing price.

### Item processing function
```typescript
type CategoryName = 'materials' | 'craftables' | 'resources' | 'recipes'
type PriceField = 'price' | 'marketPrice'

const CATEGORY_CONFIG: Record<CategoryName, { priceField: PriceField }> = {
  materials: { priceField: 'price' },
  craftables: { priceField: 'price' },
  resources: { priceField: 'marketPrice' },
  recipes: { priceField: 'price' },
}

async function processItem(item, apiKey, priceField, index, total): Promise<{updated: boolean, oldPrice, newPrice}> {
  // Skip if no hashedId
  // Skip if isUntradable
  // Fetch market price
  // Compare old vs new
  // Update in-place
  // Log progress
}
```

### resourceGathering sync (post-processing, no API call)
```typescript
// Build lookup from updated resources
const resourcePriceMap = new Map<string, number>()
data.resources.forEach(r => resourcePriceMap.set(r.name, r.marketPrice))

// Sync to resourceGathering
data.resourceGathering.forEach(rg => {
  const resourcePrice = resourcePriceMap.get(rg.name)
  if (resourcePrice !== undefined) {
    rg.marketPrice = resourcePrice
  }
})
```

### Progress output format
```
[1/417] Processing: Moose antler (materials)
  ✓ 121.1 → 135.5
[2/417] Processing: Minotaur Hide (materials)
  ✓ 411.2 → 398.0
...
[100/417] Skipping: Riverbend Infusion Recipe (Untradable) (recipes)
  ⊘ Untradable, skipped
```

### Estimated runtime
- ~417 items (451 total - 34 untradable)
- 1 API request per item at ~3.1s/request
- ~21.5 minutes

**2026-02-28T19:00:14Z**

Processing loop implemented successfully.

Features added:
- processItem() function handles individual item processing
- Proper category handling: materials/craftables (price), resources (marketPrice), recipes (price)
- Skips untradable recipes (34 items)
- resourceGathering sync from resources array (no API calls)
- Progress display with [index/total] and old→new price changes
- Change indicators: ↑ for increase, ↓ for decrease, = for same
- Rate limiting with REQUEST_DELAY_MS between API calls
- Summary stats: processed, updated, no data, skipped, synced

Test successful with --limit=3:
- 3 materials processed: Moose antler (121.1→110.1), Minotaur Hide (411.2→409.7), Black Bear Pelt (104.7→121.8)
- 7 resourceGathering items synced from resources
- Correctly identified items without matching resources (e.g., 'Cooked Stingray full')
