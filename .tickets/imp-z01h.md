---
id: imp-z01h
status: open
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

