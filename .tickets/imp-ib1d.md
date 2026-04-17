---
id: imp-ib1d
status: open
deps: []
links: []
created: 2026-03-09T15:44:13Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Add category tabs to item usage context menu

Add tabs to the item usage context menu to categorize usages by type (Alchemy, Forging, and Other). Currently all usages are shown in a flat list - user wants to easily filter/navigate by category.


## Notes

**2026-03-09T15:45:13Z**

## Scouter Analysis

### Affected Files
- `/home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue` - Main popover component (PRIMARY change target)
- `/home/felix/idle-mmo-profiter/src/composables/useItemUses.ts` - Item uses composable (needs skill field on ItemUse)
- `/home/felix/idle-mmo-profiter/src/types/index.ts` - Type definitions (reference only)

### Current Architecture
- ItemUsesPopover receives itemName, anchorX/Y, visible, rankedActivities as props
- useItemUses composable returns `ItemUse[]` with types: craftable-material, resource-material, dungeon-drop, gathering-source, recipe-product
- Popover already groups uses into categories (craftable, resource, dungeon, gathering, product) and renders them with colored section headers
- CraftableRecipe has `skill?: 'alchemy' | 'forging'` field
- ResourceRecipe has `skill: ResourceSkill` (smelting, cooking, woodcutting, mining, fishing, hunt, dungeon)
- For craftable-material uses, the skill is embedded in the context string as suffix: 'Recipe Name (alchemy)' or 'Recipe Name (forging)'

### Key Insight for Tab Design
The user wants tabs: Alchemy, Forging, Other.
- Craftable-material uses already have skill info (alchemy/forging) available from the recipe
- Resource-material, dungeon-drop, gathering-source, recipe-product would go to 'Other'
- The composable needs to expose the skill field on ItemUse so the popover can group by tab without regex parsing the context string

### Consumer Components (no changes needed)
- CraftableTable.vue, DungeonTable.vue, MarketTable.vue, ProfitRankingTable.vue, ResourceTable.vue all use ItemUsesPopover identically via usePopover composable
- Props interface unchanged, so no consumer updates required

**2026-03-09T15:46:18Z**

## Planning Complete

### Phases Created (3 tasks, linear dependency)

1. **imp-10qg** - Phase 1: Add skill field to ItemUse interface and populate it
   - File: /home/felix/idle-mmo-profiter/src/composables/useItemUses.ts
   - Small data-layer change to expose skill info for tab grouping

2. **imp-g8f1** - Phase 2: Add category tabs to ItemUsesPopover component (MAIN WORK)
   - File: /home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue
   - Tab bar UI, filtering logic, styles, edge cases

3. **imp-qyi2** - Phase 3: Visual QA and polish
   - Playwright screenshots at 3 viewports, verify mobile + desktop

### Dependency Chain
imp-10qg --> imp-g8f1 --> imp-qyi2

### Design Decisions
- Tabs: Alchemy | Forging | Other (only non-empty tabs shown)
- Other tab contains: resource processing, dungeon drops, gathering, recipe products
- Other tab preserves existing category sub-headers for organization
- Auto-select first non-empty tab when popover opens
- No changes needed to consumer components (CraftableTable, DungeonTable, etc.)

### Risks
- [LOW] If an item only has 'Other' uses, the single tab may look odd. Mitigation: hide tab bar when only 1 tab exists.
- [LOW] Tab bar adds ~40px height to popover, reducing scroll area. Mitigation: compact tab styling.

### No Changes Needed
- usePopover.ts (unchanged)
- types/index.ts (unchanged -- skill field already exists on CraftableRecipe/ResourceRecipe)
- Consumer components (unchanged -- props interface stays the same)

**2026-03-09T15:47:35Z**

User approved implementation plan. Starting implementation.

**2026-03-09T15:51:16Z**

Implementation complete (Phases 1 and 2).

## Files Modified

### /home/felix/idle-mmo-profiter/src/composables/useItemUses.ts
- Added skill field to ItemUse interface (optional string for alchemy, forging, or resource skills)
- Populated skill field for craftable-material uses (from recipe.skill)
- Populated skill field for resource-material uses (from recipe.skill)
- Populated skill field for gathering-source uses (from gatheringSource.skill)

### /home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue
- Added tab functionality with Alchemy, Forging, and Other tabs
- Only non-empty tabs are shown
- Hides tab bar entirely when only 1 tab exists
- Auto-selects first non-empty tab on item change
- Category sub-headers preserved within each tab
- Compact tab styling with count badges
- Active tab styling with accent border
- All existing functionality preserved (profit heatmap, hover states, mobile layout)

## Tests
- TypeScript compilation: PASSED
- Build: SUCCESSFUL
- Dev server: RUNNING with hot reload

## Notes
Phase 3 (Visual QA) skipped as per instructions - orchestrator handles it.

Ready for review and Visual QA.

**2026-03-09T15:51:55Z**

Implementation complete. Phase 1 (imp-10qg) and Phase 2 (imp-g8f1) done. Build passes. Launching reviewer.

**2026-03-09T15:54:17Z**

## Code Review: NEEDS FIXES

### Files Reviewed
- `/home/felix/idle-mmo-profiter/src/composables/useItemUses.ts`
- `/home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue`

### Build: PASS
TypeScript compilation and Vite build both succeed with no new warnings.

### Linter (ESLint): PASS
No lint errors or warnings on modified files.

### Tests: PASS
All 640 tests pass (38 test files, 1 pre-existing skip).

---

### Issues Found

