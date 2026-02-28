---
id: imp-plaq
status: closed
deps: []
links: []
created: 2026-02-28T20:22:23Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-7s0v
---
# Phase 1: Add lastUpdated and suggestedRefreshMinutes fields to types and defaults.json

Add two new optional fields to the item types and update the refresh script to persist them.

## Fields to add

- `lastUpdated`: ISO 8601 date string (e.g., '2026-02-28T20:00:00Z'). Set when the script successfully fetches a new market price for this item.
- `suggestedRefreshMinutes`: number (e.g., 180 for every 3 hours, or 10080 for weekly). Stored in minutes to support high-frequency items that trade every few minutes as well as low-frequency items that only need weekly checks.

## Files to modify

1. **`/home/felix/idle-mmo-profiter/src/types/index.ts`**
   - Add `lastUpdated?: string` to Material, Craftable, Resource, and Recipe interfaces
   - Add `suggestedRefreshMinutes?: number` to Material, Craftable, Resource, and Recipe interfaces

2. **`/home/felix/idle-mmo-profiter/src/types/index.ts`**
   - The `DefaultData` interface references these item types, so it will inherit the new fields automatically.

3. **`/home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts`** (DefaultItem interface)
   - Add `lastUpdated?: string` and `suggestedRefreshMinutes?: number` to the local `DefaultItem` interface used in the script.

## Notes
- These fields are optional so existing defaults.json data without them will still work.
- No changes to defaults.json file itself in this phase -- the script will populate these fields when it runs (Phase 3).
- Minutes chosen as the unit because it provides sufficient precision for both high-frequency items (e.g., 5 minutes) and low-frequency items (e.g., 43200 minutes = 30 days) without floating-point awkwardness.

## Acceptance Criteria

- [ ] Material, Craftable, Resource, Recipe interfaces have lastUpdated?: string
- [ ] Material, Craftable, Resource, Recipe interfaces have suggestedRefreshMinutes?: number
- [ ] DefaultItem in refresh-market-prices.ts script has both fields
- [ ] All existing tests pass unchanged
- [ ] TypeScript compilation succeeds


**2026-02-28T20:33:09Z**

Phase 1 complete. Added lastUpdated and suggestedRefreshMinutes fields to all item types.

Files modified:
- /home/felix/idle-mmo-profiter/src/types/index.ts - Added fields to Material, Craftable, Resource, Recipe interfaces
- /home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts - Added fields to DefaultItem interface

All tests passing (249/249).
TypeScript compilation successful.
