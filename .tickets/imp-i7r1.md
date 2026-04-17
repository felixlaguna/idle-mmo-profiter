---
id: imp-i7r1
status: done
deps: [imp-2geg, imp-t613]
links: []
created: 2026-04-15T15:47:55Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-aon1
---
# Phase 6: Remove old arrays from defaults.json and drop legacy path

Once the masterItems-based path is proven stable, remove the old arrays from defaults.json and the legacy path from useDataProvider.

## 6A. Remove old arrays from defaults.json

Delete from defaults.json:
- materials array
- craftables array
- resources array
- recipes array
- craftableRecipes array
- resourceGathering array
- resourceRecipes array
- allItems array (merged into masterItems)

Keep:
- masterItems
- dungeons
- efficiencyItems
- magicFindDefaults
- marketTaxRate

## 6B. Remove legacy path from useDataProvider

Delete the 'else' branch that handles old-format data loading. Only the masterItems + adapter path remains.

## 6C. Remove old auto-sync workarounds

Delete:
- craftable/material auto-generation from craftableRecipes
- resourceGathering price syncing from resources
- All Set-based deduplication logic

## 6D. Update DefaultData type

Remove optional legacy arrays from DefaultData interface.

## 6E. Update exportAsDefaultsJson()

Should now export masterItems format, not reconstruct old arrays.

## 6F. Clear old localStorage keys

No migration needed — user has confirmed we don't care about preserving price overrides. Simply clear the old keys on startup:
- idlemmo:user-overrides
- idlemmo:craftable-recipes
- idlemmo:resource-recipes

## 6G. Update all tests

Remove any test fixtures using old array format.

## Files to modify
- src/data/defaults.json (massive shrink)
- src/types/index.ts
- src/composables/useDataProvider.ts
- scripts/refresh-market-prices.ts (remove dual-write)
- All test files using old format

## Risk: This is the point of no return
Before executing this phase, ensure:
- All tests pass with masterItems path
- Manual QA confirms no regressions

## Acceptance Criteria

1. defaults.json contains only masterItems (no duplicate old arrays)
2. File size reduced significantly
3. useDataProvider has no legacy path
4. Old localStorage keys cleared (no migration needed)
5. All 50+ tests pass
6. refresh script works with new format only

