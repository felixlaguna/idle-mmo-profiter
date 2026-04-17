---
id: imp-2geg
status: done
deps: [imp-fe8p]
links: []
created: 2026-04-15T15:47:25Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-aon1
---
# Phase 4: Update refresh-market-prices script for unified format

Update the CLI refresh script to read/write the masterItems array instead of iterating separate category arrays.

## 4A. Current behavior (scripts/refresh-market-prices.ts)

The script currently:
1. Reads defaults.json
2. Iterates materials, craftables, resources, recipes separately (each with different priceField)
3. Calls API for each item with hashedId
4. Updates price in-place using category-specific field name (price vs marketPrice)
5. Syncs resourceGathering.marketPrice from resources array
6. Processes craftableRecipes to update currentPrice and lastSaleAt
7. Writes back to defaults.json

## 4B. New behavior

1. Read defaults.json
2. Iterate masterItems array (single loop)
3. For each item with hashedId, fetch market data
4. Update marketPrice field (unified field name)
5. Update lastSaleAt, weeklySalesVolume, suggestedRefreshMinutes, lastUpdated
6. No more syncing between arrays (everything is in one place)
7. Write back to defaults.json

## 4C. Key simplifications

- No more CATEGORY_CONFIG with different priceField mappings
- No more resourceGathering price sync step
- No more separate craftableRecipes processing loop
- Smart mode works the same (check lastUpdated + suggestedRefreshMinutes)
- Untradable recipe skipping: check item.recipe?.isUntradable

## 4D. Backward compatibility

During the transition period (Phase 3 keeps old arrays), the script should:
1. Update masterItems array
2. Also update old arrays (run adapters after masterItems update, then write both)

This ensures the dual-format defaults.json stays consistent.

## 4E. Update tests

- src/tests/scripts/refresh-market-prices.test.ts must be updated

## Files to modify
- scripts/refresh-market-prices.ts (893 lines)
- src/tests/scripts/refresh-market-prices.test.ts

## Acceptance Criteria

1. Script updates masterItems array correctly
2. Old arrays also updated (during transition)
3. Smart mode, dry-run, limit flags all work
4. Rate limiting unchanged
5. Script tests pass

