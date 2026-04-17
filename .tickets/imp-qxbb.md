---
id: imp-qxbb
status: closed
deps: [imp-zzp2]
links: []
created: 2026-03-04T17:38:48Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mshp
---
# Phase 3: DungeonSelector component - completed dungeon picker

## Goal
Create the DungeonSelector.vue component that lets users select which dungeons they have completed. Each completed dungeon adds +1 to dungeon MF.

## Files to Create

### NEW: src/components/DungeonSelector.vue
A modal/overlay component that displays the full list of selectable dungeons.

#### Props:
- modelValue: boolean (open/close state, v-model)

#### Layout Structure:
1. **Overlay/Modal** pattern matching existing settings modal in App.vue:
   - Dark backdrop (rgba(0,0,0,0.75))
   - Centered card on desktop, bottom sheet on mobile (<380px)
   - Close button in header (X icon, 44px touch target)
   - Focus trap for accessibility

2. **Header**:
   - Title: 'Completed Dungeons'
   - Subtitle/badge: 'XX/24 selected' (count of selected / total)
   - Select All / Deselect All buttons

3. **Dungeon List**:
   - Scrollable list of all 24 dungeons (allSelectableDungeons from useMagicFindConfig)
   - Each entry is a checkbox row:
     - Checkbox input (custom styled to match toggle-switch pattern)
     - Dungeon name text
     - Visual indicator for MF-only dungeons (small 'MF-only' badge in --text-secondary)
   - Dungeons sorted alphabetically
   - MF-only dungeons grouped at bottom with a subtle divider/label ('MF-Only Dungeons')

4. **Footer**:
   - Summary: 'Dungeon MF: +XX' (count of selected dungeons)
   - Close/Done button

#### State Management:
- Reads/writes completedDungeons via useMagicFindConfig()
- Uses toggleDungeon() from the composable for each checkbox change
- No local state needed -- all state flows through the composable

#### Styling:
- Modal: max-width 480px, max-height 70vh, overflow-y: auto for the list
- Checkbox rows: padding 0.625rem, border-bottom 1px solid var(--border-color)
- Hover state on rows: background var(--bg-tertiary)
- Selected rows: subtle highlight background rgba(59, 130, 246, 0.08)
- MF-only badge: font-size 0.6875rem, color var(--text-secondary), italic
- Animations: fadeIn overlay, slideUp on mobile (matching existing modal pattern)
- 44px minimum touch targets for checkboxes

#### Accessibility:
- role='dialog', aria-modal='true'
- aria-labelledby pointing to title
- Focus trap (Tab/Shift+Tab cycle)
- Escape key closes
- Checkbox inputs with proper labels

## Acceptance Criteria
- [ ] Displays all 24 dungeons (18 profit + 6 MF-only)
- [ ] Checkboxes toggle dungeon completion via composable
- [ ] MF-only dungeons visually distinguished with badge and grouped separately
- [ ] Select All / Deselect All work correctly
- [ ] Selection count shown in header and footer
- [ ] Modal opens/closes with animation
- [ ] Focus trap and keyboard navigation work
- [ ] Responsive: bottom sheet on small mobile
- [ ] Selections persist via composable (localStorage)

## Acceptance Criteria

DungeonSelector shows all 24 dungeons, toggling works, MF-only distinguished, persists via composable


## Notes

**2026-03-04T17:49:09Z**

Implementation complete. Files created:
- /home/felix/idle-mmo-profiter/src/components/DungeonSelector.vue
- /home/felix/idle-mmo-profiter/src/components/__tests__/DungeonSelector.test.ts

Component features:
- Modal/overlay pattern matching existing settings modal
- Lists all 24 dungeons (18 profit + 6 MF-only)
- MF-only dungeons grouped separately with visual badge
- Select All / Deselect All functionality
- Selection count badge in header (X/24 selected)
- Footer shows Dungeon MF count (+X)
- Checkboxes with custom styling
- Focus trap and keyboard navigation (Escape to close)
- Responsive: bottom sheet on mobile (<380px)
- Full accessibility support (ARIA attributes, labels, focus management)
- All 30 component tests passing
- Full test suite: 541 tests passing
