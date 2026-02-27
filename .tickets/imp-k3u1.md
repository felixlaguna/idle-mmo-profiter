---
id: imp-k3u1
status: closed
deps: [imp-hi4l]
links: []
created: 2026-02-27T12:56:06Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-wwfn
---
# Phase 3: Add Alchemy/Forging sub-tabs to PotionTable.vue

Add two sub-tabs ('Alchemy' and 'Forging') to the PotionTable component. Clicking a tab filters the table to show only potions of that skill type. This is the primary UI change for the epic.

### Files to modify:

1. **src/components/PotionTable.vue**

#### Script changes (lines 1-163):
- Add a reactive ref for the active sub-tab:
  type PotionSubTab = 'alchemy' | 'forging'
  const activeSubTab = ref<PotionSubTab>('alchemy')

- Add a computed for filtered potions that chains after sortedPotions:
  const filteredPotions = computed(() => {
    return sortedPotions.value.filter(p => p.skill === activeSubTab.value)
  })

- Update profitRange computed to use filteredPotions instead of props.potions for heatmap calculation (so heatmap colors reflect the visible sub-tab, not all potions)

#### Template changes (lines 165-401):
- Before the table-container div (line 167), add a sub-tab navigation bar:
  <div class="sub-tab-navigation">
    <button class="sub-tab-button" :class="{ active: activeSubTab === 'alchemy' }" @click="activeSubTab = 'alchemy'">
      Alchemy
    </button>
    <button class="sub-tab-button" :class="{ active: activeSubTab === 'forging' }" @click="activeSubTab = 'forging'">
      Forging
    </button>
  </div>

- Change v-for on line 190 from 'potion in sortedPotions' to 'potion in filteredPotions'

- Add an EmptyState when filteredPotions is empty (import EmptyState component):
  <EmptyState v-if="filteredPotions.length === 0" icon="🧪" title="No potions found" description="No potions match this category yet. Add potions from the Market tab." />

#### Style changes (lines 403-827):
- Add styles for sub-tab navigation. Follow the pattern already used in ProfitRankingTable.vue's filter-controls (lines 246-295) for visual consistency:
  .sub-tab-navigation — flex container with gap, padding, border, border-radius (matches .filter-controls pattern)
  .sub-tab-button — base style matching .filter-button
  .sub-tab-button.active — use the green potion badge color from .badge-potion (rgba(34, 197, 94, 0.2), color #4ade80)
  Keep mobile responsive — the two buttons should flex-wrap on narrow screens

### Behavior when skill is undefined:
- Potions without a skill field (neither alchemy nor forging detected) will NOT appear in either sub-tab. This is acceptable because:
  1. All real game potions use either a Vial or Crystal ingredient
  2. The Phase 2 fallback heuristic should catch all legitimate potions
  3. If somehow a potion has no skill, the user can re-add it from the Market tab (which will now capture the skill from the API)

### Props type update:
- PotionProfitResult already has the skill field from Phase 2, so the props type (line 10) needs no changes

### No changes needed:
- App.vue — PotionTable props and events unchanged
- Other components — this is scoped to PotionTable only

## Acceptance Criteria

- Two sub-tabs (Alchemy / Forging) appear above the potion table
- Clicking a sub-tab filters the table to show only potions of that skill type
- Heatmap colors recalculate per sub-tab
- Empty state shown when a sub-tab has no matching potions
- Visual style is consistent with existing filter-controls pattern
- Sub-tabs are responsive on mobile
- Sorting still works within each sub-tab
- Expand/collapse rows still work within each sub-tab


## Notes

**2026-02-27T13:02:51Z**

Phase 3 implementation complete.

Files modified:
- /home/felix/idle-mmo-profiter/src/components/PotionTable.vue - Added sub-tab navigation (Alchemy/Forging), filtered potions computed property, empty state support, and sub-tab styles

Features implemented:
- Two sub-tabs (Alchemy / Forging) above the potion table
- Clicking a sub-tab filters the table to show only potions of that skill type
- Heatmap colors recalculate per sub-tab (using filteredPotions)
- Empty state shown when a sub-tab has no matching potions
- Visual style consistent with existing filter-controls pattern
- Sub-tabs are responsive on mobile (flex-wrap)
- Sorting still works within each sub-tab
- Expand/collapse rows still work within each sub-tab

Build: SUCCESS
Tests: ALL PASSED (216/216)
