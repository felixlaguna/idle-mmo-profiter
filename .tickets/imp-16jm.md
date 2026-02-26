---
id: imp-16jm
status: closed
deps: []
links: []
created: 2026-02-26T11:52:46Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-x23x
---
# Phase 1: Add hashed_id and vendorValue to data model and defaults

## Goal
Add the API hashed_item_id and vendorValue to the type system and defaults.json so that items can be looked up via the API without a search call every time.

## Changes Required

### 1. Update types (/home/felix/idle-mmo-profiter/src/types/index.ts)
- Add optional `hashedId?: string` field to Material, Potion, Recipe interfaces
- Resource already has vendorValue; add `hashedId?: string` to Resource
- Add `vendorValue?: number` to Material, Potion, Recipe interfaces

### 2. Update defaults.json (/home/felix/idle-mmo-profiter/src/data/defaults.json)
- Add `hashedId` field to each item in materials, potions, resources, and recipes arrays
- Add `vendorValue` field to materials, potions, and recipes (resources already have it)
- Initial values: hashedId can be empty string or null (populated later via one-time fetch script or manual entry)
- Initial vendorValue: 0 for materials/potions/recipes (populated later)

### 3. Create a one-time data population script (/home/felix/idle-mmo-profiter/scripts/populate-hashed-ids.ts)
- Script that uses the API to search each item by name, get its hashed_id, and inspect it for vendor value
- Writes results back to defaults.json
- Run manually once, then the data stays in defaults.json as the baseline
- Handle rate limits (the API allows 20 req/min)
- This script runs via tsx (already in devDependencies)

### 4. Update UserOverrides interface in useDataProvider.ts
- Allow overriding hashedId and vendorValue in user overrides (in case defaults are wrong)

## Notes
- The hashedId is optional because the app MUST still work without it (graceful degradation)
- vendorValue is optional for the same reason
- The script is a one-time convenience; the real values live in defaults.json afterward
- For 369 items: ~19 minutes at 20 req/min for search + inspect calls

## Acceptance Criteria

- [ ] Material, Potion, Recipe, Resource types have optional hashedId field
- [ ] Material, Potion, Recipe types have optional vendorValue field
- [ ] defaults.json has hashedId and vendorValue placeholders for all items
- [ ] One-time script exists to populate hashed IDs and vendor values via API
- [ ] App still builds and runs with empty/missing hashedId values
- [ ] Existing tests still pass


**2026-02-26T11:59:53Z**

## Iteration 1 Update: Refresh Exclusion State

### Additional changes required in this phase:

### 1. Expand UserOverrides interface in useDataProvider.ts
Add refreshExcluded?: boolean to each category's per-item record:

```typescript
interface UserOverrides {
  materials?: Record<string, { price?: number; refreshExcluded?: boolean }>
  potions?: Record<string, { price?: number; refreshExcluded?: boolean }>
  resources?: Record<string, { marketPrice?: number; refreshExcluded?: boolean }>
  recipes?: Record<string, { price?: number; chance?: number; value?: number; refreshExcluded?: boolean }>
}
```

### 2. Add helper methods to useDataProvider

```typescript
// Toggle exclusion for a single item
function setRefreshExcluded(
  category: 'materials' | 'potions' | 'resources' | 'recipes',
  id: string,
  excluded: boolean
): void

// Check if a specific item is excluded
function isRefreshExcluded(
  category: 'materials' | 'potions' | 'resources' | 'recipes',
  id: string
): boolean

// Bulk set exclusion for an entire category
function setAllRefreshExcluded(
  category: 'materials' | 'potions' | 'resources' | 'recipes',
  excluded: boolean
): void

// Get count of excluded items per category
function getExclusionStats(): { materials: number; potions: number; resources: number; recipes: number; total: number }
```

### 3. Return new methods from useDataProvider
Add setRefreshExcluded, isRefreshExcluded, setAllRefreshExcluded, getExclusionStats to the return object.

### Additional acceptance criteria:
- [ ] UserOverrides interface includes refreshExcluded boolean in all categories
- [ ] setRefreshExcluded toggles a single item and persists to localStorage
- [ ] isRefreshExcluded returns correct boolean for any item
- [ ] setAllRefreshExcluded bulk-toggles all items in a category
- [ ] getExclusionStats returns correct counts
- [ ] Existing override functionality (price edits, resets) unaffected by exclusion field
- [ ] clearCategoryOverrides and clearAllOverrides also clear exclusion state (this is correct behavior since 'reset all' should start fresh)

**2026-02-26T12:02:28Z**

Read all affected files. Starting implementation:
1. types/index.ts - Add hashedId and vendorValue fields
2. defaults.json - Add fields to all items
3. useDataProvider.ts - Add refreshExcluded support
4. scripts/populate-hashed-ids.ts - Create population script

**2026-02-26T12:04:59Z**

Implementation complete. Changes made:

1. ✓ Updated types/index.ts - Added hashedId and vendorValue to Material, Potion, Recipe, and hashedId to Resource
2. ✓ Updated UserOverrides in useDataProvider.ts - Added refreshExcluded boolean field to all categories
3. ✓ Added helper methods to useDataProvider:
   - setRefreshExcluded(category, id, excluded)
   - isRefreshExcluded(category, id)
   - setAllRefreshExcluded(category, excluded)
   - getExclusionStats(category)
4. ✓ Updated defaults.json - Added hashedId and vendorValue fields to all 369 items (11 materials, 6 potions, 7 resources, 345 recipes)
5. ✓ Created scripts/add-market-fields.js - One-time script to add fields to defaults.json (already run)
6. ✓ Created scripts/populate-hashed-ids.ts - Script to populate hashed IDs and vendor values from API

Build: ✓ Passes
Tests: 117/118 passing (1 pre-existing test failure unrelated to changes)

The populate-hashed-ids.ts script is ready but not run yet - requires user's API key. User can run with: tsx scripts/populate-hashed-ids.ts --api-key=YOUR_KEY
