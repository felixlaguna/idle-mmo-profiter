---
id: imp-c5jm
status: open
deps: []
links: []
created: 2026-02-25T18:34:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-d3kp
---
# Implement responsive layout and mobile table views

Make all tables and layouts responsive:

Breakpoints:
- Desktop (>1024px): full tables, side-by-side charts
- Tablet (768-1024px): narrower tables, stacked charts
- Mobile (<768px): card layout replacing tables, single column

For mobile:
- Tables convert to card/list views:
  - Each row becomes a card showing: name, type badge, profit/h (large), expandable details
  - Cards sorted by profit/h
- Charts stack vertically, full width
- Settings panel becomes full-screen modal
- Navigation becomes hamburger menu or bottom tab bar
- MF settings panel collapses to a single row with edit button

Test on: Chrome mobile, Safari iOS, Firefox mobile

## Acceptance Criteria

App is usable on mobile with card layouts, no horizontal scrolling required

