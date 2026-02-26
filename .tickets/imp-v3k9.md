---
id: imp-v3k9
status: closed
deps: [imp-6dij]
links: []
created: 2026-02-26T15:41:26Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ixie
---
# Phase 3: Update manual test guide with 0ms regression test

## Summary
Update the existing manual test guide to include a regression test for the 0ms stuck bug.

## File: /home/felix/idle-mmo-profiter/src/tests/api-client-rate-limiting.test.md

### Add new test section: 'Test 12: Rate Limit Reset Recovery (Regression)'

**Goal:** Verify that the client recovers from rate limiting when the reset time has passed.

**Steps:**
1. Make rapid requests to exhaust the rate limit (hit the threshold of remaining < 3)
2. Wait for the rate limit reset period to elapse (or set system clock past reset time)
3. Make another request
4. Verify the request completes successfully
5. Verify console does NOT show 'waiting 0ms'

**Expected:**
- After the reset period, requests resume without getting stuck
- Console may show 'Rate limit reached, waiting Xms' where X > 0, then eventually completes
- No 'waiting 0ms' messages appear

### Also add a note in the existing Test 10 (Rate Limit Threshold)
Add a warning that the previous behavior could cause an infinite loop, and reference the fix.

## Acceptance Criteria

- Manual test guide updated with regression test
- Test describes the exact bug scenario
- Expected behavior clearly documented


## Notes

**2026-02-26T15:51:38Z**

Documentation updated successfully:

1. Added Test 13: Rate Limit Reset Recovery (Regression Test) with:
   - Bug description and root cause
   - Fix explanation (3-part fix)
   - Manual testing steps
   - Reference to automated tests
   - Date fixed and related files

2. Updated Test 10 with note about the bug fix and reference to Test 13

3. Renumbered subsequent tests (Test 13→14, Test 14→15)

File: /home/felix/idle-mmo-profiter/src/tests/api-client-rate-limiting.test.md
