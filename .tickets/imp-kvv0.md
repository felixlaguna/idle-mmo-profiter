---
id: imp-kvv0
status: closed
deps: [imp-ctpj]
links: []
created: 2026-02-26T20:14:35Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-q2p9
---
# Phase 3: Add tests for reset-to-defaults functionality

## Problem
There are no tests for the reset functionality. The `useSettingsManager.ts` file has zero test coverage. This is how the bug went undetected.

## What to Test

### Unit tests for useSettingsManager (new test file)
Create `/home/felix/idle-mmo-profiter/src/tests/composables/useSettingsManager.test.ts`:

1. **resetToDefaults clears settings keys** -- set some useStorage keys (magicFind, marketTaxRate), call resetToDefaults, verify they are removed from localStorage
2. **resetToDefaults preserves apiKey** -- set apiKey, call resetToDefaults, verify apiKey still exists
3. **resetToDefaults clears user-overrides key** -- set the user-overrides key in localStorage, call resetToDefaults, verify it is removed
4. **resetAll clears everything** -- set all keys including apiKey and user-overrides, call resetAll, verify localStorage is empty of idlemmo: keys

### Integration test for useDataProvider
Add to `/home/felix/idle-mmo-profiter/src/tests/composables/useDataProvider.test.ts`:

5. **clearAllOverrides resets computed values** -- set overrides, call clearAllOverrides, verify computed materials/potions/etc return default values
6. **User overrides key uses same prefix as useStorage** -- verify the key is discoverable by getAllStorageKeys()

## Mock Considerations
- useSettingsManager calls `window.confirm()` and `window.location.reload()` -- these must be mocked
- useToast calls must be mocked or the toast composable must be importable in test context

## Files to Create/Modify
- CREATE: `/home/felix/idle-mmo-profiter/src/tests/composables/useSettingsManager.test.ts`
- MODIFY: `/home/felix/idle-mmo-profiter/src/tests/composables/useDataProvider.test.ts` (add integration tests)

## Acceptance Criteria

- New test file for useSettingsManager with at least 4 test cases
- Tests verify reset clears user-overrides key
- Tests verify reset preserves apiKey (for resetToDefaults)
- Tests verify storage prefix consistency between useStorage and useDataProvider
- All tests pass


## Notes

**2026-02-26T20:19:02Z**

Phase 3 complete: Created comprehensive test suite for useSettingsManager (18 tests) covering resetToDefaults, resetAll, export/import functionality. Added 4 integration tests to useDataProvider for storage prefix consistency and reset functionality. All new tests passing (191/192 total - 1 pre-existing failure unrelated to bug fix).
