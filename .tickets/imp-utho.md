---
id: imp-utho
status: closed
deps: []
links: []
created: 2026-02-27T11:42:07Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-kb81
---
# Phase 5a: Add 'Refresh Item Data' button to HashedIdModal component

Add a 'Refresh Item Data' button inside the HashedIdModal.vue component. This button allows users to re-fetch item details (recipe uses, producesItemName, vendor price) from the game API for the item currently shown in the modal.

## What to build

1. Add a new 'refresh' event emit to HashedIdModal.vue
2. Add a 'Refresh Item Data' button in the modal body, visually separated from the hashed ID editing area (below the form-group, above the modal-actions)
3. The button should:
   - Be disabled when no hashedId is set (nothing to query)
   - Show a loading spinner while the refresh is in progress
   - Accept a 'refreshing' prop from the parent to control loading state
   - Emit a 'refresh' event when clicked (parent handles the actual API call)

## Files to modify
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue

## Implementation details

Props to add:
  refreshing: boolean (default false) -- controls spinner state

Emits to add:
  refresh: [] -- emitted when user clicks 'Refresh Item Data'

Button placement: Between the form-group div and the modal-actions div. Use a horizontal rule or visual separator.

Button styling: Follow the existing btn-save pattern but with a distinct color (use --accent-secondary or a blue/info color). Include a refresh SVG icon matching the existing refresh icon used in MarketTable.vue (the circular arrow icon already used for per-item refresh).

Disabled state: When \!hasCurrentHashedId (no hashed ID set) or when refreshing prop is true.

## Acceptance Criteria

HashedIdModal has a 'Refresh Item Data' button that emits a 'refresh' event. Button is disabled when no hashedId is set or when refreshing. Shows spinner during refresh.


## Notes

**2026-02-27T11:44:56Z**

Implementation complete. Added:
- refreshing prop (boolean, default false) to control loading state
- refresh event emit
- Refresh Item Data button between form-group and modal-actions
- Button is disabled when no hashedId or when refreshing
- Shows spinner during refresh
- Styled with blue accent color matching the design

Files modified:
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue
