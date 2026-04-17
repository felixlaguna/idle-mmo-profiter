---
id: imp-zi3u
status: closed
deps: [imp-zzp2]
links: []
created: 2026-03-04T17:38:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mshp
---
# Phase 2: MagicFindPanel component - collapsible card with MF inputs

## Goal
Create the MagicFindPanel.vue component that displays total MF and provides a collapsible editing card for streak, items, and bonus values.

## Files to Create

### NEW: src/components/MagicFindPanel.vue
A self-contained component rendered at the top of the Dungeons tab (above the controls-bar).

#### Layout Structure (top to bottom):
1. **Summary Row** (always visible):
   - Left side: 'Magic Find: XX' text (compact, using --text-secondary for label, --text-primary for value)
   - Right side: Chevron icon button to expand/collapse the card
   - The entire row is clickable to toggle collapse

2. **Collapsible Card** (shown/hidden with v-show + CSS transition):
   - Uses the shared surface tokens: --surface-bg, --surface-border, --surface-radius, --surface-shadow
   - 3 editable fields in a horizontal row (grid layout on desktop, stack on mobile):
     - MF from Streak (number input)
     - MF from Items (number input)
     - MF from Bonus (number input)
   - Each field uses the existing EditableValue component for consistency
   - Below the inputs, a small read-only summary: 'Streak: X + Dungeons: Y + Items: Z + Bonus: W = Total: XX'

3. **Dungeon MF Button** (always visible, positioned next to the summary row):
   - Button text: 'Dungeons: XX' (where XX is completedDungeons count)
   - Clicking opens the dungeon selector (Phase 3)
   - Styled as a pill/badge button matching existing badge patterns (--accent-primary tones)

#### State Management:
- Reads/writes streak, item, bonus via useStorage('magicFind')
- Reads dungeonMF from useMagicFindConfig() composable
- Reads totalMF from useMagicFindConfig() composable
- Collapse state stored locally (ref, not persisted -- defaults to collapsed)
- Emits 'open-dungeon-selector' event when dungeon button is clicked

#### Styling:
- Follow design-system.md tokens: --surface-*, --text-*, --ease-out transitions
- Collapse animation: max-height transition with overflow hidden, 200ms --ease-out
- 44px min touch targets for all interactive elements
- Mobile (<768px): inputs stack vertically, dungeon button full width below summary
- Card is compact -- padding matches controls-bar spacing

## Acceptance Criteria
- [ ] Total MF displayed as compact text (always visible)
- [ ] Collapsible card toggles with smooth animation
- [ ] 3 number inputs (streak, items, bonus) work via EditableValue
- [ ] Dungeon MF button shows count and emits event on click
- [ ] Summary breakdown visible when card is expanded
- [ ] Responsive: horizontal on desktop, vertical on mobile
- [ ] Uses design system tokens consistently
- [ ] 44px touch targets on mobile

## Acceptance Criteria

MagicFindPanel renders with collapsible card, 3 MF inputs, dungeon button, responsive layout


## Notes

**2026-03-04T17:46:36Z**

Starting implementation of MagicFindPanel.vue component

**2026-03-04T17:47:29Z**

MagicFindPanel.vue component created successfully.

Component features:
- Summary row showing total Magic Find (compact display)
- Dungeon button showing completed dungeons count (emits 'open-dungeon-selector' event)
- Collapsible card with smooth animation
- 3 editable MF inputs: Streak, Items, Bonus (using EditableValue component)
- Breakdown summary showing calculation
- Uses useMagicFindConfig composable for state management
- Follows design system tokens (--surface-*, --text-*, --ease-out)
- Responsive: horizontal grid on desktop, vertical stack on mobile
- 44px/48px touch targets for mobile
- Passes linting with no errors
