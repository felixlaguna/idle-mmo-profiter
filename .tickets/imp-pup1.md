---
id: imp-pup1
status: closed
deps: [imp-wr99]
links: []
created: 2026-03-01T02:04:12Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-xw1f
tags: [ui, layout]
---
# Fix Market table layout and Craftable sub-tab styling on both mobile and desktop

## Market table and Craftable sub-tab visual issues

### 6. Market table doesn't use card layout on mobile
- **Symptom**: MarketTable shows a 3-column table on 375px while all other tabs (Dungeons, Craftables, Resources, All Activities) use the card layout pattern.
- **Location**: `src/components/MarketTable.vue` — uses `class="market-items-table"` instead of `class="mobile-card-layout"`.
- **Root cause**: MarketTable was built separately and never adopted the shared `mobile-card-layout` CSS class system from `src/style.css` (lines 357-465).
- **Fix**:
  1. Add `mobile-card-layout` class to all `<table class="market-items-table">` elements (lines 995, 1146, 1295, 1461).
  2. Add `data-label` attributes to each `<td>` in MarketTable rows so the mobile card labels work (e.g., `data-label="Name"`, `data-label="Vendor Value"`, `data-label="Market Value"`).
  3. Ensure the "Exclude" checkbox column and "Actions" column adapt gracefully to the card layout.
  4. Test that the EditableValue component still works within the card layout cells.

### 7. Market table has massive wasted space on desktop (1440px)
- **Symptom**: Only 3 columns (Name, Vendor Value, Market Value) across 1440px looks sparse. In static mode, it's 3 columns; in non-static, it's 5 (with Exclude + Actions).
- **Location**: `src/components/MarketTable.vue` — `.market-items-table` and column classes.
- **Fix**:
  1. Constrain the market table to a `max-width: 900px` to avoid extreme stretching, OR
  2. Add useful columns: Item Category/Type, Price Delta (market vs vendor), Last Updated timestamp.
  3. The simplest approach: add `max-width: 900px` on `.market-items-table` or its container, with `margin: 0 auto` to center it.
  4. Make column widths explicit: Name 40%, Vendor 20%, Market 20%, Actions 20%.

### 8. Alchemy/Forging sub-tabs look lost on desktop
- **Symptom**: The Alchemy/Forging buttons in CraftableTable are tiny buttons floating in a full-width container, easy to miss.
- **Location**: `src/components/CraftableTable.vue` lines 186-201 — `.sub-tab-navigation` div with `.sub-tab-button` buttons.
- **Current styling**: `padding: 0.5rem 1rem`, `background-color: var(--bg-tertiary)`, in a flex container with `gap: 0.5rem`.
- **Fix**:
  1. Style sub-tabs more like the main tab bar — add a bottom border indicator for active state.
  2. Increase button padding to `0.625rem 1.5rem` on desktop.
  3. Add a left border or background highlight for the active sub-tab.
  4. Consider adding an icon (🧪 for Alchemy, ⚒️ for Forging) to make them more prominent.
  5. Set `.sub-tab-navigation { max-width: 400px }` or align it left with the table header to create visual connection.

**Files to modify**:
- `src/components/MarketTable.vue` (add mobile-card-layout class, data-label attrs, constrain desktop width)
- `src/components/CraftableTable.vue` (sub-tab-navigation styling)
- `src/style.css` (if any shared mobile-card-layout adjustments needed)

## Acceptance Criteria

- [ ] Market table uses card layout on mobile (375px) consistent with other tabs
- [ ] Each market card shows labeled fields (Name, Vendor Value, Market Value, etc.)
- [ ] Market table is not excessively wide on 1440px — either constrained or has more useful columns
- [ ] Alchemy/Forging sub-tabs are visually prominent on desktop with clear active state indicator
- [ ] Sub-tabs have icons or larger styling so they're not overlooked
- [ ] EditableValue still functions correctly in mobile card layout


## Notes

**2026-03-01T02:11:30Z**

Starting implementation - identified 4 market-items-table instances (lines 995, 1146, 1295, 1461) that need mobile-card-layout class and data-label attributes

**2026-03-01T02:13:47Z**

Implementation complete. All changes made:

Files modified:
- src/components/MarketTable.vue: Added mobile-card-layout class and data-label attributes to all 4 tables (Materials, Craftables, Resources, Recipes). Added max-width: 900px to constrain desktop table width and center it.
- src/components/CraftableTable.vue: Enhanced sub-tab buttons with icons (🧪 for Alchemy, ⚒️ for Forging), increased padding, added prominent active state with bottom border indicator, and constrained sub-tab container to max-width: 500px.

All tests passing: 353/353
Linter passed with no errors.
