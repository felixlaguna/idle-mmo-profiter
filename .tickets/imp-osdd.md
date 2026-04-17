---
id: imp-osdd
status: closed
deps: [imp-44bm]
links: []
created: 2026-03-09T08:20:07Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-acs4
---
# Phase 3: Integrate Context Menu into All Table Components

Wire up the ItemUsesPopover to all 5 table components so right-clicking any item name opens the uses popover.

## Files to Modify

### 1. ProfitRankingTable.vue (/home/felix/idle-mmo-profiter/src/components/ProfitRankingTable.vue)
- Add `@contextmenu.prevent` handler on activity name cells (the `.name-cell` td)
- Track selected item name and anchor rect in local state
- Import and render ItemUsesPopover conditionally

### 2. DungeonTable.vue (/home/felix/idle-mmo-profiter/src/components/DungeonTable.vue)
- Add context menu on dungeon name cells AND on individual drop names in expanded rows
- For dungeon names: show uses of the dungeon's drops (or just show a note that it's a dungeon)
- For drop recipe names in the expanded breakdown: show uses of that recipe/item

### 3. CraftableTable.vue (/home/felix/idle-mmo-profiter/src/components/CraftableTable.vue)
- Add context menu on craftable name cells
- Also add context menu on individual material names in the expanded material breakdown
- Material names are the key use case (e.g., right-clicking 'Trout' in the material list)

### 4. ResourceTable.vue (/home/felix/idle-mmo-profiter/src/components/ResourceTable.vue)
- Add context menu on resource name cells (`.resource-name` span)

### 5. MarketTable.vue (/home/felix/idle-mmo-profiter/src/components/MarketTable.vue)
- Add context menu on item name cells across all sections (Materials, Craftables, Resources, Recipes)

## Implementation Pattern (shared across all components)

```typescript
// Local state for popover
const popoverItemName = ref<string | null>(null)
const popoverAnchorRect = ref<DOMRect | null>(null)

// Handler
const openItemUses = (event: MouseEvent, itemName: string) => {
  event.preventDefault()
  popoverItemName.value = itemName
  popoverAnchorRect.value = (event.target as HTMLElement).getBoundingClientRect()
}

const closeItemUses = () => {
  popoverItemName.value = null
  popoverAnchorRect.value = null
}
```

```html
<!-- In template, add to name cells -->
<td class='name-cell' @contextmenu.prevent='openItemUses($event, item.name)'>

<!-- Render popover once per component -->
<ItemUsesPopover
  v-if='popoverItemName'
  :item-name='popoverItemName'
  :anchor-rect='popoverAnchorRect'
  :visible='!!popoverItemName'
  @close='closeItemUses'
/>
```

## Considerations
- Consider extracting the popover state management into a tiny composable (`useItemUsesPopover`) if the pattern is identical across all 5 components
- Long-press support for mobile needs `@touchstart` / `@touchend` handlers
- Make sure the context menu doesn't interfere with existing row expansion click handlers
- The popover should use Teleport to render at document body level to avoid z-index/overflow issues

## Acceptance Criteria

- Right-click on any item name in any of the 5 tables opens the uses popover
- Material names in expanded CraftableTable rows also trigger the popover
- Drop names in expanded DungeonTable rows also trigger the popover
- Market tab item names also trigger the popover
- Long-press works on mobile for all tables
- Existing click/expand interactions are not broken
- Popover uses Teleport for proper z-index stacking


## Notes

**2026-03-09T08:34:21Z**

Integrated ItemUsesPopover into all 5 table components:

1. ProfitRankingTable.vue - context menu on activity names
2. DungeonTable.vue - context menu on dungeon names AND drop recipe names in expanded rows
3. CraftableTable.vue - context menu on craftable names AND material names in expanded rows
4. ResourceTable.vue - context menu on resource names
5. MarketTable.vue - context menu on item names across all 4 sections (materials, craftables, resources, recipes)

All components:
- Import ItemUsesPopover
- Add popover state (popoverItemName, popoverAnchorRect)
- Add openItemUses/closeItemUses handlers
- Add @contextmenu.prevent listeners to name cells
- Render ItemUsesPopover with Teleport

Build succeeds. Bundle size increased by ~13 KB (605 KB vs 592 KB).
