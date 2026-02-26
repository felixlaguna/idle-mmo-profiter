---
id: imp-d4ny
status: closed
deps: []
links: []
created: 2026-02-26T19:27:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-odkj
---
# Phase 1: Create HashedIdModal component

Create a new Vue component for viewing/editing hashed IDs.

## Component: src/components/HashedIdModal.vue

### Props:
- visible: boolean (v-model for show/hide)
- itemName: string (display name of the item)
- itemId: string (internal ID, e.g., 'mat-1')
- category: 'materials' | 'potions' | 'resources' | 'recipes'
- currentHashedId: string (current hashed ID value, may be empty)

### Emits:
- update:visible (close modal)
- save(newHashedId: string) (save the edited hashed ID)

### UI Design:
- Reuse existing modal pattern from MarketTable.vue (modal-overlay, modal-content-small, etc.)
- Modal header: 'Hashed ID - {itemName}'
- Modal body:
  - Label: 'Current Hashed ID'
  - Text input (type text, not number) pre-filled with current value
  - Show 'No hashed ID set' in muted text if empty
  - Warning text explaining that incorrect hashed IDs will cause wrong price lookups
- Modal footer:
  - Save button (primary, disabled if value unchanged)
  - Cancel button (secondary)
  - Clear button (danger, only if hashed ID currently set) to remove/reset to empty

### Keyboard Support:
- Enter to save
- Escape to close
- Auto-focus input on open

### Files to create:
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue

### Styling:
- Use existing CSS variables (--bg-primary, --bg-secondary, --border-color, etc.)
- Reuse modal-overlay, modal-content-small, modal-header-small patterns from MarketTable.vue
- Extract shared modal styles or use scoped styles matching existing patterns

## Acceptance Criteria

- [ ] Component renders with correct props
- [ ] Input shows current hashed ID or empty state
- [ ] Save emits new value, Cancel closes without saving
- [ ] Clear button resets hashed ID to empty string
- [ ] Keyboard shortcuts work (Enter/Escape)
- [ ] Styling matches existing MarketTable modal


## Notes

**2026-02-26T19:30:41Z**

Phase 1 complete - HashedIdModal.vue created

Implementation details:
- Component props: visible, itemName, itemId, category, currentHashedId
- Emits: update:visible, save(hashedId)
- Features implemented:
  * Auto-focus on modal open
  * Keyboard support (Enter to save, Escape to close)
  * Save button disabled if value unchanged
  * Clear button only shown if hashed ID is set
  * Trim whitespace before saving
  * Reactivity: watches currentHashedId for changes while modal is open
  * Warning message about incorrect hashed IDs
  * Placeholder 'Not set' for empty hashed IDs
- Styling matches existing MarketTable modal patterns
- Responsive design included (full-width on mobile, touch-friendly inputs)
