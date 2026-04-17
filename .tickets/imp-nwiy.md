---
id: imp-nwiy
status: closed
deps: [imp-v7yk]
links: []
created: 2026-03-05T09:20:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ebbl
---
# Phase 4: Efficiency Panel UI (EfficiencyPanel + ItemSelector Modal)

## Objective
Create UI components for configuring efficiency items, following the MagicFindPanel + DungeonSelector modal pattern.

## Components to Create

### 1. EfficiencyPanel.vue (/home/felix/idle-mmo-profiter/src/components/EfficiencyPanel.vue)
Follow MagicFindPanel.vue pattern exactly:
- Collapsible summary panel showing total efficiency per skill
- Summary row: 'Efficiency: Smelting 5% | Cooking 3%' (only show skills from added recipes)
- Button to open item selector modal for each skill
- Placed above the ResourceTable in the Resources tab (like MagicFind is above DungeonTable)

**Design tokens to use:** --surface-bg, --surface-border, --surface-radius, --surface-shadow, --ease-out

### 2. EfficiencyItemSelector.vue (/home/felix/idle-mmo-profiter/src/components/EfficiencyItemSelector.vue)
Follow DungeonSelector.vue modal pattern exactly:
- Modal dialog with header, scrollable list, footer
- Shows items that have effects for the selected skill
- **RADIO selection** (only ONE item at a time per skill, unlike dungeon checkboxes)
- 'None' option to deselect
- Shows item name and efficiency percentage
- Footer shows current selection and 'Done' button
- Focus trap, Escape to close, click-outside to close

### 3. Integration in App.vue or ResourceTable parent
- Show EfficiencyPanel in the Resources tab (v-if="currentTab === 'resources'")
- Only show if there are resource recipes with efficiency-applicable skills
- EfficiencyPanel emits event to open EfficiencyItemSelector modal

## Accessibility Requirements (match existing patterns)
- role='dialog', aria-modal='true' for modal
- Focus trap within modal
- Keyboard navigation (Enter/Space to select, Escape to close)
- aria-labels on all interactive elements
- min-height: 44px on touch targets (48px on mobile)

## Mobile Responsive (match DungeonSelector patterns)
- Bottom sheet style on small screens (<379px)
- Slide-up animation
- Pill drag indicator at top
- Larger touch targets on mobile (48px)

## Acceptance Criteria

- EfficiencyPanel renders with collapsible summary
- ItemSelector modal opens/closes correctly
- Only ONE item selectable per skill (radio behavior)
- Focus trap works in modal
- Keyboard accessible (Escape closes, Enter selects)
- Mobile responsive with bottom sheet pattern
- Uses design system tokens consistently
- Visual style matches MagicFindPanel and DungeonSelector


## Notes

**2026-03-05T09:43:13Z**

Created EfficiencyPanel.vue component following MagicFindPanel.vue pattern:
- Collapsible summary row showing efficiency per skill
- Skills grid with individual skill buttons to open item selector
- Empty state when no resource recipes exist
- Total efficiency bonus display
- Fully responsive (mobile/tablet)
- Uses design system tokens

**2026-03-05T09:44:38Z**

Created EfficiencyItemSelector.vue modal following DungeonSelector.vue pattern:
- Radio selection (only ONE item per skill)
- 'None' option to deselect
- Shows item name and efficiency percentage
- Focus trap, Escape to close, click-outside to close
- Bottom sheet style on small screens (<379px)
- Fully accessible with aria labels and keyboard navigation
- Uses teal accent colors for efficiency theme

**2026-03-05T09:46:43Z**

Integrated EfficiencyPanel and EfficiencyItemSelector into App.vue:
- Added imports for both components
- Added modal state (showEfficiencySelector, selectedEfficiencySkill)
- Added openEfficiencySelector handler function
- Placed EfficiencyPanel above ResourceTable in Resources tab
- Placed EfficiencyItemSelector modal at end of template
- All 627 tests passing (no regressions)

**2026-03-05T09:48:06Z**

Phase 4 Implementation Complete!

Components Created:
1. EfficiencyPanel.vue - Collapsible panel showing efficiency per skill
   - Summary row with efficiency breakdown
   - Skills grid with individual item buttons
   - Empty state when no resource recipes exist
   - Total efficiency bonus display
   - Fully responsive (mobile/tablet)

2. EfficiencyItemSelector.vue - Modal for selecting efficiency items
   - Radio selection (only ONE item per skill)
   - None option to deselect
   - Shows item name and efficiency percentage
   - Focus trap, Escape to close, click-outside to close
   - Bottom sheet style on small screens (<379px)
   - Fully accessible with ARIA labels

Integration:
- Added to App.vue in Resources tab (above ResourceTable)
- Modal state management complete
- Event handlers wired correctly
- Uses teal accent colors for efficiency theme

Quality:
- TypeScript compilation: SUCCESS (no errors)
- All 627 tests: PASSING (no regressions)
- Follows MagicFindPanel and DungeonSelector patterns exactly
- Design system tokens used consistently
- Accessibility requirements met (role, aria-modal, focus trap, keyboard nav)
- Mobile responsive with touch targets (44px desktop, 48px mobile)

Ready for user testing!

**2026-03-05T15:48:45Z**

Post-release fix (e5bff62): Fixed efficiency item selection bug - Object.keys on Map replaced with [...new Set(skillMap.values())]. activeSkills now derives from efficiency items data instead of resourceSkillMap. Removed 47 non-equipment items (consumables + alchemy-recipe items) from efficiencyItems, leaving 28 equipment items.
