---
id: imp-xfsz
status: open
deps: [imp-c5jm]
links: []
created: 2026-02-25T18:34:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-d3kp
---
# Add loading states, error handling, and empty states

Polish all UI states:

Loading states:
- Skeleton loaders for tables while calculating
- Spinner on API refresh button
- Progress indicator for bulk API fetches

Error states:
- API key invalid: clear error message with link to API settings
- Rate limit exceeded: show countdown to reset, queue indicator
- Network error: show cached data age, retry button
- Invalid data: specific error message per field

Empty states:
- No API key: friendly onboarding message explaining the app, how to get API key
- No data for a section: 'No [dungeons/potions/resources] configured'
- No profitable activities: 'No profitable activities found at current prices'

Toast notifications:
- 'Prices updated from API' (on successful refresh)
- 'Using cached data (offline)' (when API unreachable)
- 'Settings saved' (on export/import)
- 'Value reset to default' (on individual reset)

## Acceptance Criteria

All edge cases handled gracefully with helpful UI feedback

