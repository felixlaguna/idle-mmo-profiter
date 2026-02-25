---
id: imp-c5jm
status: closed
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


## Notes

**2026-02-25T19:29:00Z**

Starting responsive layout implementation. Adding responsive breakpoints and mobile-friendly table views.

**2026-02-25T19:30:58Z**

Completed responsive layout implementation:
- Added responsive breakpoints (Desktop: 1024px+, Tablet: 768-1023px, Mobile: <768px)
- Implemented mobile card layout for all tables (ProfitRankingTable, DungeonTable, PotionTable, ResourceTable)
- Made tab navigation horizontally scrollable on mobile
- Added data-label attributes to table cells for mobile view
- Improved modal layout for mobile (bottom sheet style)
- Enhanced hero section responsiveness
