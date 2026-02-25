---
id: imp-vzna
status: open
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

