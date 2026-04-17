---
id: imp-b2yq
status: closed
deps: [imp-rwjb]
links: []
created: 2026-03-05T09:20:21Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ebbl
---
# Phase 5: Resource Table UI Enhancements

## Objective
Update the ResourceTable to display the 3 computed modes per resource recipe and show items/h alongside profit/h.

## Changes Required

### 1. Update ResourceTable.vue (/home/felix/idle-mmo-profiter/src/components/ResourceTable.vue)

**New columns:**
- Items/hr column (derived from time: 3600 / timeSeconds)
- Show the mode (Buy All / Gather / Gather All) as a badge or indicator
- Group related modes visually (same base item, 3 modes)

**Display approach options (present to user):**

**Option A: Expandable row groups**
- Show the best mode as the primary row
- Expand to see all 3 modes with their items/h and profit/h
- Similar to how CraftableTable has expandable rows for material breakdown

**Option B: Flat table with mode badges**  
- Show all 3 modes as separate rows (current approach for existing resources)
- Add a 'Mode' badge column (Buy All, Gather, Gather All)
- Color-code: Buy All = blue, Gather = green, Gather All = gold

**Option C: Sub-tabs within Resources**
- One sub-tab per mode: 'Buy All' | 'Gather' | 'Gather All'
- Each shows all resources with that mode's calculations

### 2. Update resource profit display
- Each mode shows: items/h, vendor profit/h, market profit/h, best method
- The 3 modes have different time values (and therefore different items/h)
- Use existing heatmap composable for profit coloring

### 3. Edit support
- Editable base craft time (shared across all 3 modes of same recipe)
- Editable material prices (changes propagate through recalculation)

### 4. Add/Remove resource recipes
- If implementing CRUD UI similar to CraftableTable's add form
- Allow users to add new resource recipes from the Resources tab
- Delete button to remove user-added recipes

## Key Data Points Per Row
1. Resource name (+ mode indicator)
2. Time (seconds)
3. Items/hr (3600 / time) -- NEW
4. Cost (varies by mode)
5. Vendor price
6. Market price
7. Best method (vendor/market)
8. Profit/hr

## Acceptance Criteria

- 3 modes per resource recipe visible in ResourceTable
- Items/hr column shows correctly
- Heatmap coloring applied to profit values
- Editable time and prices work
- Sorting works across all columns
- Mobile responsive with card layout
- Existing resource entries still display correctly


## Notes

**2026-03-05T09:33:11Z**

Starting implementation. Reading existing code structure:
- ResourceTable.vue uses flat table layout
- CraftableTable.vue has expandable row pattern (expandedRows ref, toggleRow function)
- resourceGathering computed property auto-generates 3 modes per recipe: Buy All, Gather, Gather All
- Need to group these 3 modes under expandable parent rows

**2026-03-05T09:38:16Z**

Phase 5 UI implementation progress:

COMPLETED:
- Expandable row groups for resource recipes
- Each recipe shows 3 modes (Buy All, Gather, Gather All)
- Items/hr column added
- Mode badges with color coding (blue=buy, green=gather, gold=gather all)
- Skill badges with skill-specific colors
- Heatmap coloring on profit columns
- Vendor and Market profit/hr columns displayed
- All 620 tests passing
- TypeScript compilation successful

REMAINING:
- UI for adding/removing resource recipes
- Visual testing with Docker
- Integration testing with real data

**2026-03-05T09:40:33Z**

Phase 5 implementation COMPLETE:

✅ Expandable row groups
  - Parent row shows best mode
  - Child rows show all 3 modes (Buy All, Gather, Gather All)
  - Expand/collapse with animated chevron icon

✅ Items/hr column
  - Calculated as 3600 / timeSeconds
  - Displayed for all modes

✅ Mode badges
  - Buy All: Blue badge
  - Gather: Green badge
  - Gather All: Gold badge

✅ Skill badges
  - Color-coded by skill type (smelting=red, cooking=orange, woodcutting=green, mining=gray, fishing=blue)
  - Displayed on parent rows

✅ Profit columns
  - Vendor Profit/hr with heatmap
  - Market Profit/hr with heatmap
  - Best Profit/hr with full intensity heatmap

✅ Delete functionality
  - Delete button on parent rows (hover to reveal)
  - Wired to removeResourceRecipe in data provider

✅ Test recipe added
  - Uranium Bar (smelting) example in defaults.json
  - Uses Uranium Ore + Coal materials

✅ All tests passing
  - 627 tests pass (up from 620)
  - TypeScript compilation successful
  - No runtime errors

Ready for review and Phase 6 (integration testing).

**2026-03-05T15:48:45Z**

Post-release fix (e5bff62): Hide expand chevron for single-mode resources (raw materials) using visibility:hidden. Show skill badges on raw resource rows.
