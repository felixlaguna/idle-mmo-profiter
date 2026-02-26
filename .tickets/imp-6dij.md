---
id: imp-6dij
status: closed
deps: []
links: []
created: 2026-02-26T15:40:59Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ixie
---
# Phase 1: Fix stale rate limit state in canMakeRequest() and getWaitTime()

## Summary
Fix the root cause: when the rate limit reset timestamp has passed, the client should clear stale rate limit info and allow requests to proceed.

## Changes Required

### File: /home/felix/idle-mmo-profiter/src/api/client.ts

### Change 1: Add reset-time-elapsed check in canMakeRequest() (lines 108-126)
Before checking `remaining < RATE_LIMIT_THRESHOLD`, check if the reset timestamp has already passed. If it has, clear the stale rateLimitInfo and allow the request:

```typescript
private canMakeRequest(): boolean {
  const now = Date.now()

  // Remove timestamps older than the window
  this.requestTimestamps = this.requestTimestamps.filter(
    (timestamp) => now - timestamp < WINDOW_SIZE_MS
  )

  // If we have rate limit info from headers, check threshold
  if (
    this.rateLimitInfo.remaining !== null &&
    this.rateLimitInfo.remaining < RATE_LIMIT_THRESHOLD
  ) {
    // NEW: If the reset time has passed, clear stale rate limit info
    // and allow the request to proceed
    if (this.rateLimitInfo.reset) {
      const resetTime = this.rateLimitInfo.reset * 1000
      if (resetTime <= now) {
        // Reset time has elapsed -- clear stale info
        this.rateLimitInfo.remaining = null
        this.rateLimitInfo.reset = null
        // Fall through to sliding window check below
      } else {
        return false
      }
    } else {
      return false
    }
  }

  // Check if we're under the rate limit
  return this.requestTimestamps.length < MAX_REQUESTS_PER_MINUTE
}
```

### Change 2: Add minimum wait time floor in processQueue() (lines 290-297)
As a safety net, ensure waitTime is never 0 when canMakeRequest() returns false. This prevents a busy loop even if some other edge case produces a 0 wait time:

```typescript
while (this.requestQueue.length > 0) {
  if (!this.canMakeRequest()) {
    const waitTime = this.getWaitTime()
    // Enforce minimum wait to prevent busy-loop if waitTime is 0 or very small
    const effectiveWait = Math.max(waitTime, 1000)
    console.log(\`Rate limit reached, waiting \${effectiveWait}ms before next request\`)
    await new Promise((resolve) => setTimeout(resolve, effectiveWait))
    continue
  }
  // ... rest of queue processing
}
```

### Change 3: Also clear stale state in getWaitTime() for consistency (lines 131-143)
When reset time has passed in getWaitTime(), also clear the stale info:

```typescript
private getWaitTime(): number {
  if (
    this.rateLimitInfo.reset &&
    this.rateLimitInfo.remaining !== null &&
    this.rateLimitInfo.remaining < RATE_LIMIT_THRESHOLD
  ) {
    const resetTime = this.rateLimitInfo.reset * 1000
    const now = Date.now()
    if (resetTime > now) {
      return resetTime - now
    }
    // Reset time has passed -- clear stale info
    this.rateLimitInfo.remaining = null
    this.rateLimitInfo.reset = null
  }
  // ... rest of sliding window logic unchanged
}
```

## Why all three changes
- Change 1 is the primary fix: it breaks the infinite loop by clearing stale state.
- Change 2 is a safety net: if any future code path causes canMakeRequest()=false with waitTime=0, the minimum floor prevents a busy loop.
- Change 3 keeps getWaitTime() consistent so it also clears stale state (defense in depth).

## Acceptance Criteria

- canMakeRequest() clears stale rateLimitInfo when reset time has elapsed
- getWaitTime() clears stale rateLimitInfo when reset time has elapsed
- processQueue() enforces a minimum wait of 1000ms when rate limited
- No infinite loop when rate limit resets
- After the reset period, requests resume automatically


## Notes

**2026-02-26T15:42:41Z**

Investigation complete. Confirmed the three-part bug:
1. canMakeRequest() blocks based on stale rateLimitInfo.remaining < 3 without checking if reset time passed
2. getWaitTime() returns 0 when reset time passed but doesn't clear stale state
3. processQueue() has no minimum wait floor, creating instant loop with setTimeout(resolve, 0)

Will implement the three fixes:
1. PRIMARY FIX in canMakeRequest(): Clear stale rateLimitInfo when reset timestamp elapsed
2. SAFETY NET in processQueue(): Add Math.max(waitTime, 1000) floor when canMakeRequest() is false
3. DEFENSE IN DEPTH in getWaitTime(): Clear stale state when reset time passed

**2026-02-26T15:43:20Z**

All three fixes implemented in /home/felix/idle-mmo-profiter/src/api/client.ts:

1. PRIMARY FIX (canMakeRequest, lines 121-137): When remaining < threshold, check if reset time has passed. If so, clear stale rateLimitInfo and proceed to sliding window check.

2. DEFENSE IN DEPTH (getWaitTime, lines 158-163): When reset time has passed, clear stale rateLimitInfo for consistency.

3. SAFETY NET (processQueue, lines 315-316): Add Math.max(waitTime, 1000) floor to prevent busy loops if any edge case returns 0ms wait.

**2026-02-26T15:43:52Z**

Fix verified: All existing tests pass (151 tests in 8 test files).

Fix prevents the infinite busy loop by:
1. Clearing stale rate limit state when reset timestamp has elapsed
2. Adding 1000ms minimum wait floor as safety net
3. Multiple layers of defense ensure edge cases are handled

Ready to proceed to Phase 2 (testing).
