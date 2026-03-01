---
id: imp-ow1l
status: closed
deps: [imp-1zoi, imp-kkeb, imp-em6m, imp-h9na, imp-4jqk]
links: []
created: 2026-02-28T23:47:07Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-84k1
tags: [testing, verification]
---
# Add static mode tests and verify bundle size reduction

## Phase 7: Testing and verification

### Summary
Add tests for the static mode composable and verify that the feature works end-to-end by doing a test build with VITE_STATIC_MODE=true.

### What to implement

**1. Unit test: `src/tests/composables/useStaticMode.test.ts`**
- Test that isStaticMode returns false by default
- Test component rendering behavior when static mode is on/off (may need vi.stubEnv)

**2. Component tests (update existing or add new):**
- Test that EditableValue renders as plain text in static mode
- Test that settings button is hidden in static mode
- Test that MarketTable hides refresh controls in static mode

**3. Manual verification checklist:**
- [ ] Run `VITE_STATIC_MODE=true npm run build` and inspect dist/
- [ ] Open the built static page and verify:
  - No settings gear button
  - No settings modal
  - No API key input anywhere
  - No editable values (all values are plain text)
  - No refresh buttons in Market tab
  - No delete buttons in Craftable tab
  - No hashed ID edit icons
  - Data tables still display correctly with proper data
  - Charts still render
  - Activity filters still work
  - Tab navigation works

**4. Build size comparison:**
- Run normal build and note dist/ size
- Run static build and compare — should see reduction due to:
  - SettingsPanel.vue + ApiKeyInput.vue tree-shaken
  - HashedIdModal.vue tree-shaken
  - useApiKeyValidation.ts tree-shaken
  - useMarketRefresh.ts partially tree-shaken
  - API client code partially tree-shaken

### Files to create/modify
- CREATE: `src/tests/composables/useStaticMode.test.ts`
- Optionally update existing component tests

### Acceptance criteria
- [ ] useStaticMode composable has unit tests
- [ ] Static mode build succeeds without errors
- [ ] Static mode build produces a smaller bundle than normal build
- [ ] All existing tests pass (with default non-static mode)
- [ ] Manual verification confirms all interactive elements are removed

