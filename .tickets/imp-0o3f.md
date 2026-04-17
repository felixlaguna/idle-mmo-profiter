---
id: imp-0o3f
status: closed
deps: []
links: []
created: 2026-03-09T14:26:54Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2dqe
---
# Compute and display actual data update date in header

## Summary
Replace the hardcoded 'Using default data' text in the App.vue header with the actual date/time the data was last refreshed. The data is already timestamped -- every item in defaults.json has a `lastUpdated` field set by the refresh-market-prices.ts CLI script.

## Implementation Details

### 1. Compute the most recent `lastUpdated` from loaded data (App.vue)

In `/home/felix/idle-mmo-profiter/src/App.vue`, replace the placeholder logic at lines 190-204:

**Current code (lines 190-204):**
```ts
const lastUpdateTime = ref<Date | null>(null)
const lastUpdateText = computed(() => {
  if (\!lastUpdateTime.value) {
    return 'Using default data'
  }
  return \`Last updated: \${lastUpdateTime.value.toLocaleTimeString()}\`
})
```

**New approach:**
- Import `defaultData` from `'../data/defaults.json'` (already available via `useDataProvider`)
- OR better: expose a `dataLastUpdated` computed from `useDataProvider` that scans all arrays (materials, craftables, resources, recipes) for the max `lastUpdated` timestamp
- Compute `lastUpdateText` to show: `'Data from Mar 9, 2:12 PM'` (use a human-friendly date format)
- For the mobile short text (line 334, `.update-text-short`), show something like `'Mar 9'` instead of `'Default'`

**Simplest approach (recommended):** Since `defaults.json` is statically imported, just compute the max `lastUpdated` directly in App.vue from the default data arrays. No need to modify useDataProvider.

```ts
import defaultData from './data/defaults.json'

// Find the most recent lastUpdated across all item arrays
const dataLastUpdated = computed(() => {
  const allArrays = [
    ...(defaultData.materials || []),
    ...(defaultData.craftables || []),
    ...(defaultData.resources || []),
    ...(defaultData.recipes || []),
  ]
  let maxDate = ''
  for (const item of allArrays) {
    if (item.lastUpdated && item.lastUpdated > maxDate) {
      maxDate = item.lastUpdated
    }
  }
  return maxDate ? new Date(maxDate) : null
})

const lastUpdateText = computed(() => {
  if (\!dataLastUpdated.value) {
    return 'Using default data'
  }
  return \`Data from \${dataLastUpdated.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, \${dataLastUpdated.value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}\`
})
```

### 2. Update the mobile short text

In the template at line 334, change `.update-text-short` from hardcoded `Default` to a computed short date:

```ts
const lastUpdateShortText = computed(() => {
  if (\!dataLastUpdated.value) return 'Default'
  return dataLastUpdated.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})
```

Template: change `<span class="update-text-short">Default</span>` to `<span class="update-text-short">{{ lastUpdateShortText }}</span>`

### 3. Update the ApiKeyInput.vue warning banner

In `/home/felix/idle-mmo-profiter/src/components/ApiKeyInput.vue` line 156, change:
`Using default data. Enter your API key to get live prices.`
to something like:
`Enter your API key for live prices.`
(Since we no longer say 'default data' in the header, the banner should also be updated for consistency.)

### 4. Update the mock.ts status message

In `/home/felix/idle-mmo-profiter/src/api/mock.ts` lines 116 and 266, update the message from `'Using default data - no API key configured'` to include the actual date, or simplify to `'Offline data'` since the date is now shown separately.

### 5. Update DataProviderStatus.vue

The `/home/felix/idle-mmo-profiter/src/components/DataProviderStatus.vue` shows the mock status message. Verify it still looks good with the updated message.

### 6. Update tests

- `/home/felix/idle-mmo-profiter/src/tests/mock-provider.test.ts` - lines 34, 133, 218: update assertions that check for 'Using default data'
- `/home/felix/idle-mmo-profiter/src/tests/components/DataProviderStatus.test.ts` - line 31: update assertion
- `/home/felix/idle-mmo-profiter/src/tests/components/ApiKeyInput.test.ts` - line 45: update assertion