#### 1. [Accessibility] Missing WAI-ARIA tab pattern on popover tabs
**File:** `/home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue`, lines 294-305
**Problem:** The new tab bar uses plain `<button>` elements with no ARIA attributes. The main app (App.vue lines 448-528) uses the full WAI-ARIA tab pattern: `role="tablist"` on the container, `role="tab"` on each button, `:aria-selected` bound to active state, `:tabindex` management (0 for active, -1 for inactive), and `@keydown` for arrow-key navigation.
**Suggestion:** Add matching ARIA attributes to the popover tabs:
```html
<div v-if="tabs.length > 1" class="popover-tabs" role="tablist" aria-label="Item use categories">
  <button
    v-for="tab in tabs"
    :key="tab.key"
    class="tab-btn"
    :class="{ active: activeTab === tab.key }"
    role="tab"
    :aria-selected="activeTab === tab.key"
    :tabindex="activeTab === tab.key ? 0 : -1"
    @click="activeTab = tab.key"
  >
```
This also enables the global `[role="tab"]:focus-visible` styles from style.css (line 208) to apply.

#### 2. [TypeScript] Redundant union type on `skill` field weakens type safety
**File:** `/home/felix/idle-mmo-profiter/src/composables/useItemUses.ts`, line 29
**Problem:** The type `'alchemy' | 'forging' | string` collapses to just `string` because `string` is a supertype of the string literals. The explicit `'alchemy'` and `'forging'` members provide no type narrowing benefit.
**Suggestion:** Use a proper union that preserves the known skill types:
```typescript
skill?: 'alchemy' | 'forging' | ResourceSkill
```
This imports `ResourceSkill` (already defined as `'smelting' | 'cooking' | 'woodcutting' | 'mining' | 'fishing' | 'hunt' | 'dungeon'`) and gives full type safety. The tab grouping logic in the popover would then benefit from exhaustive checking.

#### 3. [Edge Case] Active tab can become stale when `rankedActivities` prop changes
**File:** `/home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue`, lines 69-74
**Problem:** The watcher that auto-selects the first tab only fires on `props.itemName` changes. But the `tabs` computed also depends on `usesWithProfit`, which depends on `props.rankedActivities`. If `rankedActivities` changes while the popover is open (e.g., settings/efficiency changes), the active tab might no longer exist in the `tabs` array, resulting in an empty view via the fallback `|| []` on line 78.
**Suggestion:** Watch the `tabs` computed instead of just `props.itemName`, or add a secondary guard:
```typescript
watch(() => props.itemName, () => {
  const firstTab = tabs.value[0]
  if (firstTab) {
    activeTab.value = firstTab.key
  }
}, { immediate: true })

// Guard: if active tab disappears, fallback to first available
watch(tabs, (newTabs) => {
  if (!newTabs.find(t => t.key === activeTab.value) && newTabs.length > 0) {
    activeTab.value = newTabs[0].key
  }
})
```

#### 4. [Style] Trailing blank line before closing style tag
**File:** `/home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue`, line 654
**Problem:** There is a trailing blank line before `</style>` on line 655. Other components in the codebase do not have this trailing blank line.
**Suggestion:** Remove the blank line on line 654.

---

### Design Note (non-blocking)
The heatmap min/max is scoped to the active tab (`activeTabUses` on lines 227-239). This means the same profit value renders with different color intensity on different tabs. This is likely intentional (maximizes color range per tab), but if cross-tab color consistency is desired, the heatmap should use the global `usesWithProfit` for min/max instead.

---

### Summary
- Issues 1-3 should be fixed before merging
- Issue 4 is minor but keeps style consistent
- The implementation is well-structured overall: clean computed chain, proper single-tab hiding, good use of existing heatmap composable, and correct category sub-header preservation within tabs

**2026-03-09T15:54:39Z**

Review found 3 issues: (1) Missing WAI-ARIA tab attributes, (2) Redundant union type collapses to string, (3) Active tab can become stale when rankedActivities changes. Sending back to implementer.

**2026-03-09T15:59:17Z**

## Code Review (Re-review): APPROVED

### Files Reviewed
- /home/felix/idle-mmo-profiter/src/composables/useItemUses.ts
- /home/felix/idle-mmo-profiter/src/components/ItemUsesPopover.vue

### Previous Issues -- All 4 Fixed

1. **WAI-ARIA tab attributes** -- FIXED. The popover tabs (line 323-337) now have role="tablist" on the container, role="tab" on each button, :aria-selected bound to active state, :tabindex management (0 for active, -1 for inactive), and @keydown handler for arrow-key navigation (lines 81-103). This matches the App.vue pattern exactly.

2. **Redundant union type** -- FIXED. Line 29 of useItemUses.ts now reads `skill?: 'alchemy' | 'forging' | ResourceSkill` instead of `'alchemy' | 'forging' | string`. ResourceSkill is properly imported from types (line 17). All string literal types are preserved for type narrowing.

3. **Active tab stale when rankedActivities changes** -- FIXED. The watcher on line 69 now watches `[() => props.itemName, tabs]` instead of just `props.itemName`. Since tabs depends on usesWithProfit which depends on props.rankedActivities, any change to rankedActivities will trigger tab revalidation. The guard also checks whether the current tab still exists before resetting (lines 73-76).

4. **Trailing blank line** -- FIXED. File ends cleanly at line 687 with no trailing blank line before the closing style tag.

### Build: PASS
- vue-tsc and vite build both succeed with no new warnings

### Linter (ESLint): PASS
- No lint errors or warnings on either modified file

### Tests: PASS
- All 640 tests pass (38 test files, 1 pre-existing skip)

### No New Issues Found

Code is ready for user review.

**2026-03-09T15:59:31Z**

Re-review: APPROVED. All 4 issues fixed. Build, linter, tests pass. Ready for user review.

**2026-03-09T16:47:55Z**

User feedback: 'It looks the same' — tabs may not be rendering. Need to investigate.
