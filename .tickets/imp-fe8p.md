---
id: imp-fe8p
status: done
deps: [imp-gko5]
links: []
created: 2026-04-15T15:47:11Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-aon1
---
# Phase 3: Update useDataProvider to consume masterItems with adapter fallback

Modify useDataProvider.ts to read from masterItems when available, falling back to old arrays. This is the core integration point.

## 3A. Data loading logic change

Current: loads each array separately from defaults.json
New: if masterItems exists, use adapters to generate all old array formats from it. If masterItems does not exist, fall back to old behavior.

```typescript
// In createDataProvider():
const loadedDefaults = defaultData as DefaultData

let effectiveData: {
  materials, craftables, resources, recipes,
  craftableRecipes, resourceGathering, resourceRecipes, dungeons, ...
}

if (loadedDefaults.masterItems && loadedDefaults.masterItems.length > 0) {
  // New path: derive everything from masterItems
  effectiveData = {
    materials: toMaterials(loadedDefaults.masterItems),
    craftables: toCraftables(loadedDefaults.masterItems),
    resources: toResources(loadedDefaults.masterItems),
    recipes: toRecipes(loadedDefaults.masterItems),
    craftableRecipes: toCraftableRecipes(loadedDefaults.masterItems),
    resourceGathering: toResourceGathering(loadedDefaults.masterItems),
    resourceRecipes: toResourceRecipes(loadedDefaults.masterItems),
    dungeons: loadedDefaults.dungeons,
    ...
  }
} else {
  // Legacy path: existing behavior
  effectiveData = { ... old code ... }
}
```

## 3B. Remove auto-sync workarounds

The following auto-sync code in useDataProvider becomes unnecessary once masterItems is the source of truth:
- Lines 268-310: CRITICAL sync of materials/craftables from craftableRecipes
- The craftableNames/materialNames Set-based deduplication
- Auto-generated IDs (mat-auto-*, craft-auto-*)

These should be guarded behind the legacy path only.

## 3C. localStorage overrides

User price overrides in localStorage will NOT be preserved. No migration needed — old keys will be cleared in Phase 6. During the transition period, overrides may stop working and that's acceptable.

## 3D. Preserve ALL existing computed properties and methods

Every computed property and method that useDataProvider exports MUST produce identical results:
- materials, craftables, resources, recipes, craftableRecipes, resourceRecipes, resourceGathering
- materialPriceMap, craftablePriceMap, resourcePriceMap, rawResourcePriceMap
- materialLastSaleAtMap, materialVendorValueMap, resourceSkillMap
- All update* methods, clear* methods, add* methods, remove* methods
- exportAsDefaultsJson()

## 3E. Testing strategy

Add a test that:
1. Loads defaults.json (which now has both old arrays and masterItems)
2. Runs useDataProvider in 'legacy' mode (old arrays)
3. Runs useDataProvider in 'new' mode (masterItems + adapters)
4. Asserts all computed properties produce identical values

## Files to modify
- src/composables/useDataProvider.ts (1,432 lines, the largest change)
- src/tests/composables/useDataProvider.test.ts

## Acceptance Criteria

1. useDataProvider works identically with masterItems as with old arrays
2. All computed properties produce same values in both modes
3. localStorage overrides still work
4. No downstream consumers need changes
5. A/B test proves equivalence