## Files to modify
- `/home/felix/idle-mmo-profiter/src/App.vue` (lines 190-204 and 334)
- `/home/felix/idle-mmo-profiter/src/components/ApiKeyInput.vue` (line 156)
- `/home/felix/idle-mmo-profiter/src/api/mock.ts` (lines 116 and 266)
- `/home/felix/idle-mmo-profiter/src/tests/mock-provider.test.ts` (lines 34, 133, 218)
- `/home/felix/idle-mmo-profiter/src/tests/components/DataProviderStatus.test.ts` (line 31)
- `/home/felix/idle-mmo-profiter/src/tests/components/ApiKeyInput.test.ts` (line 45)

## Design decisions
- Use the max `lastUpdated` across materials/craftables/resources/recipes arrays in defaults.json
- Human-friendly format: 'Data from Mar 9, 2:12 PM' (desktop), 'Mar 9' (mobile)
- Keep fallback to 'Using default data' in case `lastUpdated` fields are somehow missing
- No need to add a top-level metadata field to defaults.json -- the per-item timestamps already exist

## Acceptance Criteria

1. Header shows actual data date (e.g., 'Data from Mar 9, 2:12 PM') instead of 'Using default data'
2. Mobile view shows short date (e.g., 'Mar 9') instead of 'Default'
3. ApiKeyInput warning banner text updated for consistency
4. All existing tests pass with updated assertions
5. Fallback still works if lastUpdated fields are missing


## Notes

**2026-03-09T14:27:55Z**

Starting implementation: computing max lastUpdated from defaults.json and updating App.vue, ApiKeyInput.vue, mock.ts, and test files

**2026-03-09T14:30:07Z**

Implementation complete. Files modified:

1. /home/felix/idle-mmo-profiter/src/App.vue
   - Added import for defaultData from defaults.json
   - Replaced lastUpdateTime ref with computed dataLastUpdated that finds max lastUpdated across all items
   - Updated lastUpdateText to format as 'Data from Mar 9, 2:12 PM'
   - Added lastUpdateShortText for mobile view: 'Mar 9'
   - Updated template to use lastUpdateShortText instead of hardcoded 'Default'

2. /home/felix/idle-mmo-profiter/src/components/ApiKeyInput.vue
   - Updated warning banner text from 'Using default data. Enter your API key to get live prices.' to 'Enter your API key for live prices.'

3. /home/felix/idle-mmo-profiter/src/api/mock.ts
   - Simplified status message from 'Using default data - no API key configured' to 'Offline data' (lines 116 and 266)

4. /home/felix/idle-mmo-profiter/src/tests/mock-provider.test.ts
   - Updated test assertions to expect 'Offline data' instead of 'Using default data' (lines 34, 133, 218)

5. /home/felix/idle-mmo-profiter/src/tests/components/DataProviderStatus.test.ts
   - Updated test assertion to expect 'Offline data' instead of 'Using default data' (line 31)

6. /home/felix/idle-mmo-profiter/src/tests/components/ApiKeyInput.test.ts
   - Updated test assertion for warning banner text (line 45)

Tests: All 640 tests passing (1 skipped)
Docker build: Successful

The app now displays the actual data update date from defaults.json instead of 'Using default data'.

**2026-03-09T14:34:59Z**

Implemented cleaner date format for header:

Changes in /home/felix/idle-mmo-profiter/src/App.vue:
- lastUpdateText: If data is from today, shows 'Data from 2:12 PM' (omits date)
- lastUpdateText: If not today, shows 'Data from Mar 9, 2:12 PM' (full format)
- lastUpdateShortText: If today, shows '2:12 PM' (time only)
- lastUpdateShortText: If not today, shows 'Mar 9' (date only)

Both computed properties now check if the data date matches today's date (comparing day, month, year) and adjust format accordingly.

Tests: All 640 tests passing (1 skipped)
