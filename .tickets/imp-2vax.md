---
id: imp-2vax
status: open
deps: []
links: []
created: 2026-03-10T10:13:42Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-w271
---
# Phase 1: Investigate and confirm root cause — tier contamination in VWAP

## Root Cause Analysis

The `computeMarketPrice()` function in `/home/felix/idle-mmo-profiter/src/utils/computeMarketPrice.ts` computes VWAP across ALL entries in the `latest_sold` array without filtering by the item's tier.

The API call `getMarketHistory(hashedId)` defaults to `tier: 0`, which in the IdleMMO API means 'all tiers' (unfiltered). Each `LatestSoldEntry` has its own `tier` field (line 96 of services.ts) indicating the actual tier of the item at time of sale. Higher-tier versions of an item sell for significantly more than tier 0/1.

**Hypothesis:** Earthcore Infusion base-tier sales cluster around 7500, but the `latest_sold` array also contains higher-tier sales at elevated prices (e.g., tier 2+ at 10000+), which pull the VWAP up to ~8500.

## Tasks

1. Add temporary logging to `computeMarketPrice()` or write a diagnostic script that:
   - Fetches the market history for Earthcore Infusion (hashedId: `Rv5g4z1dQnK9Nqy32jpG`)
   - Prints ALL `latest_sold` entries with their `tier`, `price_per_item`, `quantity`, and `sold_at`
   - Shows which entries fall within the 24h window
   - Computes VWAP with and without tier filtering to confirm the price discrepancy

2. Document findings in a note on the epic

## Affected Files
- `/home/felix/idle-mmo-profiter/src/utils/computeMarketPrice.ts` (line 10-27)
- `/home/felix/idle-mmo-profiter/src/api/services.ts` (line 90-101, LatestSoldEntry type)

## Acceptance Criteria

- Root cause confirmed or refuted with data
- Findings documented as note on epic imp-w271
- Clear understanding of tier distribution in Earthcore Infusion sales

