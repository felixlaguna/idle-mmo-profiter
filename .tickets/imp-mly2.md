---
id: imp-mly2
status: closed
deps: [imp-utho]
links: []
created: 2026-02-27T11:42:26Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-kb81
---
# Phase 5b: Wire 'Refresh Item Data' handler in MarketTable

Handle the new 'refresh' event from HashedIdModal in MarketTable.vue. When the user clicks 'Refresh Item Data', use the item's hashedId to call inspectItem() from the API services, then persist the fetched data (uses, producesItemName, vendor_price) into the data provider.

## What to build

Add a refreshItemData() function in MarketTable.vue's script section that:

1. Gets the current modal item's hashedId, itemId, and category from hashedIdModalItem ref
2. Calls inspectItem(hashedId) from '../api/services' (already imported in the addUntrackedPotion flow)
3. For recipe items: extracts recipe.max_uses and recipe.result.item_name from the API response, then calls dataProvider.updateRecipeDefaults(itemId, { uses, producesItemName, producesItemHashedId }) to persist the data
4. For ALL categories: updates vendorValue via dataProvider.updateVendorValue() if the API returns vendor_price
5. Shows a toast notification on success or failure
6. Also updates the counterpart recipe (tradable ↔ untradable) with the same uses/producesItemName — follow the existing pattern in addUntrackedPotion (lines 488-495)

Wire it up:
- Add a refreshItemDataLoading ref (boolean) for loading state
- Pass :refreshing='refreshItemDataLoading' to HashedIdModal
- Handle @refresh='refreshItemData' on the HashedIdModal component
- Invalidate the inspect cache before calling inspectItem to ensure fresh data

## Key reference: existing pattern
The addUntrackedPotion function (MarketTable.vue lines 343-519) already does a very similar flow. The key difference is that 'Refresh Item Data' is simpler:
- It does NOT create a PotionCraft entry
- It does NOT fetch material market prices
- It ONLY fetches the item's inspect data and persists uses + producesItemName + vendorValue
- It works for ALL categories (materials, potions, resources, recipes), not just recipes

## API response structure (from services.ts)
inspectItem returns ItemDetails:
  - hashed_id, name, vendor_price, is_tradeable, max_tier
  - recipe?: { skill, level_required, max_uses, experience, materials[], result: { hashed_item_id, item_name } }

## Files to modify
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue

## Cache invalidation
Before calling inspectItem(), invalidate the cache key for this item:
  const cacheKey = generateCacheKey("/item/${hashedId}/inspect")
  invalidate(cacheKey)
This ensures the user always gets fresh data when they explicitly click refresh.

## Acceptance Criteria

Clicking 'Refresh Item Data' in the modal fetches item details from the API and persists uses, producesItemName, producesItemHashedId, and vendorValue. Recipe counterparts are also updated. Toast feedback on success/failure. Works for all 4 categories (materials, potions, resources, recipes).


## Notes

**2026-02-27T11:45:50Z**

Implementation complete. Added:
- refreshItemDataLoading ref for loading state
- refreshItemData async function that:
  * Invalidates the inspect cache before calling inspectItem
  * Fetches item details from API using inspectItem(hashedId)
  * Updates vendorValue for all categories
  * For recipes: extracts uses, producesItemName, producesItemHashedId
  * Updates both the clicked recipe and its counterpart (tradable ↔ untradable)
  * Shows appropriate toast notifications
- Wired :refreshing and @refresh to HashedIdModal

Pattern follows addUntrackedPotion (lines 343-519) but simpler - only updates data, doesn't create PotionCraft entries.

Files modified:
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue
