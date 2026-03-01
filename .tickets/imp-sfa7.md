---
id: imp-sfa7
status: closed
deps: []
links: []
created: 2026-03-01T02:03:48Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-xw1f
tags: [ui, mobile]
---
# Fix mobile navigation: tab bar overflow, filter button clipping, and scroll indicators

## Mobile navigation issues on iPhone SE (375px)

### 4. "Resources" filter button cut off on 375px
- **Symptom**: In the "All Activities" tab, only "Dungeons" and "Craftables" filter buttons are visible. The "Resources" button is clipped with no scroll indicator.
- **Location**: `src/components/ProfitRankingTable.vue` lines 139-168 — `.filter-controls` div containing 3 filter buttons.
- **Root cause**: The buttons have `padding: 0.75rem 1.25rem` and `min-height: 48px` on mobile, plus the "Show:" label takes space. At 375px, there is not enough horizontal room.
- **Fix**:
  1. On mobile (<768px), reduce the filter button padding to `0.5rem 0.75rem` and font size to `0.8125rem`.
  2. Remove the "Show:" label on mobile (hide it with `display: none` at <768px) to reclaim ~40px.
  3. Make the `.filter-controls` use `flex-wrap: wrap` or shrink buttons to fit in a single row.
  4. All 3 buttons MUST be visible without scrolling on 375px.

### 5. Tab bar only shows 3 of 6 tabs on mobile
- **Symptom**: Only "All Activities", "Dungeons", "Craftables" visible. Resources/Market/Charts are hidden off-screen with no visual scroll cue.
- **Location**: `src/App.vue` lines 342-412 — `.tab-navigation` uses `overflow-x: auto` with a mask fade effect.
- **Root cause**: The mask fade at 90% (`mask-image: linear-gradient(90deg, black 90%, transparent)`) is too subtle. Users don't know to scroll.
- **Fix**:
  1. Add a visible scroll indicator — a small right-arrow chevron or "..." indicator at the right edge when tabs overflow.
  2. Reduce tab button padding on mobile from `0.875rem 1.25rem` to `0.625rem 0.75rem` so more tabs fit.
  3. Reduce tab font size on mobile to `0.8125rem`.
  4. Consider using shorter tab labels on mobile: "All", "Dungeons", "Craft", "Resources", "Market", "Charts".
  5. After reducing padding, ideally 4-5 tabs should be visible, making it more obvious there are more to scroll.
  6. Add `scroll-padding-inline: 0.5rem` for better scroll snap behavior.

### 3. Settings button not discoverable
- **Symptom**: Playwright could not locate a settings button.
- **Location**: `src/App.vue` line 277-302 — the button exists with `aria-label="Open settings"` and `class="btn-settings"`.
- **Root cause**: The button has `v-if="!isStaticMode"` (line 279). If the app is running in static mode (VITE_STATIC_MODE=true), the button is completely removed from the DOM. If Playwright was testing the static build, it would not find it.
- **Fix**:
  1. Confirm whether the Playwright test was running against the static build. If so, this is expected behavior — document it.
  2. If the settings button SHOULD appear in static mode (even if disabled), change `v-if="!isStaticMode"` to always render but disable: `<button :disabled="isStaticMode" class="btn-settings" ...>`.
  3. ALTERNATIVELY: If settings legitimately should not exist in static mode, add a small info icon or "Static Mode" label in the header so the space doesn't look empty.

**Files to modify**:
- `src/components/ProfitRankingTable.vue` (filter-controls mobile styles)
- `src/App.vue` (tab-navigation mobile styles, settings button logic)

## Acceptance Criteria

- [ ] All 3 filter buttons (Dungeons, Craftables, Resources) visible without scrolling at 375px
- [ ] At least 4 tabs visible on mobile without scrolling
- [ ] Remaining off-screen tabs have a visual scroll indicator (fade, chevron, or similar)
- [ ] Tab buttons are still easily tappable (min 44px touch target)
- [ ] Settings button situation documented or resolved for static mode
- [ ] No horizontal overflow causing page-level scroll


## Notes

**2026-03-01T02:06:24Z**

Analysis complete. Identified 3 issues:

1. Settings button: Exists but hidden when isStaticMode=true (v-if on line 278)
2. Filter buttons: At 375px the 3rd button gets cut off - need to reduce padding and remove 'Show:' label
3. Tab navigation: Only shows 3 tabs at 375px - need smaller padding/font-size and scroll indicator

Starting implementation...

**2026-03-01T02:08:05Z**

Implementation complete:

1. Filter buttons (ProfitRankingTable.vue):
   - Changed from calc(33.333% - gap) to flex: 1 1 0 for equal sizing
   - All 3 buttons now fit at 375px with responsive padding
   - Reduced padding at <480px to 0.375rem 0.25rem

2. Tab navigation (App.vue):
   - Reduced mobile padding to 0.625rem 0.75rem and font-size to 0.8125rem
   - Added shorter tab labels on mobile ('All' vs 'All Activities', 'Craft' vs 'Craftables')
   - Added visible scroll indicator (right chevron with gradient)
   - Added scroll-padding-inline for better scroll behavior

3. Settings button (a11y.test.ts):
   - Updated test to handle static mode where button is intentionally hidden
   - No code changes needed - behavior is correct as designed

Running lint and tests...
