---
id: imp-14kx
status: open
deps: [imp-gpt6]
links: []
created: 2026-03-10T10:14:13Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-w271
---
# Phase 3: Update tests for tier-filtered VWAP

## Test Updates

Update the test suite in `/home/felix/idle-mmo-profiter/src/tests/utils/computeMarketPrice.test.ts` to cover the new tier-filtering behavior.

### New Test Cases Needed

1. **Tier filtering excludes higher-tier sales**
   - Input: mix of tier-0 and tier-2 sales within 24h
   - Expected: VWAP only uses tier-0 sales
   - Verify: higher-tier prices do NOT inflate the result

2. **Fallback when no tier-0 sales in 24h window**
   - Input: only tier-2 sales in 24h, but tier-0 sales exist outside 24h
   - Expected: falls back to most recent tier-0 sale price

3. **Fallback when no tier-0 sales exist at all**
   - Input: only tier-2 and tier-3 sales
   - Expected: falls back to all-tier VWAP (graceful degradation)

4. **Explicit tierFilter parameter override**
   - Input: sales across multiple tiers, call with tierFilter=2
   - Expected: VWAP uses only tier-2 sales

5. **Backward compatibility: existing tests still pass**
   - All existing test cases must continue to pass unchanged (since default tierFilter=0 matches the tier in makeSale helper which defaults to tier: 1)
   - NOTE: the existing `makeSale` helper defaults to `tier: 1` — tests may need updating to use `tier: 0` to match the new default filter

### Existing Test Adjustments
- Update `makeSale` helper: ensure it sets `tier: 0` by default (or explicitly set tier in each test case)
- Existing tests should remain valid with tier-0 entries

## Affected Files
- `/home/felix/idle-mmo-profiter/src/tests/utils/computeMarketPrice.test.ts` — add new tests, update makeSale helper

## Acceptance Criteria

- All existing tests pass (possibly with makeSale tier adjustment)
- New tests cover: tier filtering, fallback when no tier-0 in 24h, fallback when no tier-0 at all, explicit tierFilter override
- Tests verify the specific Earthcore Infusion scenario (mixed-tier VWAP vs tier-0-only VWAP)

