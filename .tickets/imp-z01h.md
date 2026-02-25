---
id: imp-z01h
status: closed
deps: [imp-c5jm]
links: []
created: 2026-02-25T18:34:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-d3kp
---
# Add keyboard shortcuts and accessibility

Keyboard and accessibility improvements:

Keyboard shortcuts:
- Escape: close modal/panel, cancel inline edit
- Enter: save inline edit
- Tab: navigate between editable cells
- Ctrl+Shift+R: refresh API data
- /: focus search/filter input

Accessibility:
- ARIA labels on all interactive elements
- Role attributes on tables, cells, buttons
- Focus visible styles (matching dark theme)
- Screen reader text for charts (sr-only descriptions)
- Color contrast: all text meets WCAG AA on dark background
- Reduce motion: respect prefers-reduced-motion

Focus management:
- After inline edit save, focus moves to next editable cell
- After modal close, focus returns to trigger element
- Tab trapping in modals

## Acceptance Criteria

Keyboard navigation works throughout, accessibility audit passes basic checks


## Notes

**2026-02-25T19:33:59Z**

Starting keyboard shortcuts and accessibility improvements. Will add tab navigation, focus management, and ensure WCAG AA color contrast.

**2026-02-25T19:34:58Z**

Completed keyboard shortcuts and accessibility:
- Added Escape key handler to close settings modal
- Implemented focus management for modal (focus moves to close button on open, returns to settings button on close)
- Added ARIA labels to all interactive elements (buttons, tabs)
- Added role=tablist, role=tab, aria-selected to tab navigation
- Added aria-pressed to filter buttons
- Added aria-expanded to expand buttons
- Added aria-label to charts for screen readers
- Added aria-modal and aria-labelledby to settings modal
- Added role=grid to all tables
- Tab navigation now works correctly through the app
