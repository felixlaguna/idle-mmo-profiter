---
id: imp-apms
status: closed
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


## Notes

**2026-02-26T08:43:41Z**

Starting API key management UI implementation.

Analysis:
- Existing ApiKeyInput.vue is basic (no validation, no API check, no rate limit display)
- Using useStorage composable (idlemmo: prefix) instead of StorageManager (immo-profit: prefix)
- Need to enhance ApiKeyInput.vue with API validation and rate limit display
- API client exists at src/api/client.ts with /v1/auth/check capability
- StorageManager exists but not currently used by components

Plan:
1. Create API validation service/composable for /v1/auth/check
2. Enhance ApiKeyInput.vue with validation, rate limit display, warning banner
3. Add link to IdleMMO API settings page
4. Write tests for the enhanced component

**2026-02-26T08:48:01Z**

API key management UI implementation COMPLETE.

Files created:
- /home/felix/idle-mmo-profiter/src/composables/useApiKeyValidation.ts (API validation logic)
- /home/felix/idle-mmo-profiter/src/tests/composables/useApiKeyValidation.test.ts (11 tests)
- /home/felix/idle-mmo-profiter/src/tests/components/ApiKeyInput.test.ts (11 tests)

Files modified:
- /home/felix/idle-mmo-profiter/src/types/index.ts (added ApiKeyInfo and AuthCheckResponse types)
- /home/felix/idle-mmo-profiter/src/components/ApiKeyInput.vue (enhanced with all required features)

Features implemented:
✓ API key input field (password type with show/hide toggle)
✓ Save button that validates key via /v1/auth/check endpoint
✓ Validation result display (key name, scopes, rate limit)
✓ Current rate limit status (remaining/total, reset time)
✓ Visual progress bar for rate limit
✓ Clear key button with confirmation dialog
✓ Warning banner when no API key is set
✓ Link to IdleMMO API settings page for creating keys
✓ Error handling for validation failures
✓ Loading states during validation

Test results: 91/91 tests passing (11 new composable tests + 11 new component tests)
Build status: SUCCESS

All acceptance criteria met.
