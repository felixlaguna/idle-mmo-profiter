---
id: imp-x8fu
status: closed
deps: [imp-wr99]
links: []
created: 2026-03-01T02:04:39Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xw1f
tags: [ui, polish]
---
# Fix orange border artifact, low-contrast default data text, and mobile chart labels

## Visual polish: header artifact, text contrast, chart readability

### 9. Orange border artifact at top of page when hero is scrolled
- **Symptom**: When the hero section is partially scrolled out of view, a thin orange strip appears at the top edge behind/above the sticky header.
- **Location**: `src/App.vue` — `.hero-section::before` pseudo-element (lines 629-643) creates a 4px-tall gradient bar at the top of the hero. The sticky header (`.app-header`, `z-index: 100`) should cover it, but the hero's orange border/shadow may bleed through.
- **Root cause**: The hero section has `border: 2px solid rgba(245, 158, 11, 0.3)` (line 619) and `box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2)` (line 623). When the hero scrolls under the sticky header, the top border and glow are visible through the header if the header doesn't have an opaque background.
- **Fix**:
  1. Ensure `.app-header` has a fully opaque `background-color: var(--bg-secondary)` (it does, #1a1f2e).
  2. Add `position: relative` on `.app-header` if not already present, to ensure it stacks above the hero.
  3. The `contain: layout style paint` on `.app-header` (line 550) should handle this, but check if it's being overridden.
  4. Most likely fix: add `box-shadow: 0 1px 0 0 var(--bg-secondary)` to `.app-header` to create an opaque bottom edge, or increase `z-index`.
  5. Alternative: remove the `::before` gradient bar from `.hero-section` entirely, or clip it: add `overflow: hidden` to a wrapper around the scrollable content below the header.

### 10. "Using default data" text has low contrast
- **Symptom**: The status text "Using default data" in the header is barely readable.
- **Location**: `src/App.vue` line 276 — `<span class="last-update">{{ lastUpdateText }}</span>`.
- **Current styling**: `.last-update` uses `color: var(--text-secondary)` (#9ca3af) at `font-size: 0.875rem` (desktop) or `0.75rem` (mobile). On the header background `var(--bg-secondary)` (#1a1f2e), the contrast ratio of #9ca3af on #1a1f2e is approximately 5.2:1 which passes WCAG AA for normal text, but at 0.75rem on mobile it feels dim.
- **Fix**:
  1. Change the default-data state to use a slightly brighter color: `color: var(--text-primary)` (#e5e7eb) or a new muted-but-visible color like `#b0b8c4`.
  2. Add a subtle icon (info circle) next to the text to draw attention.
  3. On mobile, increase font-size from `0.75rem` to `0.8125rem`.
  4. Consider adding `opacity: 1` explicitly (currently no opacity set, but global styles may affect it).

### 11. Mobile chart labels too small on 375px
- **Symptom**: Chart axis labels and legends are hard to read on mobile.
- **Location**: Chart components in `src/components/charts/`:
  - `ProfitBarChart.vue`
  - `DungeonChart.vue`
  - `RevenueBreakdown.vue`
  - `PriceHistoryChart.vue`
- **Fix**:
  1. In each chart component, check for responsive font size configuration in the chart options.
  2. Increase mobile chart font sizes: axis labels to at least 10px (from ~8px default), legend labels to at least 11px.
  3. If using Chart.js, update `options.scales.x.ticks.font.size` and `options.scales.y.ticks.font.size` for mobile breakpoints.
  4. Consider rotating x-axis labels 45 degrees on mobile to prevent overlap.
  5. Increase legend padding and item spacing on mobile.

**Files to modify**:
- `src/App.vue` (header z-index/shadow, last-update text color + size)
- `src/components/charts/ProfitBarChart.vue` (mobile font sizes)
- `src/components/charts/DungeonChart.vue` (mobile font sizes)
- `src/components/charts/RevenueBreakdown.vue` (mobile font sizes)
- `src/components/charts/PriceHistoryChart.vue` (mobile font sizes)

## Acceptance Criteria

- [ ] No orange strip visible at header when hero section scrolls behind it
- [ ] "Using default data" text is clearly readable on both mobile and desktop
- [ ] Chart axis labels are at least 10px on mobile (375px)
- [ ] Chart legend text is at least 11px on mobile
- [ ] Chart labels do not overlap on mobile viewport
- [ ] All text passes WCAG AA contrast ratio (4.5:1 for normal text)


## Notes

**2026-03-01T02:11:04Z**

Starting implementation:
1. Fixing orange border artifact in App.vue header
2. Improving 'Using default data' text contrast
3. Increasing mobile chart label sizes in all chart components

**2026-03-01T02:12:51Z**

Implementation complete. All fixes applied:

Files modified:
- /home/felix/idle-mmo-profiter/src/App.vue
  - Added box-shadow to .app-header to fully cover hero section when scrolling (fix orange artifact)
  - Changed .last-update color from var(--text-secondary) to #b0b8c4 for better contrast
  - Increased mobile .last-update font-size from 0.75rem to 0.8125rem

- /home/felix/idle-mmo-profiter/src/components/charts/ProfitBarChart.vue
  - Added mobile detection (window.innerWidth <= 767)
  - Increased mobile font sizes: x-axis ticks to 10px, y-axis ticks to 10px

- /home/felix/idle-mmo-profiter/src/components/charts/DungeonChart.vue
  - Added mobile detection (window.innerWidth <= 767)
  - Increased mobile font sizes: x-axis ticks to 10px, y-axis ticks to 10px

- /home/felix/idle-mmo-profiter/src/components/charts/RevenueBreakdown.vue
  - Added mobile detection (window.innerWidth <= 767)
  - Increased mobile legend font size to 11px and padding to 12px

- /home/felix/idle-mmo-profiter/src/components/charts/PriceHistoryChart.vue
  - Added mobile detection (window.innerWidth <= 767)
  - Increased mobile legend font size to 11px, x-axis ticks to 10px, y-axis ticks to 10px

All tests passing (353/353)
Linting passed with no errors
