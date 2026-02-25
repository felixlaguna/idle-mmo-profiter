---
id: imp-apms
status: open
deps: [imp-760v]
links: []
created: 2026-02-25T18:32:48Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-64ql
---
# Build API key management UI

Create settings panel component:

- API key input field (password type, with show/hide toggle)
- Save button that stores key in localStorage
- Validate key by calling /v1/auth/check
- Show validation result: key name, scopes, rate limit
- Show current rate limit status (remaining/total, reset time)
- Clear key button with confirmation
- Warning banner when no API key is set: 'Using default data. Enter your API key to get live prices.'
- Link to IdleMMO API settings page for creating keys

## Acceptance Criteria

API key can be entered, validated, stored, and cleared

