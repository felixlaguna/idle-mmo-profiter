---
id: imp-yf0j
status: closed
deps: []
links: []
created: 2026-02-27T21:10:49Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-yvyo
---
# Fix: Craftable ingredients missing from Market tab after reset-to-defaults

## Bug Summary

After resetting to defaults, the items used as ingredients in craftable recipes do not appear in the Market tab. Users cannot view or edit prices for 88 of 92 unique ingredients referenced by the 311 craftableRecipes in defaults.json.

## Root Cause

When defaults.json was regenerated during the Potion-to-Craftable rename, the craftableRecipes array was populated with 311 tracked recipes from the user's localStorage. However, the corresponding material items and craftable output items were NOT included because they only existed in-memory (dynamically added via addMaterial/addCraftable, never persisted to localStorage). This creates a data inconsistency:

- craftableRecipes: 311 entries (populated from user data during rename)
- materials: 11 entries (original hardcoded items only)
- craftables: 0 entries (was intentionally emptied in commit 5481224)

Of the 92 unique ingredient names in craftableRecipes, only 4 overlap with the 11 materials in defaults.json. The other 88 ingredients are invisible in the Market tab.

## Fix Plan

### Step 1: Populate defaults.json materials array from craftableRecipes

Write a one-time script or manually update defaults.json to ensure every unique material name referenced by craftableRecipes has a corresponding entry in the materials array. This should be done in useDataProvider.ts at startup (not just in defaults.json) to handle future dynamically-added recipes.

**Approach A (data fix): Update defaults.json directly**
Extract all unique material names from craftableRecipes, and for each one not already in the materials array, add an entry with:
- id: auto-generated (e.g., "mat-auto-<name-hash>")
- name: the material name
- price: the unitCost from the recipe (as a reasonable default)
- hashedId: "" (unknown, user can set later)
- vendorValue: 0 (unknown)

**Approach B (runtime fix): Auto-sync materials from craftableRecipes in useDataProvider.ts**
After loading craftableRecipes (line 174 in useDataProvider.ts), iterate all recipe materials and call addMaterial for any that don't exist. This ensures future dynamically-added recipes also get their materials synced.

**RECOMMENDED: Do BOTH.** Fix defaults.json for the static data, AND add runtime sync for future-proofing.

### Step 2: Populate defaults.json craftables array from craftableRecipes

Similarly, for each craftableRecipe name, ensure there's a corresponding entry in the craftables array with:
- id: auto-generated (e.g., "craft-auto-<name-hash>")
- name: the craftable name
- price: the currentPrice from the recipe
- hashedId: "" (unknown)
- vendorValue: 0 (unknown)

### Step 3: Add runtime material/craftable sync in useDataProvider.ts

In createDataProvider(), after line 174 (loadCraftableRecipes), add logic:

```typescript
// Ensure all craftableRecipe materials exist in the materials array
const materialNames = new Set(loadedDefaults.materials.map(m => m.name))
const craftableNames = new Set(loadedDefaults.craftables.map(c => c.name))

for (const recipe of loadedDefaults.craftableRecipes) {
  // Sync materials
  for (const mat of recipe.materials) {
    if (!materialNames.has(mat.name)) {
      loadedDefaults.materials.push({
        id: `mat-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: mat.name,
        price: mat.unitCost,
        hashedId: '',
        vendorValue: 0,
      })
      materialNames.add(mat.name)
    }
  }
  // Sync craftable output item
  if (!craftableNames.has(recipe.name)) {
    loadedDefaults.craftables.push({
      id: `craft-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: recipe.name,
      price: recipe.currentPrice,
      hashedId: '',
      vendorValue: 0,
    })
    craftableNames.add(recipe.name)
  }
}
```

### Step 4: Update defaults.json with populated data

Run the export function or manually populate to create a clean defaults.json that includes all materials and craftables referenced by craftableRecipes. This can be done by:
1. Loading the app with current defaults.json
2. Waiting for the runtime sync (Step 3) to populate materials/craftables
3. Using the exportAsDefaultsJson function to export the complete data
4. Replacing defaults.json with the exported data

### Step 5: Verify fix

1. Clear all localStorage (simulate fresh user)
2. Load the app
3. Go to Market tab
4. Verify Materials section shows all 92+ ingredient items
5. Verify Craftables section shows all 311 craftable output items
6. Click "Reset to Defaults" in Settings
7. Verify Market tab still shows all materials and craftables after page reload
8. Run all tests and ensure they pass

## Files to Modify

1. /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts - Add runtime material/craftable sync after craftableRecipes load (around line 174)
2. /home/felix/idle-mmo-profiter/src/data/defaults.json - Populate materials and craftables arrays with all items referenced by craftableRecipes

## Edge Cases

- Materials with same name but different unitCost across recipes: Use the first occurrence's unitCost as the default price
- Vendor-sold items (vials, crystals): These are already in VENDOR_BUY_PRICES in MarketTable.vue; their prices in the materials array may not match vendor prices. This is acceptable since user overrides handle it.
- ID generation: Use deterministic IDs (e.g., based on name) so that multiple reloads don't create duplicate entries

## Acceptance Criteria

1. After reset-to-defaults, ALL ingredients used in craftableRecipes appear in the Market tab's Materials section
2. After reset-to-defaults, ALL craftable output items appear in the Market tab's Craftables section
3. All existing tests pass (227+)
4. Material prices in the Market tab correctly flow through to craftableRecipe profit calculations
5. No duplicate materials or craftables created on repeated page loads


## Notes

**2026-02-27T21:12:14Z**

Added runtime material/craftable sync in useDataProvider.ts after line 174. This ensures all ingredients and output items from craftableRecipes are automatically added to materials and craftables arrays if missing.

**2026-02-27T21:12:42Z**

Regenerated defaults.json with complete materials and craftables. Previous state: 11 materials, 0 craftables. New state: 99 materials, 311 craftables (matching the 311 craftableRecipes).

**2026-02-27T21:13:19Z**

Fix complete. Verified:
1. All tests pass (228/228)
2. Build succeeds
3. defaults.json now has 99 materials (was 11) and 311 craftables (was 0)
4. Runtime sync in useDataProvider.ts ensures future-proofing
5. All craftableRecipes ingredients and outputs now have corresponding entries in materials/craftables arrays
