---
id: imp-44bm
status: closed
deps: [imp-o6do]
links: []
created: 2026-03-09T08:19:48Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-acs4
---
# Phase 2: ItemUsesPopover Component

Create the UI component that displays item uses in a popover/context menu.

## Files to Create
- `/home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue`

## Design Requirements

### Trigger Mechanism
- Right-click (contextmenu event) on item names across all tables
- Long-press on mobile (touchstart/touchend with 500ms threshold)
- Prevent browser default context menu when our popover opens
- Close on click outside, Escape key, or scroll

### Popover Positioning
- Position near the clicked element using fixed positioning
- Auto-adjust to stay within viewport (flip above if near bottom, flip left if near right edge)
- On mobile (<768px), display as a bottom sheet (slide up from bottom, full-width)

### Content Layout
The popover shows all uses grouped by category:

```
[Item Name]                              [X close]
----------------------------------------------
CRAFTING (3 recipes)
  Radiant Crest (forging)    500x   +1,234 gold/hr
  Minor Health Potion (alch)  10x     +567 gold/hr
  ...

RESOURCE PROCESSING (1 recipe)
  Cooked Trout (cooking)      1x     +890 gold/hr

DUNGEON DROPS (2 dungeons)
  Millstone Mines              5.0%    +345 gold/hr
  Shadow Caverns               3.2%    +123 gold/hr

GATHERING
  Fishing (14.3s)                      +456 gold/hr

No uses found? Show: 'No demand sources found for this item.'
```

### Styling
- Use existing design system tokens (--surface-*, --bg-*, --text-*, --border-color)
- Category headers use type color scheme (craftable green, dungeon purple, resource blue)
- Profit/hr column uses heatmap composable for color
- Compact rows, max-height with scroll for many entries
- Smooth open/close animations matching existing modal patterns
- z-index above tables but below modals (z-index: 500)

### Accessibility
- role='dialog' with aria-label
- Focus trap when open
- Escape to close
- Screen reader announcement of item name and use count

### Props
```typescript
interface Props {
  itemName: string
  anchorRect: DOMRect | null  // Position anchor
  visible: boolean
}
```

### Events
- `@close` - emitted when popover should close

## Acceptance Criteria

- Popover renders with correct content from useItemUses
- Desktop: right-click opens popover positioned near click target
- Mobile: bottom sheet layout on screens <768px
- Auto-repositions to stay in viewport
- Closes on Escape, click outside, scroll
- Uses design system tokens consistently
- Smooth open/close animations
- Accessible: role=dialog, aria-label, keyboard navigation


## Notes

**2026-03-09T08:28:48Z**

Created ItemUsesPopover.vue component:
- Desktop: positioned popover near clicked element
- Mobile: bottom sheet layout
- Groups uses by category (crafting, resource processing, dungeons, gathering, produces)
- Shows profit/hr with heatmap coloring
- Auto-repositions to stay in viewport
- Closes on Escape, click outside, scroll
- Uses Teleport for proper z-index stacking
- Accessible with role=dialog and aria-label
Build succeeds.
