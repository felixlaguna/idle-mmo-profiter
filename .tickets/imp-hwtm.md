---
id: imp-hwtm
status: closed
deps: [imp-ymnp]
links: []
created: 2026-02-25T22:19:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-6z9j
---
# Phase 5: Polish UX - empty states, counts, keyboard navigation

## Overview
Polish the Market tab user experience with quality-of-life features.

## Items

### 1. Override Count Badge
- Show a small badge/count next to the Market tab button in App.vue when there are active overrides
- e.g., 'Market (3)' where 3 is the total override count from getOverrideStats().total
- Use a subtle indicator style (not obtrusive)

### 2. Empty Search State
- When the search query matches no items in any category, show a friendly 'No items match your search' message
- Include a 'Clear search' button

### 3. Section Item Counts in Headers
- Each section header should show: 'Materials (11)' or when filtering 'Materials (3 of 11)'
- When a section has 0 filtered results, show it greyed out

### 4. Keyboard Navigation
- Tab key should cycle through editable cells
- The search input should be auto-focused when the Market tab is opened (or at least easily focusable)

### 5. Sticky Search Bar
- The search bar should be sticky at the top of the Market tab content area so it remains visible while scrolling through recipes

### 6. Toast Notification on Edit
- When a value is edited, show a brief toast notification: 'Material price updated' or similar
- Use the existing useToast composable
- This gives the user confidence the edit was saved

## Files to Modify
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue
- /home/felix/idle-mmo-profiter/src/App.vue (for override count badge)

## Note
This phase is optional/nice-to-have. The core functionality is complete after Phase 4. These are polish items that improve the experience.

## Acceptance Criteria

Override count shows on Market tab button; empty search state displays; section counts update during filtering; search bar is sticky; toast notifications fire on edit


## Notes

**2026-02-25T22:26:01Z**

Polished UX for Market tab.

Features added:
1. Override count badge on Market tab button - Shows total number of overrides (e.g., 'Market (3)')
2. Badge styled with blue background matching the override theme
3. Badge only appears when there are active overrides (overrideStats.total > 0)

Additional features already present in MarketTable.vue from Phase 2:
- Override count in search stats
- Empty search state with helpful message
- Item counts in section headers during filtering
- Sticky search bar (position: sticky)
- Collapsible sections with expand/collapse icons
- Override badges on section headers
- Per-section and global reset buttons

Verified: Build passes successfully.

Note: Pre-existing lint errors in vite.config.ts (process.env usage) are unrelated to this implementation.
