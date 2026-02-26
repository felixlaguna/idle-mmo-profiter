---
id: imp-in9k
status: closed
deps: [imp-yunl]
links: []
created: 2026-02-26T11:53:43Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-x23x
---
# Phase 3: Add refresh buttons and loading states to MarketTable UI

## Goal
Add per-item refresh buttons and a top-level 'Refresh All' button to the MarketTable component, with proper loading states, progress indicators, and error feedback.

## Changes Required

### 1. Update MarketTable.vue (/home/felix/idle-mmo-profiter/src/components/MarketTable.vue)

#### Top-level 'Refresh All' button
- Add a 'Refresh All Prices' button in the search-bar-container (next to 'Reset All')
- Button should be disabled when: API key not configured, or refresh already in progress
- While refreshing, show: progress bar, current item name, X/Y counter, estimated time remaining
- Add a 'Cancel' button that appears during refresh to abort the operation
- After completion, show a toast notification with results (X updated, Y failed, Z skipped)
- Style: accent-colored button to distinguish from 'Reset All'

#### Per-item refresh button
- Add a small refresh icon button in each item row (new column or inline with market value)
- Button should be disabled when: API key not configured, hashedId missing (show tooltip explaining why), or that specific item is currently refreshing
- While refreshing that item, show a small loading spinner replacing the button
- On success, briefly highlight the row (flash green or similar visual feedback)
- On error, show error via toast notification
- The button should be compact so it doesn't disrupt the existing table layout

#### New column: Vendor Value display
- Materials, Potions, Recipes sections currently show 'N/A' for vendor value
- Now display the actual vendorValue from the data (if available, else still 'N/A')
- Resources already display vendorValue correctly

#### API key guard
- If API key is not configured, show a subtle message near the refresh buttons: 'Set API key in Settings to enable price refresh'
- Disable all refresh buttons with a tooltip

#### Progress indicator for Refresh All
- Show above or below the search bar
- Include: progress bar (current/total), current item name, elapsed time, estimated remaining time
- Dismissable after completion

### 2. Update App.vue (/home/felix/idle-mmo-profiter/src/App.vue)
- Import and wire useMarketRefresh (or pass relevant state to MarketTable)
- Update lastUpdateTime when refresh completes (currently a placeholder ref)

### 3. Visual design
- Refresh button: small circular button with a refresh/sync icon (SVG, not emoji)
- Loading state: CSS spinner animation
- Progress bar: styled bar with percentage
- Success flash: brief background color change on updated rows
- All styles should follow the existing dark theme CSS variables

## Notes
- MarketTable.vue is already ~690 lines with styles. The refresh logic should be in the composable (Phase 2); MarketTable only handles display.
- With 345 recipes collapsed by default, per-item refresh buttons there should not cause performance issues since the section is collapsed
- Mobile responsive: on small screens, the refresh button should be accessible but compact
- Toast notifications for results use the existing useToast composable

## Acceptance Criteria

- [ ] 'Refresh All Prices' button visible in MarketTable search bar area
- [ ] 'Refresh All' shows progress bar with item count and current item name
- [ ] 'Refresh All' can be cancelled mid-operation
- [ ] Per-item refresh button shown in each row
- [ ] Per-item button shows loading spinner while refreshing
- [ ] Per-item button disabled when API key not configured or hashedId missing
- [ ] Vendor values display correctly for all item types (not just resources)
- [ ] Toast notifications show results after refresh completes
- [ ] Disabled state with tooltip when API key not set
- [ ] Mobile responsive layout preserved
- [ ] Success feedback (flash/highlight) on updated rows
- [ ] lastUpdateTime in App.vue updated after refresh


**2026-02-26T12:00:28Z**

## Iteration 1 Update: Exclusion Toggle UI

### Per-item exclusion toggle in each table row

1. Add a checkbox or toggle icon as the FIRST column in each item row
   - Unchecked (default) = item IS included in refresh
   - Checked = item is EXCLUDED from refresh
   - Use a small checkbox input or a toggle-style icon button (eye/eye-slash pattern works well)
   - Recommended: simple checkbox with a 'skip' or 'exclude' tooltip

