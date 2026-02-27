---
id: imp-ctpj
status: closed
deps: [imp-h770]
links: []
created: 2026-02-26T20:14:23Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-q2p9
---
# Phase 2: Make resetToDefaults explicitly clear data provider overrides

## Problem
Even after unifying the prefix (Phase 1), the reset functions should be more explicit about what they clear. Currently they rely on iterating all keys, which is fragile.

## Fix
Update `resetToDefaults()` and `resetAll()` in `useSettingsManager.ts` to explicitly clear the data provider overrides key alongside the generic key iteration.

In `/home/felix/idle-mmo-profiter/src/composables/useSettingsManager.ts`:

1. Import `removeStorage` (already imported) -- no change needed
2. After the forEach loop in `resetToDefaults()` (line 106), add an explicit call:
   ```ts
   // Explicitly clear data provider overrides (belt-and-suspenders)
   removeStorage('user-overrides')
   ```
3. Same for `resetAll()` -- though it already iterates all keys, the explicit call ensures correctness if the iteration ever misses something.

This is a defense-in-depth approach: even if a future developer introduces a new storage key pattern, the reset functions will still clear the critical user-overrides key.

## Files to Modify
- `/home/felix/idle-mmo-profiter/src/composables/useSettingsManager.ts` (lines 99-106 for resetToDefaults, lines 123-125 for resetAll)

## Acceptance Criteria

- resetToDefaults() explicitly removes 'user-overrides' key
- resetAll() explicitly removes 'user-overrides' key
- Both functions still iterate all keys as before (no behavior removed)


## Notes

**2026-02-26T20:16:43Z**

Phase 2 complete: Added explicit removeStorage('user-overrides') calls in both resetToDefaults() and resetAll() functions in useSettingsManager.ts. This ensures the user overrides key is always cleared during reset, even if future changes introduce new key patterns.
