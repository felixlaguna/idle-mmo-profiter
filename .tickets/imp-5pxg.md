---
id: imp-5pxg
status: closed
deps: [imp-1a0v]
links: []
created: 2026-02-28T20:23:35Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-7s0v
---
# Phase 4: Add --smart flag to refresh script for frequency-based selective refresh

Add a --smart CLI flag to the refresh-market-prices.ts script that skips items whose lastUpdated + suggestedRefreshMinutes indicates they are not yet due for refresh.

## New CLI flag

  --smart     Only refresh items that are due based on their lastUpdated date and suggestedRefreshMinutes

## Logic for --smart mode

Create a helper function `isDueForRefresh(item: DefaultItem): { due: boolean; minutesSinceLast?: number; minutesUntilDue?: number }`:

1. If item has no `lastUpdated` field -> due (never been refreshed)
2. If item has no `suggestedRefreshMinutes` field -> due (no suggestion, refresh to compute one)
3. Parse lastUpdated as a Date
4. Calculate `minutesSinceLastUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60)`
5. If `minutesSinceLastUpdate >= suggestedRefreshMinutes` -> due
6. Otherwise -> not due, calculate `minutesUntilDue = suggestedRefreshMinutes - minutesSinceLastUpdate`

Return an object (not just boolean) so the caller can display detailed info.

## Changes to /home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts

### 1. Import formatRefreshInterval
Already imported in Phase 3 — reuse it for displaying countdown info.

### 2. Parse --smart flag
Add to the existing CLI args parsing:
```typescript
const smartMode = args.includes('--smart')
```

### 3. Add skip logic in category processing loops
In each category loop (materials, craftables, resources, recipes), before processing an item, check:
```typescript
if (smartMode) {
  const refreshStatus = isDueForRefresh(item)
  if (!refreshStatus.due) {
    console.log(`  ⏳ Not due (last: ${formatRefreshInterval(refreshStatus.minutesSinceLast!)} ago, next in: ${formatRefreshInterval(refreshStatus.minutesUntilDue!)})`)
    smartSkippedCount++
    continue
  }
}
```

### 4. Update statistics
Track smartSkippedCount separately from skippedCount (which is for no-hashedId/untradable skips).
Show in summary:
```
Smart mode: X items refreshed, Y items skipped (not yet due)
```

### 5. Show pre-run summary in smart mode
Before processing, scan all items and show:
```
Smart mode analysis:
  Due now: X items
  Not yet due: Y items
  Never refreshed: Z items (will refresh)
  Estimated time: ~N minutes
```

### 6. Update the script header docs
Add --smart to the Options documentation at the top of the file:
```
* --smart     Only refresh items that are due based on their suggested refresh frequency
```

## Interaction with other flags
- --smart + --limit=N: Apply smart filtering first, then limit counts only refreshed items
- --smart + --dry-run: Show what would be refreshed/skipped without making changes
- --smart does NOT override the existing untradable/no-hashedId skip logic (those happen first)

## Test updates
Update /home/felix/idle-mmo-profiter/src/tests/scripts/refresh-market-prices.test.ts:
- Test isDueForRefresh with item last updated 5 minutes ago, suggestedRefreshMinutes=10 -> not due
- Test isDueForRefresh with item last updated 15 minutes ago, suggestedRefreshMinutes=10 -> due
- Test isDueForRefresh with item last updated 2 hours ago, suggestedRefreshMinutes=60 -> due
- Test that items with no lastUpdated are always due
- Test that items with no suggestedRefreshMinutes are always due
- Test boundary case: exactly at the threshold -> due
- Test that minutesUntilDue is correctly calculated

## Acceptance Criteria

- [ ] --smart flag is recognized and documented in script header
- [ ] isDueForRefresh function correctly determines if item needs refresh (comparing minutes)
- [ ] Items not due are skipped with informative console output showing time remaining (human-readable via formatRefreshInterval)
- [ ] Pre-run summary shows how many items are due vs not due
- [ ] Smart-skipped items are tracked separately in statistics
- [ ] Summary clearly shows smart mode statistics
- [ ] Works correctly in combination with --limit and --dry-run
- [ ] Tests cover isDueForRefresh edge cases with minute-level precision
- [ ] TypeScript compilation succeeds


## Notes

**2026-02-28T20:39:24Z**

Phase 4 complete. Added --smart flag for selective refresh based on due dates.

Files modified:
- /home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts
- /home/felix/idle-mmo-profiter/src/tests/scripts/refresh-market-prices.test.ts

Changes:
- Added --smart flag to CLI options (documented in header)
- Created isDueForRefresh() helper function:
  - Returns due=true when no lastUpdated (never refreshed)
  - Returns due=true when no suggestedRefreshMinutes (no suggestion)
  - Compares minutesSinceLast >= suggestedRefreshMinutes
  - Returns detailed status with minutesSinceLast and minutesUntilDue
- Added pre-run analysis in smart mode:
  - Shows due/not-due/never-refreshed counts
  - Shows estimated time
- Smart mode skip logic in all 4 category loops:
  - Checks isDueForRefresh before processing
  - Skips items not due with informative console output
  - Shows time since last and time until next refresh (human-readable)
  - Tracks smartSkippedCount separately
- Updated summary statistics:
  - Shows smart mode statistics
  - Shows refreshed vs skipped counts
- Added 6 new tests for isDueForRefresh logic

All tests passing (271/271).
TypeScript compilation successful.
