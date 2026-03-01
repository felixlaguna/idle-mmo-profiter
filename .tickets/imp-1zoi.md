---
id: imp-1zoi
status: closed
deps: [imp-48u4]
links: []
created: 2026-02-28T23:45:55Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-84k1
tags: [component, ui]
---
# Make EditableValue support read-only static mode

## Phase 2: Make EditableValue read-only in static mode

### Summary
EditableValue is the most widely used interactive component — it appears in SettingsPanel, CraftableTable, ResourceTable, DungeonTable, and MarketTable. In static mode, it must render as plain read-only text with no click-to-edit, no pencil icon, and no reset button.

### Current behavior
- Displays a value with a pencil icon hint on hover
- Click-to-edit triggers an inline input field
- When value differs from default, shows a reset button and blue highlight
- Used via `<EditableValue v-model="..." :default-value="..." />`

### What to implement

**Modify `src/components/EditableValue.vue`:**
- Import `useStaticMode` composable
- When `isStaticMode` is true:
  - Render the value as a plain `<span>` (no click handler, no pencil icon)
  - Hide the reset button
  - Never enter edit mode
  - Do NOT show the overridden highlight (blue border)

Implementation approach — add a computed at the top of script setup:
```ts
import { useStaticMode } from '../composables/useStaticMode'
const { isStaticMode } = useStaticMode()
```

Then in the template, wrap interactive elements:
```html
<!-- Static mode: plain display -->
<div v-if="isStaticMode" class="static-value">
  <span v-if="label" class="label">{{ label }}:</span>
  <span class="value">{{ displayValue }}</span>
</div>
<!-- Interactive mode: existing click-to-edit UI -->
<div v-else class="editable-value" :class="{ overridden: isOverridden }">
  <!-- ... existing template ... -->
</div>
```

### Components that use EditableValue (all affected by this change):
- `/src/components/SettingsPanel.vue` — magic find, tax rate (entire panel hidden in phase 3)
- `/src/components/CraftableTable.vue` — market price, material unit prices, craft time
- `/src/components/DungeonTable.vue` — run cost, time
- `/src/components/ResourceTable.vue` — time, cost, vendor price, market price
- `/src/components/MarketTable.vue` — item prices (partially hidden in phase 4)

### Files to modify
- MODIFY: `src/components/EditableValue.vue`

### Acceptance criteria
- [ ] In normal mode: EditableValue behaves exactly as before (no regression)
- [ ] In static mode: EditableValue renders as plain text
- [ ] In static mode: No pencil icon, no click handler, no edit mode, no reset button
- [ ] In static mode: No blue "overridden" highlight
- [ ] All existing tests pass

