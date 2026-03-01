---
id: imp-h9na
status: closed
deps: [imp-48u4]
links: []
created: 2026-02-28T23:46:40Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-84k1
tags: [component, ui]
---
# Hide delete buttons in CraftableTable in static mode

## Phase 5: Remove CraftableTable delete buttons in static mode

### Summary
CraftableTable has a delete button (X) on each row to remove craftable recipes. In static mode, users should not be able to modify the craftable list.

### What to implement

**Modify `src/components/CraftableTable.vue`:**
- Import `useStaticMode` composable
- Wrap the delete button in `v-if="!isStaticMode"`:

```html
<button
  v-if="!isStaticMode"
  class="btn-delete-craftable"
  title="Remove from craftable list"
  @click.stop="emit('delete:craftable', craftable.name)"
>
  ✕
</button>
```

Note: EditableValue instances in CraftableTable (market price, material unit prices, craft time) are already handled by Phase 2.

### Files to modify
- MODIFY: `src/components/CraftableTable.vue`

### Acceptance criteria
- [ ] In normal mode: Delete button works as before
- [ ] In static mode: Delete button is NOT rendered
- [ ] In static mode: Prices display as read-only (via Phase 2)
- [ ] All existing tests pass

