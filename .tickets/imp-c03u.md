---
id: imp-c03u
status: open
deps: [imp-14kx]
links: []
created: 2026-03-10T10:14:22Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-w271
---
# Phase 4: Re-run market price refresh and verify Earthcore Infusion price

## Verification

After the fix is applied, re-run the market price refresh to verify the Earthcore Infusion price is now correct.

### Steps

1. Run the refresh script for Earthcore Infusion specifically (or use --limit to test a subset):
   ```bash
   tsx scripts/refresh-market-prices.ts --limit=1
   ```
   Or better, create a quick diagnostic that fetches just this item.

2. Verify the new price in `defaults.json` is close to ~7500 (the user-reported actual market price)

3. Check other items for any unexpected price changes — the tier filter should bring many prices closer to base-tier reality.

4. Run the full test suite to ensure nothing is broken:
   ```bash
   npm run test
   ```

5. Run a full market price refresh with the fix in place.

## Affected Files
- `/home/felix/idle-mmo-profiter/src/data/defaults.json` — prices updated after refresh
- All test files — verify green

## Acceptance Criteria

- Earthcore Infusion price in defaults.json is approximately 7500 (within reasonable VWAP range)
- All tests pass
- No unexpected regressions in other item prices

