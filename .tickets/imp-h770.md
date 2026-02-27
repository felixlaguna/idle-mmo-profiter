---
id: imp-h770
status: closed
deps: []
links: []
created: 2026-02-26T20:14:13Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-q2p9
---
# Phase 1: Unify storage prefix constants

## Problem
Two different storage prefix constants exist:
- `useStorage.ts` line 3: `STORAGE_PREFIX = 'idlemmo:'`
- `useDataProvider.ts` line 17: `STORAGE_PREFIX = 'idlemmo-'`

This causes `getAllStorageKeys()` to miss the data provider's `idlemmo-user-overrides` key during reset.

## Fix
Change `useDataProvider.ts` line 17 to use the same prefix as `useStorage.ts`:
```ts
const STORAGE_PREFIX = 'idlemmo:'
const USER_OVERRIDES_KEY = \`\${STORAGE_PREFIX}user-overrides\`
```

This changes the localStorage key from `idlemmo-user-overrides` to `idlemmo:user-overrides`, which means `getAllStorageKeys()` will find it during reset.

## Migration Consideration
Existing users will have data under the old key `idlemmo-user-overrides`. We need a one-time migration:
- On load, check if `idlemmo-user-overrides` exists
- If it does and `idlemmo:user-overrides` does NOT exist, copy the value over
- Remove the old key

Add the migration logic at the top of `createDataProvider()` in useDataProvider.ts, BEFORE the `getUserOverrides()` call.

## Files to Modify
- `/home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts` (lines 17-18, plus add migration block around line 88)

## Acceptance Criteria

- Storage prefix in useDataProvider.ts matches useStorage.ts ('idlemmo:')
- One-time migration moves data from old key to new key
- Old key is removed after migration
- getAllStorageKeys() now returns 'user-overrides' as one of its keys


## Notes

**2026-02-26T20:16:14Z**

Phase 1 complete: Storage prefix unified from 'idlemmo-' to 'idlemmo:' in useDataProvider.ts. Added one-time migration logic in createDataProvider() to move existing user data from old key to new key. Tests passing (42/43 - 1 pre-existing failure unrelated to these changes).
