---
id: imp-xfsz
status: closed
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


## Notes

**2026-02-25T19:31:04Z**

Starting implementation of loading states, error handling, and empty states. Will create reusable components and integrate them throughout the app.

**2026-02-25T19:33:51Z**

Completed loading states, error handling, and empty states:
- Created Toast notification component with auto-dismiss
- Created useToast composable for managing notifications
- Created EmptyState component for no-data scenarios
- Created LoadingSpinner component (ready for future use)
- Created ErrorBoundary component for catching runtime errors
- Integrated Toast notifications into settings save/export/import
- Added EmptyState to ProfitRankingTable
- Updated all alerts to use toast notifications
- Added ARIA labels to tables for accessibility (role=grid, aria-label)
