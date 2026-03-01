---
id: imp-kkeb
status: closed
deps: [imp-48u4]
links: []
created: 2026-02-28T23:46:12Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-84k1
tags: [component, ui, settings]
---
# Hide settings button, settings modal, and API key UI in static mode

## Phase 3: Remove settings gear button, settings modal, and API key UI in static mode

### Summary
The settings gear button in the header and the entire settings modal (including API key input, magic find settings, market tax settings, import/export, and reset) must be hidden in static mode. These are all interactive features that either configure API access or modify calculation parameters.

### What to implement

**1. Modify `src/App.vue`:**
- Import `useStaticMode`
- Wrap the settings gear button in `v-if="!isStaticMode"`
- Wrap the settings modal overlay in `v-if="showSettings && !isStaticMode"` 
  (or just leave the existing `v-if="showSettings"` since the button to trigger it is hidden)
- Hide the Market tab override stats badge in static mode: `v-if="overrideStats.total > 0 && !isStaticMode"`
- Optionally hide keyboard shortcut listener for Escape (settings modal)

```ts
import { useStaticMode } from './composables/useStaticMode'
const { isStaticMode } = useStaticMode()
```

In template:
```html
<!-- Hide settings button in static mode -->
<button v-if="!isStaticMode" class="btn-settings" ...>
  <!-- settings icon -->
</button>

<!-- Hide settings modal in static mode -->
<div v-if="showSettings && !isStaticMode" class="modal-overlay" ...>
  <!-- modal content -->
</div>
```

**2. No changes needed to SettingsPanel.vue or ApiKeyInput.vue:**
Since the modal is never rendered in static mode, these components become dead code and Vite's tree-shaking should exclude them from the bundle. However, the imports in App.vue will still be present. Consider:
- Making the SettingsPanel import dynamic/conditional (nice-to-have for bundle size)
- OR just leaving the imports — they'll still be tree-shaken if never mounted

### Files to modify
- MODIFY: `src/App.vue`

### Components that become dead code in static mode:
- `SettingsPanel.vue` (never rendered)
- `ApiKeyInput.vue` (child of SettingsPanel, never rendered)

### Acceptance criteria
- [ ] In normal mode: Settings button and modal work exactly as before
- [ ] In static mode: Settings gear button is NOT rendered in the header
- [ ] In static mode: Settings modal is NOT rendered
- [ ] In static mode: No keyboard shortcut issues (Escape key)
- [ ] In static mode: Market tab override badge is NOT shown
- [ ] All existing tests pass

