---
id: imp-td12
status: closed
deps: [imp-hag6]
links: []
created: 2026-03-10T09:44:49Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mcbi
---
# Phase 4: Create MinSalesThreshold UI component and add to ProfitRankingTable

## Overview
Create a compact UI control for the min sales/week threshold and add it to the ProfitRankingTable filter controls area. The UX should be similar to the existing LowConfidenceToggle but with an editable numeric input instead of a checkbox.

## Files to Create

### /home/felix/idle-mmo-profiter/src/components/MinSalesThreshold.vue
- Props: `modelValue: number` (the current threshold) and `filteredCount: number` (how many items are being filtered out)
- Emits: `update:modelValue`
- Layout: Inline control with label, compact number input, and count of filtered items
- Desktop: `Min sales/wk: [__10__] (5 hidden)`
- Mobile: `Min sales: [__10__] (5)`
- Styling should match the existing LowConfidenceToggle aesthetic:
  - Same font sizes, colors, gaps
  - Input styled to match the app's dark theme
  - Use `--text-secondary`, `--border-color`, `--bg-tertiary` tokens
  - Input width: ~4rem (enough for 3-4 digits)
  - Remove number input spin arrows (match EditableValue.vue pattern)
- Input behavior: debounced or on-blur/enter commit (not on every keystroke)
- Validation: min 0, integer only
- Show/hide: Only visible when count > 0 OR when threshold > 0

## Files to Modify

### /home/felix/idle-mmo-profiter/src/components/ProfitRankingTable.vue
- Import `MinSalesThreshold` component
- Import `useMinSalesFilter` (or get it from `useActivityFilters` return)
- Add the MinSalesThreshold control to the filter-controls bar, after the activity type filter buttons and before the pagination info
- Compute `filteredByMinSalesCount`: count of activities that would be excluded by the threshold
- Wire up v-model to the minSalesPerWeek from useActivityFilters

## Styling Guidelines
- The control should sit inline with the existing filter buttons
- On mobile, it should wrap gracefully (the filter-controls already uses flex-wrap)
- Match the muted, secondary-text aesthetic of the LowConfidenceToggle
- The number input should be compact (not a full-width input)

## Template Structure (approximate)
```html
<div class="min-sales-threshold">
  <label class="threshold-label">
    <span class="label-full">Min sales/wk:</span>
    <span class="label-short">Min:</span>
    <input type="number" min="0" step="1" class="threshold-input" />
    <span v-if="filteredCount > 0" class="threshold-count">({{ filteredCount }})</span>
  </label>
</div>
```

## Acceptance Criteria

- MinSalesThreshold component renders inline in the filter bar
- Number input allows editing the threshold (default 10)
- Shows count of filtered items
- Responsive: shorter label on mobile
- Styling consistent with existing filter controls
- Threshold changes correctly filter the ranking table
- No flickering or excessive re-renders on input


## Notes

**2026-03-10T09:54:01Z**

Created MinSalesThreshold.vue UI component:
- Numeric input styled to match LowConfidenceToggle pattern
- No spin arrows, dark theme
- Shows full/short labels at different viewports
- Integrated into ProfitRankingTable after activity type buttons
- v-model binding to minSalesThreshold from useMinSalesFilter
All tests passing (50/50)
