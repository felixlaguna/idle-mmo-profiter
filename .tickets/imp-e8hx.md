---
id: imp-e8hx
status: closed
deps: [imp-defq]
links: []
created: 2026-02-26T19:27:40Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-odkj
---
# Phase 3: Toast feedback and edge case handling

Handle edge cases, validation, and user feedback for hashed ID editing.

## Changes to: /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue and MarketTable.vue

### Validation Rules:
- Hashed IDs in IdleMMO appear to be alphanumeric strings (like 'aB3xY9...')
- Allow empty string (to clear/reset)
- Trim whitespace before saving
- Warn but don't block save for unusual formats (user may know better)

### Toast Notifications (via useToast):
- On save: 'Updated hashed ID for {itemName}' (success)
- On clear: 'Cleared hashed ID for {itemName}' (info)
- On save of empty to empty: no toast (no-op, just close modal)

### Edge Cases:
- Item currently has no hashed ID (empty string): show 'Not set' placeholder in input
- Item hashed ID was auto-detected incorrectly: user edits to correct value
- Multiple rapid edits: each save should work independently (no debouncing needed)
- Modal should reflect current value if item was refreshed while modal is open (watch prop changes)

### Reactivity:
- After saving a hashed ID, if the user then clicks 'Refresh' on that item, 
  useMarketRefresh.getHashedId() should pick up the new value from dataProvider
  (this already works because updateHashedId persists to overrides and the computed 
  properties return merged data)

### Files to modify:
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue

### No changes needed to:
- useDataProvider.ts (updateHashedId already exists and works correctly)
- useMarketRefresh.ts (getHashedId already reads from merged data)

## Acceptance Criteria

- [ ] Whitespace is trimmed before saving
- [ ] Empty input is allowed (clears hashed ID)
- [ ] Toast messages display correctly for save/clear scenarios
- [ ] No toast for no-op (saving same value)
- [ ] Saved hashed ID is correctly used by subsequent refresh operations
- [ ] Modal input shows placeholder when hashed ID is not set


## Notes

**2026-02-26T19:34:14Z**

Phase 3 complete - All validation and edge cases handled

Implementation details (already completed in Phase 1 & 2):
- Validation: whitespace trimmed via trimmedValue computed property before saving
- Empty string allowed (clear functionality implemented)
- Toast notifications implemented in saveHashedId():
  * Success toast: 'Updated hashed ID for {itemName}' when saving new value
  * Info toast: 'Cleared hashed ID for {itemName}' when clearing
  * No toast for no-op (when value unchanged, detected by isValueChanged)
- Placeholder text: 'Not set' shown in input when hashed ID is empty
- Reactivity: watch on currentHashedId updates modal if item refreshed while open
- Save button disabled when value unchanged (prevents accidental no-op saves)
- Warning message in modal about incorrect hashed IDs causing wrong price lookups

All edge cases covered:
- Item with no hashed ID: shows 'Not set' placeholder
- Multiple rapid edits: each save works independently
- Modal open during item refresh: currentHashedId watch updates input
- Saved hashed ID used by refresh: useMarketRefresh.getHashedId() reads from merged data
