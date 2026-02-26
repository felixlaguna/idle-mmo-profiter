---
id: imp-8fpp
status: closed
deps: [imp-e8hx]
links: []
created: 2026-02-26T19:27:50Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-odkj
---
# Phase 4: Responsive design and mobile support

Ensure the hashed ID button and modal work well on mobile and smaller screens.

## Changes to: /home/felix/idle-mmo-profiter/src/components/MarketTable.vue and HashedIdModal.vue

### Mobile Considerations:
The MarketTable does NOT currently use the mobile-card-layout class from style.css,
so the table layout is preserved on mobile. However, the added button may cause 
horizontal overflow on small screens.

### Responsive Adjustments:
1. col-actions on mobile: buttons should stack vertically or use icon-only mode
2. Modal should be full-width on mobile (max-width: 100% with padding)
3. Input field in modal should be full-width
4. Button tooltips work via title attribute (native, no custom tooltip needed)

### Style Changes (@media max-width: 768px):
- .col-actions: reduce padding, stack buttons
- .btn-hashed-id: may need smaller size on mobile (12x12 icon)
- .modal-content-small: adjust for mobile viewport
- Ensure modal overlay scrolls if content overflows

### Files to modify:
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue (scoped styles)
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue (scoped styles)

## Acceptance Criteria

- [ ] No horizontal overflow on mobile when actions column has 2 buttons
- [ ] Modal is usable on mobile screens (proper width, padding)
- [ ] Input field is finger-friendly size on touch devices
- [ ] Button icons render at appropriate size across breakpoints


## Notes

**2026-02-26T19:34:33Z**

Phase 4 complete - Responsive design implemented

Implementation details (already completed in Phase 1 & 2):

HashedIdModal responsive design (@media max-width: 768px):
- Modal overlay padding reduced to 1rem on mobile
- Modal content max-width: 100% (full-width with padding)
- Modal actions flex-direction: column (buttons stack vertically)
- Form input: font-size: 16px (prevents iOS zoom on focus)
- Form input: min-height: 44px (finger-friendly touch target)
- All buttons: width: 100% (full-width for easy tapping)

MarketTable responsive design (@media max-width: 768px):
- col-actions: flex-direction: column, gap reduced to 0.25rem
- col-actions: width: 80px (narrower on mobile but accommodates stacked buttons)
- btn-hashed-id and btn-refresh-item: width: 100% (fill column)
- Buttons stack vertically instead of side-by-side

No horizontal overflow:
- Table columns remain scrollable if needed (existing behavior)
- Actions column properly sized for mobile (80px with stacked buttons)
- No layout issues on small screens

All responsive requirements met.
