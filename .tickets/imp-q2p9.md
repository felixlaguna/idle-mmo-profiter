---
id: imp-q2p9
status: closed
deps: []
links: []
created: 2026-02-26T20:12:45Z
type: bug
priority: 2
assignee: Félix Laguna Teno
---
# Bug: Reset to defaults not working

The reset to defaults functionality is not working correctly. Need to investigate and fix.


## Notes

**2026-02-26T20:13:10Z**

User feedback: Clicking reset in Settings panel does nothing - values stay the same. No error or crash.

**2026-02-26T20:14:01Z**

## Root Cause Analysis

### Bug Summary
When the user clicks 'Reset to Defaults' in the Settings panel, nothing changes. No error, no crash.

### Root Cause: Storage Prefix Mismatch

There are TWO different localStorage prefix constants in the codebase:

1. `useStorage.ts` (line 3): `STORAGE_PREFIX = 'idlemmo:'` (colon separator)
2. `useDataProvider.ts` (line 17): `STORAGE_PREFIX = 'idlemmo-'` (hyphen separator)

This means data is stored under two different namespaces:
- Settings (magicFind, marketTaxRate, apiKey) -> stored as `idlemmo:magicFind`, `idlemmo:marketTaxRate`, etc.
- User overrides (price edits, hashedIds, etc.) -> stored as `idlemmo-user-overrides`

### How the Reset Works (and fails):

The reset flow is:
1. SettingsPanel calls `resetToDefaults()` from `useSettingsManager.ts`
2. `resetToDefaults()` calls `getAllStorageKeys()` from `useStorage.ts`
3. `getAllStorageKeys()` scans localStorage for keys starting with `'idlemmo:'`
4. It removes all found keys (except 'apiKey')
5. Then reloads the page

**The problem**: `getAllStorageKeys()` only finds keys prefixed with `'idlemmo:'` (the useStorage prefix). It completely MISSES the user overrides key `'idlemmo-user-overrides'` because that uses a different prefix (`'idlemmo-'`).

So after reset:
- [x] Settings like magicFind, marketTaxRate ARE cleared (idlemmo: prefix)
- [ ] User price overrides are NOT cleared (idlemmo- prefix) -- THIS IS THE BUG
- After page reload, useDataProvider loads the stale overrides from `idlemmo-user-overrides`
- Values appear unchanged because the overrides survive the reset

### Additional Issue: Reactivity Gap

Even if the storage key were cleared, there is a secondary problem:
- The page reloads after reset (via setTimeout + window.location.reload)
- This masks a reactivity gap: the useStorage refs in SettingsPanel would NOT auto-update if localStorage were cleared externally
- But since the page reloads, this is currently not a visible bug (the reload is the workaround)

### Affected Files
- `/home/felix/idle-mmo-profiter/src/composables/useStorage.ts` (line 3) - defines 'idlemmo:' prefix
- `/home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts` (lines 17-18) - defines 'idlemmo-' prefix  
- `/home/felix/idle-mmo-profiter/src/composables/useSettingsManager.ts` (lines 90-110, 115-129) - reset functions use only useStorage's getAllStorageKeys

### Fix Strategy
Unify the storage prefix OR make resetToDefaults/resetAll also clear the data provider overrides key.

**2026-02-26T20:14:48Z**

## Planning Complete

### Phases Created (3 task tickets)

1. **imp-h770** - Phase 1: Unify storage prefix constants
   - Change useDataProvider.ts STORAGE_PREFIX from 'idlemmo-' to 'idlemmo:'
   - Add one-time migration for existing users' localStorage data

2. **imp-ctpj** - Phase 2: Make resetToDefaults explicitly clear data provider overrides
   - Add explicit removeStorage('user-overrides') call in both reset functions
   - Defense-in-depth approach

3. **imp-kvv0** - Phase 3: Add tests for reset-to-defaults functionality
   - New test file for useSettingsManager
   - Integration tests for storage prefix consistency

### Dependencies
imp-h770 -> imp-ctpj -> imp-kvv0 (linear chain)

### Risks
- Risk 1: Existing users have data under old key 'idlemmo-user-overrides'
  Mitigation: Phase 1 includes a one-time migration that copies data to new key before removing old key
- Risk 2: The singleton pattern in useDataProvider caches the instance, so tests need to handle this
  Mitigation: Existing tests already handle this via clearAllOverrides() in beforeEach

### Files Affected
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts (prefix change + migration)
- /home/felix/idle-mmo-profiter/src/composables/useSettingsManager.ts (explicit reset of user-overrides key)
- /home/felix/idle-mmo-profiter/src/tests/composables/useSettingsManager.test.ts (NEW)
- /home/felix/idle-mmo-profiter/src/tests/composables/useDataProvider.test.ts (add integration tests)

**2026-02-26T20:19:11Z**

Bug fix complete. All 3 phases implemented successfully:

Phase 1 (imp-h770): Unified storage prefix from 'idlemmo-' to 'idlemmo:' in useDataProvider.ts. Added one-time migration for existing users.

Phase 2 (imp-ctpj): Added explicit removeStorage('user-overrides') calls in resetToDefaults() and resetAll() for defense-in-depth.

Phase 3 (imp-kvv0): Created comprehensive test suite with 18 new tests for useSettingsManager and 4 integration tests for storage prefix consistency.

