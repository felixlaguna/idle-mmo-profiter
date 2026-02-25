---
id: imp-t3ue
status: open
deps: [imp-apms]
links: []
created: 2026-02-25T18:32:48Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-64ql
---
# Build settings import/export and reset functionality

Add to settings panel:

- Export All Settings button: downloads JSON file with all user overrides, MF settings, API key (optional checkbox to include)
- Import Settings button: file upload, validates JSON, applies overrides
- Reset All to Defaults button: clears all overrides, confirms first
- Reset Prices to API Values button: clears price overrides but keeps other settings
- Last data refresh timestamp display
- Manual refresh button (triggers API fetch for prices, respecting rate limits)

## Acceptance Criteria

Export produces valid JSON, import restores state, reset works correctly

