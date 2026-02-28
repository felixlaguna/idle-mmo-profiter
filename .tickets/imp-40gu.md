---
id: imp-40gu
status: closed
deps: []
links: []
created: 2026-02-27T22:11:51Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-259e
tags: [fix, data-provider, scripts]
---
# Fix: Populate craftable hashedIds from their source recipes

## Summary

When craftables are generated from recipes in the craftableRecipes sync loop, their `hashedId` should be populated from the source recipe's `producesItemHashedId` field — not left as empty string.

## Root Cause

The craftableRecipes sync loop (`useDataProvider.ts:183-211`) creates craftable items with `hashedId: ''` hardcoded (line 206). However, each craftable has a corresponding recipe in the `recipes` array where `recipe.producesItemName === craftableRecipe.name`. That recipe can carry the produced item's hashed ID in `recipe.producesItemHashedId`.

Currently:
- 311/311 craftableRecipes match to recipes via `producesItemName`
- Only 35/311 unique craftable items have `producesItemHashedId` on their recipes
- 0/311 craftables have `hashedId` populated

## Changes Required

### Part 1: Update craftableRecipes sync loop in `useDataProvider.ts`

**File: `src/composables/useDataProvider.ts` lines ~199-211**

When creating a craftable from a recipe, look up the matching recipe and carry over `producesItemHashedId`:

```typescript
// Sync craftable output items
if (!craftableNames.has(recipe.name)) {
  const id = `craft-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  
  // Find the source recipe to get the produced item's hashedId
  const sourceRecipe = loadedDefaults.recipes.find(
    (r) => r.producesItemName === recipe.name && r.producesItemHashedId
  )
  
  loadedDefaults.craftables.push({
    id,
    name: recipe.name,
    price: recipe.currentPrice,
    hashedId: sourceRecipe?.producesItemHashedId || '',
    vendorValue: 0,
  })
  craftableNames.add(recipe.name)
}
```

### Part 2: Update `populate-hashed-ids.ts` to populate `producesItemHashedId` on recipes

**File: `scripts/populate-hashed-ids.ts`**

When processing recipe items, the script already inspects each recipe by name and gets its `hashed_id`. After getting the recipe's hashed ID, also look up the produced item:

1. For each recipe that has a `producesItemName`, search for that item name in the API
2. Set `producesItemHashedId` to the found item's `hashed_id`
3. This requires the script to understand the `Recipe` type (with `producesItemName` and `producesItemHashedId` fields)

The script currently treats all items generically via the `Item` interface. It needs to be extended to handle recipe-specific fields when processing the recipes array.

### Part 3: Re-run the populate script

After Part 2 is implemented, re-run `populate-hashed-ids.ts` to fill in the missing 276 `producesItemHashedId` values on recipes. Then on next app load, Part 1 will automatically populate the craftable hashedIds.

## Acceptance Criteria
- [ ] The sync loop in `useDataProvider.ts` copies `producesItemHashedId` from the matching recipe to the craftable's `hashedId`
- [ ] `populate-hashed-ids.ts` populates `producesItemHashedId` for recipes that have `producesItemName`
- [ ] After running the populate script and reloading the app, craftables have non-empty `hashedId` values
- [ ] Export-to-defaults workflow preserves craftable hashedIds (they're baked in from recipe data)

## Notes

**2026-02-27T23:36:04Z**

Starting implementation. Identified the sync loop at lines 183-211 in useDataProvider.ts. Need to fix line 206 to copy producesItemHashedId from recipes.

**2026-02-27T23:36:51Z**

Part 1 complete: Fixed sync loop in useDataProvider.ts to copy producesItemHashedId from recipes to craftables. Now working on Part 2: enhancing populate-hashed-ids.ts script.

**2026-02-27T23:37:26Z**

Part 2 complete: Enhanced populate-hashed-ids.ts to also populate producesItemHashedId field for recipes. Now ready for Part 3: running the script.

**2026-02-27T23:39:43Z**

Parts 1 and 2 complete with tests passing:
- Fixed sync loop in useDataProvider.ts to copy producesItemHashedId from recipes to craftables
- Enhanced populate-hashed-ids.ts to populate producesItemHashedId for recipes
- Updated addCraftableRecipe to also sync hashedId when creating craftables
- Added test coverage for the fix
All 231 tests passing.

Now need to run populate-hashed-ids.ts script to populate the missing 276 producesItemHashedId values.

**2026-02-27T23:40:02Z**

Implementation complete. To finish Part 3 (populating the missing producesItemHashedId values), run:

  npx tsx scripts/populate-hashed-ids.ts --api-key=YOUR_API_KEY

This will populate the missing producesItemHashedId values for 276 recipes in defaults.json. The script has been enhanced to:
1. Check if recipes need producesItemHashedId populated
2. Search for the produced item's hashedId via the API
3. Update the recipe with the producesItemHashedId

After running the script, the sync loop will automatically use these values when creating craftables from craftableRecipes.
