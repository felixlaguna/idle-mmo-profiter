---
id: imp-h00u
status: closed
deps: [imp-osdd]
links: []
created: 2026-03-09T08:20:24Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-acs4
---
# Phase 4: Visual Indicator + Discoverability

Add visual cues to make the right-click feature discoverable, since right-click menus are not intuitive on web.

## Files to Modify/Create

### 1. Add a subtle cursor hint
- In `/home/felix/idle-mmo-profiter/src/style.css`, add a class for items with uses:
  ```css
  .has-item-uses {
    cursor: context-menu;  /* Shows the context menu cursor on hover */
    text-decoration: underline dotted;
    text-underline-offset: 2px;
    text-decoration-color: rgba(96, 165, 250, 0.3);
  }
  .has-item-uses:hover {
    text-decoration-color: rgba(96, 165, 250, 0.6);
  }
  ```

### 2. Add a small 'uses' count badge (optional, non-intrusive)
- Next to item names that have uses, show a tiny superscript count like:
  `Trout ^3` where 3 = number of demand sources
- Use the same subtle badge style as the existing volume badges
- Only show if the item has 2+ uses (single-use items are not interesting)

### 3. First-time tooltip/hint
- On first right-click (or first visit), show a brief toast notification:
  'Tip: Right-click any item name to see its uses and demand sources'
- Store the 'hint shown' flag in localStorage so it only appears once
- Use the existing `useToast` composable for this

### 4. Mobile discoverability
- On mobile where right-click isn't natural, add a small info icon button next to item names
- The button should be a tiny 'i' or magnifying glass icon that triggers the popover on tap
- Use the same opacity-on-hover pattern as the existing delete buttons

## Design Considerations
- All visual indicators must follow the existing design system
- The dotted underline should not be visually heavy -- it must be subtle
- The uses count badge should match the existing volume-badge styling pattern
- Keep mobile touch targets at minimum 44x44px per existing accessibility standards

## Acceptance Criteria

- Items with uses show dotted underline on hover (cursor: context-menu)
- First-time hint toast appears once and is remembered
- Mobile shows a small tap target for opening item uses
- Visual indicators follow existing design system tokens
- No visual regression on existing item name display

