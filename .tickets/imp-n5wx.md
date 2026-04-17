---
id: imp-n5wx
status: closed
deps: [imp-o6lg, imp-05x6]
links: []
created: 2026-03-04T20:19:09Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Iteration 2c: Wire allItems from defaults.json into CharacterTracker search

After the populate-all-items script has added the allItems array to defaults.json, update the CharacterTracker to include these items in its local search.

## Files to modify

### /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts

Add the allItems array to the data provider so CharacterTracker can access it.

Check how useDataProvider currently loads data from defaults.json and exposes it. Add:
- A new `allItems` computed ref that reads defaults.json's allItems array
- Each item should expose: hashedId, name, type, vendorPrice (or price)

### /home/felix/idle-mmo-profiter/src/components/CharacterTracker.vue

Update the `allItems` computed (currently lines 155-187) to also include items from dataProvider.allItems:

```typescript
const allItems = computed(() => {
  const items: Array<{ hashId: string; name: string; price: number }> = []
  const seen = new Set<string>()

  // Add categorized items first (they have market prices)
  dataProvider.materials.value.forEach((m) => {
    if (m.hashedId) {
      items.push({ hashId: m.hashedId, name: m.name, price: m.price })
      seen.add(m.hashedId)
    }
  })
  // ... same for craftables, resources, recipes ...

  // Add allItems from defaults.json (items not in any category)
  dataProvider.allItems.value.forEach((item) => {
    if (item.hashedId && !seen.has(item.hashedId)) {
      items.push({
        hashId: item.hashedId,
        name: item.name,
        price: item.vendorPrice ?? 0,
      })
    }
  })

  return items
})
```

This ensures:
1. Categorized items (materials, resources, etc.) appear with their market prices
2. All other game items appear with vendor prices
3. No duplicates (dedup by hashId)

### /home/felix/idle-mmo-profiter/src/composables/useCharacterTracker.ts

Update itemNameMap and itemPriceMap computeds to also include allItems:

```typescript
// In itemNameMap computed:
dataProvider.allItems.value.forEach((item) => {
  if (item.hashedId && !map.has(item.hashedId)) {
    map.set(item.hashedId, item.name)
  }
})

// In itemPriceMap computed:
dataProvider.allItems.value.forEach((item) => {
  if (item.hashedId && !map.has(item.hashedId)) {
    map.set(item.hashedId, item.vendorPrice ?? 0)
  }
})
```

This ensures resolveItemName() and resolveCurrentPrice() work for all game items.

## Acceptance Criteria

- CharacterTracker item search includes all game items from defaults.json allItems array
- Categorized items (materials, resources, etc.) appear with market prices (not vendor prices)
- No duplicate items in search results
- resolveItemName works for items from allItems
- resolveCurrentPrice works for items from allItems
- All existing tests pass
- TypeScript type check passes


## Notes

**2026-03-04T20:26:19Z**

Successfully wired allItems from defaults.json into CharacterTracker search.

Changes:
- Added allItems computed ref to useDataProvider.ts exposing defaults.value.allItems || []
- Updated DefaultData interface to include optional allItems array
- Updated CharacterTracker.vue allItems computed to include items from dataProvider.allItems
- Added deduplication logic using Set to prevent duplicate hashIds
- Updated useCharacterTracker.ts itemNameMap and itemPriceMap to include allItems
- Categorized items take priority (checked first and added to seen Set)
- allItems items only added if not already seen

Priority:
1. Categorized items (materials, craftables, resources, recipes) with market prices
2. allItems from defaults.json with vendor prices
3. No duplicates

All tests passing (617/617). TypeScript type check passes.
