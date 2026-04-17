---
id: imp-qyi2
status: open
deps: [imp-g8f1]
links: []
created: 2026-03-09T15:46:02Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ib1d
---
# Phase 3: Visual QA and polish

## Changes

Run visual QA to verify the tabs look correct across viewports.

### Steps
1. Start the app via Docker if not already running
2. Run Playwright visual QA screenshots at 375px, 393px, and 1440px viewports
3. Open the item uses popover on an item that has uses across Alchemy, Forging, and Other categories
4. Screenshot each tab state
5. Verify:
   - Tab bar alignment and spacing
   - Active tab indicator visibility
   - Content scrolling works within tabbed view
   - Mobile bottom-sheet layout with tabs
   - Tab counts are accurate
   - Heatmap colors render correctly per tab
6. Fix any visual issues found

### Known items to test with
- Items used in both alchemy and forging recipes (materials like ores, herbs)
- Items that only appear in one category
- Items with many uses (to test scrolling)

## Acceptance Criteria

- Visual QA passes at all 3 viewports
- No layout overflow or clipping issues
- Tab bar is visually consistent with app design system
- Mobile bottom-sheet with tabs works correctly

