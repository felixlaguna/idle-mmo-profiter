---
id: imp-g8f1
status: closed
deps: [imp-10qg]
links: []
created: 2026-03-09T15:45:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ib1d
---
# Phase 2: Add category tabs to ItemUsesPopover component

## Changes

### File: /home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue

Replace the current flat grouped-by-type list with a tabbed interface that groups uses by skill category.

### Tab Definitions
- **Alchemy** tab: uses where `skill === 'alchemy'`
- **Forging** tab: uses where `skill === 'forging'`
- **Other** tab: all remaining uses (resource-material with smelting/cooking/etc, dungeon-drop, gathering-source, recipe-product)

### Script Changes

1. Add a reactive `activeTab` ref (default to first non-empty tab):
   ```ts
   const activeTab = ref<'alchemy' | 'forging' | 'other'>('alchemy')
   ```

2. Create a computed for tabs with their uses:
   ```ts
   const tabs = computed(() => {
     const all = usesWithProfit.value
     return [
       { key: 'alchemy', label: 'Alchemy', uses: all.filter(u => u.skill === 'alchemy') },
       { key: 'forging', label: 'Forging', uses: all.filter(u => u.skill === 'forging') },
       { key: 'other', label: 'Other', uses: all.filter(u => u.skill !== 'alchemy' && u.skill !== 'forging') },
     ].filter(tab => tab.uses.length > 0)
   })
   ```

3. Auto-select first non-empty tab when item changes:
   ```ts
   watch(() => props.itemName, () => {
     const firstTab = tabs.value[0]
     if (firstTab) activeTab.value = firstTab.key
   }, { immediate: true })
   ```

4. Compute the currently displayed uses based on active tab:
   ```ts
   const activeTabUses = computed(() => {
     return tabs.value.find(t => t.key === activeTab.value)?.uses || []
   })
   ```

5. Update heatmap min/max to use activeTabUses instead of all usesWithProfit.

### Template Changes

1. Add tab bar between header and content:
   ```html
   <div class="popover-tabs">
     <button
       v-for="tab in tabs"
       :key="tab.key"
       class="tab-btn"
       :class="{ active: activeTab === tab.key }"
       @click="activeTab = tab.key"
     >
       {{ tab.label }} ({{ tab.uses.length }})
     </button>
   </div>
   ```

2. Replace the current grouped categories iteration with a flat list of activeTabUses. Within the Other tab, keep the existing category sub-headers (CRAFTING, RESOURCE PROCESSING, DUNGEON DROPS, etc.) for organization. Within Alchemy/Forging tabs, the items are all the same type so sub-headers are optional.

3. Keep the existing use-item rendering (context, detail, profit heatmap) unchanged.

### Style Changes

1. Add tab bar styles matching the app's dark theme:
   - Tab bar: flex row, border-bottom, bg-secondary background
   - Tab buttons: compact, text-secondary default, text-primary + border-bottom accent when active
   - Use existing CSS custom properties (--bg-secondary, --text-primary, --text-secondary, --accent-primary, --border-color)
   - Smooth transitions using var(--ease-out)

2. Tab-specific accent colors (optional, to match existing category colors):
   - Alchemy active: teal/green tint (matches craftable category #4ade80)
   - Forging active: blue tint (or use --accent-primary)
   - Other active: default accent

### Edge Cases
- If an item only has uses in one category, still show tabs (but only that tab will be visible) -- actually, if only 1 tab has items, the tabs row could be hidden for cleaner UX. Implementer's discretion.
- If item has no uses at all, show existing 'No demand sources found' message (no tabs).
- Tab counts should update reactively if data changes.
- Mobile: tabs should still fit -- use compact styling or allow horizontal scroll if needed.

## Acceptance Criteria

- Tabs render between header and content area
- Clicking a tab filters the displayed uses
- Default tab is the first non-empty tab
- Tab shows count of uses in parentheses
- Uses within each tab are displayed with profit heatmap
- Other tab preserves category sub-headers
- Existing popover positioning and close behavior unchanged
- Mobile layout works correctly
- Smooth transitions on tab switch
- No regressions in popover open/close behavior


## Notes

**2026-03-09T15:51:05Z**

Phase 2 implementation complete:

Script changes:
- Added activeTab ref with type 'alchemy' | 'forging' | 'other'
- Created tabs computed that filters uses by skill field
- Only non-empty tabs are included
- Added watch to auto-select first non-empty tab when itemName changes
- Created activeTabUses computed to get currently displayed uses
- Updated groupedUses to work with activeTabUses
- Updated heatmap min/max calculations to use activeTabUses

Template changes:
- Added tab bar between header and content (only shown if tabs.length > 1)
- Tab buttons show label and count of uses
- Active tab has distinct styling with accent color
- Existing category grouping preserved within each tab

Style changes:
- Added .popover-tabs flex container with bg-secondary
- Tab buttons with hover and active states
- Active tab has border-bottom accent
- Tab count badges with reduced opacity
- Responsive overflow-x for mobile if needed
- All transitions use var(--ease-out)

Build successful, TypeScript compiles without errors.
Dev server running with hot reload active.
