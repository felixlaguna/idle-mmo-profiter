---
id: imp-2dqe
status: closed
deps: []
links: []
created: 2026-03-09T14:25:14Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Show actual data update date instead of 'Using default data'

Replace the 'Using default data' message at the top of the app with the actual updated date and hour of the data


## Notes

**2026-03-09T14:27:05Z**

## Planning Complete

### Scouter Analysis
This is a small UI change. All the data needed already exists in the codebase.

**Key finding:** Every item in `defaults.json` already has a `lastUpdated` ISO timestamp field, set by the `refresh-market-prices.ts` CLI script. The current code simply ignores these timestamps and shows a hardcoded 'Using default data' message.

### Affected files (6 files):
- `src/App.vue` (lines 190-204, 334) - Main logic: compute max date, update display
- `src/components/ApiKeyInput.vue` (line 156) - Warning banner text
- `src/api/mock.ts` (lines 116, 266) - Status message text
- `src/tests/mock-provider.test.ts` (lines 34, 133, 218) - Test assertions
- `src/tests/components/DataProviderStatus.test.ts` (line 31) - Test assertion
- `src/tests/components/ApiKeyInput.test.ts` (line 45) - Test assertion

### Phases: 1 task ticket (imp-0o3f)
This is simple enough for a single task. No database changes, no new dependencies, no new components.

### Approach
Compute the maximum `lastUpdated` timestamp across all item arrays in defaults.json and display it in a human-friendly format. Straightforward string comparison on ISO dates to find the max.

### Risks
- None significant. Pure UI change with existing data.

**2026-03-09T14:30:15Z**

Task imp-0o3f completed successfully.

Summary:
- Replaced hardcoded 'Using default data' text with actual data update date from defaults.json
- Desktop view shows: 'Data from Mar 9, 2:12 PM' (example format)
- Mobile view shows: 'Mar 9' (short format)
- Updated warning banner and status messages for consistency
- All 640 tests passing
- Docker build successful

Implementation details:
- Computed max lastUpdated timestamp across all item arrays in defaults.json
- Used human-friendly date formatting with toLocaleDateString and toLocaleTimeString
- Maintained fallback to 'Using default data' if timestamps are missing
- Updated all test assertions to match new message format

Ready for review.

**2026-03-09T14:32:08Z**

## Code Review: APPROVED

Files reviewed:
- /home/felix/idle-mmo-profiter/src/App.vue
- /home/felix/idle-mmo-profiter/src/components/ApiKeyInput.vue
- /home/felix/idle-mmo-profiter/src/api/mock.ts
- /home/felix/idle-mmo-profiter/src/tests/mock-provider.test.ts
- /home/felix/idle-mmo-profiter/src/tests/components/DataProviderStatus.test.ts
- /home/felix/idle-mmo-profiter/src/tests/components/ApiKeyInput.test.ts

### Linter: PASS (ESLint - 0 issues)
### TypeScript: PASS (vue-tsc --noEmit - 0 errors)
### Tests: PASS (640/640, 1 skipped - unchanged from baseline)

### Style Guide: Compliant
- Naming conventions followed
- Existing code patterns maintained (computed properties, template structure)
- Proper fallback behavior preserved ('Using default data' / 'Default' when no timestamps exist)

### Review Notes

**Correctness:**
- The dataLastUpdated computed correctly scans materials (99 items), resources (7 items), and recipes (345 items) for max lastUpdated timestamp. craftables is 0 items but the spread is harmless.
- String comparison on ISO timestamps is valid for finding the max date.
- Fallback paths retained for missing timestamps.
- The old unused lastUpdateTime ref was cleanly removed with no remaining references.
- All test assertions correctly updated from 'Using default data' to 'Offline data'.

**Minor observations (non-blocking):**
1. dataLastUpdated is a computed property over a static JSON import -- the value will never change during the app lifecycle. A plain const would suffice. However, using computed is idiomatic Vue and causes no harm, so this is purely stylistic.
2. Line 218 (lastUpdateText format string) is 208 chars and line 355 (template) is 370 chars. Both pass ESLint. The template line already existed at similar length -- only the interpolation changed.

No issues found. Ready for user review.

**2026-03-09T14:32:23Z**

Review: APPROVED. ESLint clean, vue-tsc clean, 640/640 tests passing. Ready for user review.

**2026-03-09T14:34:01Z**

User Review: Minor issue - If the date is today, omit the day so it's easier to read (e.g., just show '2:12 PM' instead of 'Mar 9, 2:12 PM')

**2026-03-09T14:37:39Z**

User Review: Perfect - approved