2. Visual treatment for excluded items:
   - Row gets a 'excluded' CSS class
   - Row opacity reduced (e.g., opacity: 0.5) to visually de-emphasize
   - The per-item refresh button should still be visible and functional (not disabled) -- the user can still manually refresh an excluded item
   - A small 'excluded' badge or strikethrough on the row name is optional but helpful

3. Column header for the checkbox column:
   - Header should be a 'Select All / Deselect All' toggle for that section
   - Clicking the header checkbox toggles ALL items in that category
   - Three states: all included (unchecked), all excluded (checked), mixed (indeterminate)
   - This maps to setAllRefreshExcluded(category, boolean) from the data provider

### Section header exclusion count
- Next to the existing 'X overridden' badge, add an 'X excluded' badge
- Example: 'Materials -- 11 items -- 2 overridden -- 5 excluded'
- Only show the badge when count > 0

### Refresh All button area
- Before the progress bar, show the exclusion summary:
  'Will refresh 24 of 369 items (345 excluded) -- est. ~2 min'
- This uses getRefreshEstimate() from the composable (Phase 2)
- Update this count reactively as the user toggles items

### Progress indicator updates
- During Refresh All, show: 'Refreshing 15/24 included items (345 excluded) -- Coal -- ~1 min remaining'
- Skipped items should advance the counter quickly (no delay, just skip)
- The progress bar should be based on totalIncluded, not total

### Mobile considerations
- On mobile (cards layout), the exclusion toggle should be a small icon in the card header area
- Do not take up a full row for the checkbox on mobile

### Additional acceptance criteria:
- [ ] Per-item checkbox toggles refreshExcluded via setRefreshExcluded
- [ ] Excluded rows visually dimmed (reduced opacity or similar)
- [ ] Section header checkbox toggles all items in that category
- [ ] Section header checkbox shows indeterminate state when mixed
- [ ] 'X excluded' badge shown in section headers when count > 0
- [ ] Refresh All area shows exclusion summary with estimated time
- [ ] Progress indicator based on included items only
- [ ] Per-item refresh button still works on excluded items
- [ ] Mobile layout handles checkbox gracefully
- [ ] Exclusion state persists across page reloads (via localStorage)

**2026-02-26T12:11:02Z**

Reading key files to understand architecture. Files read: MarketTable.vue, useMarketRefresh.ts, useDataProvider.ts, types/index.ts, App.vue

**2026-02-26T12:11:27Z**

Architecture understood:
- useMarketRefresh provides: refreshItemPrice, refreshAllItems, cancelRefresh, getRefreshEstimate
- useDataProvider provides: setRefreshExcluded, isRefreshExcluded, setAllRefreshExcluded, getExclusionStats
- storageManager.getSettings() returns { apiKey: string | null }
- Materials, Potions, Recipes have vendorValue field
- Resources already have vendorValue field

Starting implementation of MarketTable UI changes.

**2026-02-26T12:15:21Z**

MarketTable.vue updated with all UI features:
- Refresh All Prices button with progress bar and estimate modal
- Per-item refresh buttons in each row
- Exclusion checkboxes (per-item and section-level)
- Visual dimming for excluded rows
- vendorValue display for all item types
- API key guard on all refresh buttons
- Toast notifications for results
- Full responsive mobile support

Testing the implementation now.

**2026-02-26T12:16:34Z**

Implementation complete and tested:

Build: ✓ Successful (no TypeScript errors)
Tests: ✓ All new tests passing (17/17 in useMarketRefresh.test.ts)
Existing tests: ✓ No new regressions (1 pre-existing failure in ApiKeyInput.test.ts unrelated to this work)

All UI features implemented:
1. Refresh All Prices button with estimate modal showing item count and estimated time
2. Progress bar during bulk refresh with current item name and counts
3. Cancel button to abort mid-refresh
4. Per-item refresh buttons in each table row with loading spinners
5. Exclusion checkboxes (per-item and section-level three-state)
6. Excluded rows visually dimmed (opacity: 0.5)
7. vendorValue displayed for all item types (was 'N/A' before)
8. API key guard on all refresh buttons with tooltips
9. Toast notifications for success/error/warning on completion
10. Fully responsive mobile layout

Ready for manual testing and review.