Root cause fixed: Storage prefix mismatch resolved. Reset to defaults now correctly clears user overrides.

Test results: 191/192 passing (1 pre-existing failure unrelated to this bug).

Files modified:
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts
- /home/felix/idle-mmo-profiter/src/composables/useSettingsManager.ts
- /home/felix/idle-mmo-profiter/src/tests/composables/useSettingsManager.test.ts (NEW)
- /home/felix/idle-mmo-profiter/src/tests/composables/useDataProvider.test.ts

**2026-02-26T20:22:23Z**

## Code Review: APPROVED (with minor observations)

### Files Reviewed
- `/home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts` (prefix change + migration)
- `/home/felix/idle-mmo-profiter/src/composables/useSettingsManager.ts` (explicit removeStorage calls)
- `/home/felix/idle-mmo-profiter/src/tests/composables/useSettingsManager.test.ts` (NEW - 18 tests)
- `/home/felix/idle-mmo-profiter/src/tests/composables/useDataProvider.test.ts` (4 new integration tests)
- `/home/felix/idle-mmo-profiter/src/composables/useStorage.ts` (reviewed for context, unchanged)

### Linter: PASS (source files clean; test file issues are pre-existing systemic pattern)
- `useDataProvider.ts`: 0 errors
- `useSettingsManager.ts`: 0 errors
- Test files have `no-undef` errors for `global`/`Storage` -- this is a pre-existing project-wide issue (60 total errors across all test files) caused by missing Node/Vitest globals in the ESLint config. Not introduced by this change.

### TypeScript: PASS
- `vue-tsc --noEmit` passes with zero errors.

### Tests: PASS (191/192)
- 18/18 new useSettingsManager tests: PASS
- 4/4 new useDataProvider integration tests: PASS
- 1 pre-existing failure: "should preserve empty hashedId as empty string" -- confirmed pre-existing (fails on the prior commit too). The last material in defaults.json already has a hashedId value, so the test assumption is wrong. Not related to this bug fix.

### Correctness Analysis

**Phase 1 - Storage prefix unification (useDataProvider.ts):**
- CORRECT: Changed `STORAGE_PREFIX` from `'idlemmo-'` to `'idlemmo:'` (line 17), now matching `useStorage.ts` (line 3).
- CORRECT: Migration logic (lines 88-103) properly handles the one-time migration:
  - Only migrates when old key exists AND new key does NOT exist (avoids overwriting newer data).
  - Removes old key after successful copy.
  - Wrapped in try/catch so migration failure does not break the application.
  - Runs inside `createDataProvider()` which is the singleton factory, so it executes exactly once per app load.
- Edge case handled well: If both old and new keys exist (e.g., user manually set data under new key), the old key is left alone. This is the correct conservative behavior.
- Minor observation: The old key `'idlemmo-user-overrides'` is never cleaned up if both keys exist. This is a very unlikely scenario and causes no harm (orphaned key in localStorage), so it is acceptable.

**Phase 2 - Defense-in-depth reset (useSettingsManager.ts):**
- CORRECT: Added `removeStorage('user-overrides')` in both `resetToDefaults()` (line 109) and `resetAll()` (line 131).
- This is now technically redundant since `getAllStorageKeys()` will find `user-overrides` under the unified `idlemmo:` prefix. However, as a belt-and-suspenders approach, it is good defensive coding and costs nothing.
- Placement is correct: after the loop that removes keys, ensuring it always runs regardless of loop behavior.

**Phase 3 - Tests:**
- `useSettingsManager.test.ts`: 18 well-structured tests covering:
  - resetToDefaults clears settings keys
  - resetToDefaults preserves apiKey
  - resetToDefaults clears user-overrides
  - Confirmation prompt behavior (accept and cancel)
  - Page reload after reset
  - resetAll clears everything including apiKey
  - Export and import functionality
  - Integration tests for sequential resets and complex state
- `useDataProvider.test.ts` additions: 4 new integration tests covering:
  - Storage prefix consistency with useStorage
  - Discoverability by getAllStorageKeys
  - Migration from old to new prefix
  - clearAllOverrides resets computed values

### Observations (non-blocking)

1. **Migration test is manual rather than end-to-end** (useDataProvider.test.ts lines 359-397): Due to the singleton pattern, the migration test cannot actually trigger `createDataProvider()` again. Instead, it manually replicates the migration logic. This is an acceptable tradeoff given the singleton constraint, and the comment in the test explains why. The actual migration code is structurally simple enough to verify by inspection.

2. **No cleanup of orphaned old key**: If a user somehow has data under both `idlemmo-user-overrides` and `idlemmo:user-overrides`, the old key persists forever. This is an extreme edge case with zero user impact.

3. **`console.log` in production migration path** (useDataProvider.ts line 99): The migration logs `console.log('Migrated user overrides...')` on success. This is fine as a one-time migration message but could be removed if the project prefers silent production code. Non-blocking.

### Verdict

The root cause (storage prefix mismatch) is correctly identified and fixed. The prefix unification ensures `getAllStorageKeys()` now discovers user-overrides. The migration handles existing users gracefully. The defense-in-depth `removeStorage` calls add a safety net. Test coverage is thorough with 22 new tests total. No regressions introduced.

**APPROVED** - Ready for user review.

**2026-02-26T20:26:29Z**

User Review: Perfect - work approved
