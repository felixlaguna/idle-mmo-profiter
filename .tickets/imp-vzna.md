---
id: imp-vzna
status: closed
deps: [imp-7w6h]
links: []
created: 2026-02-25T18:32:26Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-7w43
---
# Create mock data layer for development without API key

Create src/api/mock.ts:

- When no API key is set, all API service methods return data from defaults.json
- DataProvider interface that both MockProvider and ApiProvider implement
- getCurrentPrices(): returns either API prices or default prices
- getItemDetails(name): returns either API item details or default data
- App always has data to display, never shows empty state due to missing API key
- Status indicator: 'Using default data' vs 'Using live API data (last updated X minutes ago)'

## Acceptance Criteria

App works identically with and without API key, using defaults.json as fallback


## Notes

**2026-02-26T08:53:34Z**

Starting implementation. Analyzed existing code:
- API client has isConfigured() method to check if API key is set
- Services already fallback to empty responses when no API key
- useDataProvider already provides default data from defaults.json
- Need to create unified DataProvider interface and status indicator

**2026-02-26T08:54:36Z**

Created src/api/mock.ts with:
- DataProvider interface with unified methods
- MockProvider: returns data from defaults.json
- ApiProvider: uses existing API services with fallback
- Status indicators showing data source and last update time
- Factory functions for easy access
Updated src/api/index.ts to export mock module

**2026-02-26T08:56:59Z**

Implementation complete. Created:

Files created:
- /home/felix/idle-mmo-profiter/src/api/mock.ts
  * DataProvider interface with unified methods
  * MockProvider class returning data from defaults.json
  * ApiProvider class using API services with fallback
  * Factory functions (createDataProvider, getDataProvider)
  * Status tracking with getDataProviderStatus()

- /home/felix/idle-mmo-profiter/src/components/DataProviderStatus.vue
  * Status badge component showing 'Using default data' vs 'Using live API data'
  * Shows time since last API update
  * Auto-updates every 30 seconds

- /home/felix/idle-mmo-profiter/src/tests/mock-provider.test.ts (21 tests)
  * Tests MockProvider returns defaults correctly
  * Tests ApiProvider falls back to defaults when no API key
  * Tests factory functions create correct provider type
  * Tests status indicators

- /home/felix/idle-mmo-profiter/src/tests/components/DataProviderStatus.test.ts (6 tests)
  * Tests component displays correct status
  * Tests periodic updates
  * Tests cleanup on unmount

Files updated:
- /home/felix/idle-mmo-profiter/src/api/index.ts
  * Exports mock module types and functions

All tests passing: 118/118
Build successful: npm run build passes
App works identically with and without API key
