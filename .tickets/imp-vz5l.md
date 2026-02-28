---
id: imp-vz5l
status: closed
deps: []
links: []
created: 2026-02-28T22:46:26Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-a9ce
tags: [iteration-2, ci-blocker]
---
# Fix ESLint config: declare test globals and add missing browser globals

## Context

Code review of imp-a9ce (Phase 2) found 61 pre-existing ESLint errors that will cause the CI pipeline (npx eslint .) to fail on every push/PR. These are not regressions from the feature work -- they exist on master today -- but they block the new CI workflow from passing.

## Error Breakdown (61 total)

- no-undef: global (Node.js) -- 33 errors in src/tests/**
- no-undef: Storage (DOM type) -- 3 errors in src/tests/**
- no-undef: beforeEach (Vitest) -- 1 error in src/tests/**
- @typescript-eslint/no-explicit-any -- 23 errors in src/tests/**
- no-undef: MouseEvent (DOM type) -- 1 error in CraftableTable.vue

## File to Modify

/home/felix/idle-mmo-profiter/eslint.config.js

## Required Changes

### 1. Add MouseEvent to browser globals (main config block, ~line 46)

Add MouseEvent: 'readonly' to the existing globals object alongside the other browser types (after Event on line 47).

### 2. Add a test-file override config block

Add a NEW config object in the exported array (before the ignores block) targeting src/tests/** files:

  {
    files: ['src/tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        // Node / DOM globals used in tests
        global: 'readonly',
        Storage: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }

## Acceptance Criteria

- npx eslint . exits 0 with no errors
- No functional changes to source or test files -- config-only fix
- All 274 tests still pass (npm run test:run)


## Notes

**2026-02-28T22:47:56Z**

ESLint config updated successfully:

1. Added MouseEvent: 'readonly' to browser globals (fixes CraftableTable.vue error)
2. Added new config block for test files (src/tests/**/*.{ts,tsx}) with:
   - Vitest globals: describe, it, expect, vi, beforeAll, beforeEach, afterEach
   - Node/DOM globals: global, Storage
   - Disabled @typescript-eslint/no-explicit-any rule

Files modified:
- /home/felix/idle-mmo-profiter/eslint.config.js

Verification:
- npx eslint . → 0 errors (was 61 errors)
- npm run test:run → All 274 tests passing
