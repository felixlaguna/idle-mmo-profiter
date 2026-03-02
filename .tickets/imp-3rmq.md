---
id: imp-3rmq
status: closed
deps: [imp-8q9d]
links: []
created: 2026-03-02T08:13:43Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ivrt
---
# Display vendor/market indicator in hero compact bar for resource activities

## What
When the best action displayed in the hero bar is a resource, show a small badge/label indicating whether the profit is based on vendor or market price. This should only appear for resource-type activities (not dungeons or craftables).

## Files to modify
- /home/felix/idle-mmo-profiter/src/App.vue (template + styles)

## Implementation details
In the hero-compact section (lines 307-314 of App.vue), add a conditional sale method indicator AFTER the activity type badge and BEFORE the profit value:

```html
<div v-if="bestAction" class="hero-compact" aria-label="Best action summary">
  <span class="hero-compact-label">Best:</span>
  <span class="hero-compact-name">{{ bestAction.name }}</span>
  <span class="hero-compact-badge" :class="getTypeBadgeClass(bestAction.activityType)">
    {{ bestAction.activityType }}
  </span>
  <!-- NEW: Sale method indicator for resources -->
  <span
    v-if="bestAction.saleMethod"
    class="hero-compact-method"
    :class="bestAction.saleMethod === 'vendor' ? 'method-vendor' : 'method-market'"
  >
    {{ bestAction.saleMethod === 'vendor' ? 'Vendor' : 'Market' }}
  </span>
  <span class="hero-compact-profit">{{ formatNumber(bestAction.profitPerHour) }} gold/hr</span>
</div>
```

## Styling
Reuse the existing method badge pattern from ResourceTable.vue (lines 335-354):
- Vendor: gold/amber tones (rgba(245, 158, 11, 0.2) bg, #fbbf24 text)
- Market: blue tones (rgba(59, 130, 246, 0.2) bg, #60a5fa text)
- Size slightly smaller than the activity type badge to maintain visual hierarchy
- Must work in the mobile flex-wrap layout (hero already wraps at 767px)

## Mobile considerations
- The hero-compact already uses flex-wrap on mobile (line 1009)
- The new badge should use flex-shrink: 0 to prevent squishing
- Keep the badge compact (short text, small padding) to avoid adding a full extra row on narrow screens

## Acceptance Criteria

- When best action is a resource, a 'Vendor' or 'Market' badge appears in the hero bar
- Badge uses gold/amber for vendor, blue for market (matching ResourceTable conventions)
- Badge does NOT appear for dungeon or craftable best actions
- Layout works on all viewports: desktop (1440px), mobile (393px), tiny mobile (375px)
- Badge has appropriate aria attributes for accessibility

