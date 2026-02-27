---
id: imp-xpbn
status: closed
deps: [imp-7fza]
links: []
created: 2026-02-27T20:23:48Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-yvyo
tags: [refactor, ui]
---
# Phase 5: Rename UI components (App.vue, PotionTable.vue, MarketTable.vue, charts, etc.)

## Purpose
Rename all Vue component references. This is the largest phase by line count.

## Files & Renames

### A. File rename
- `src/components/PotionTable.vue` -> `src/components/CraftableTable.vue`

### B. src/components/CraftableTable.vue (formerly PotionTable.vue) (~100+ renames)
- Import: `PotionProfitResult` -> `CraftableProfitResult`
- Props: `potions: PotionProfitResult[]` -> `craftables: CraftableProfitResult[]`
- Emits:
  - `'update:materialPrice', potionName` -> `craftableName`
  - `'update:marketPrice', potionName` -> `craftableName`
  - `'update:craftTime', potionName` -> `craftableName`
  - `'delete:potion', potionName` -> `'delete:craftable', craftableName`
- Type: `PotionSubTab` -> `CraftableSubTab`
- Computed: `sortedPotions` -> `sortedCraftables`
  - Internal: `const potions = [...]` -> `const items = [...props.craftables]`
- Computed: `filteredPotions` -> `filteredCraftables`
- Functions: `toggleRow(potionName)` -> `toggleRow(craftableName)`, same for `isExpanded`
- Functions: `handleMaterialPriceUpdate(potionName, ...)` -> `handleMaterialPriceUpdate(craftableName, ...)`
- Functions: `handleMarketPriceUpdate(potionName, ...)` -> `handleMarketPriceUpdate(craftableName, ...)`
- Functions: `handleCraftTimeUpdate(potionName, ...)` -> `handleCraftTimeUpdate(craftableName, ...)`
- Template: all `v-for="potion in filteredPotions"` -> `v-for="craftable in filteredCraftables"`
- Template: all `potion.name`, `potion.profit`, `potion.profitPerHour`, etc. -> `craftable.name`, `craftable.profit`, etc.
- CSS class: `.potion-table` -> `.craftable-table`
- CSS class: `.btn-delete-potion` -> `.btn-delete-craftable`
- UI text changes:
  - "Potion Name" column header -> "Craftable Name"
  - "No potions found" -> "No craftables found"
  - "No potions match this category..." -> "No craftables match this category..."
  - "Potion crafting profitability" aria-label -> "Craftable profitability"
  - data-label="Potion" -> data-label="Craftable"
  - title="Remove from potion list" -> "Remove from craftable list"

### C. src/App.vue (~30 renames)
- Import: `calculatePotionProfits` -> `calculateCraftableProfits`
- Import: `PotionTable` -> `CraftableTable`
- Tab type: `'potions'` -> `'craftables'` in union (line 31)
- `dataProvider.potionCrafts` -> `dataProvider.craftableRecipes` (lines 82, 90)
- `potionCrafts: dataProvider.potionCrafts` -> `craftableRecipes: dataProvider.craftableRecipes`
- `potionProfits` -> `craftableProfits` (line 115)
- `calculatePotionProfits(dataProvider.potionCrafts.value, ...)` -> `calculateCraftableProfits(dataProvider.craftableRecipes.value, ...)`
- `removePotionCraft()` -> `removeCraftableRecipe()`
- `updatePotionCraftTime()` -> `updateCraftableRecipeTime()`
- `dataProvider.removePotionCraft()` -> `dataProvider.removeCraftableRecipe()`
- `dataProvider.updatePotionCraftTime()` -> `dataProvider.updateCraftableRecipeTime()`
- `case 'potion':` -> `case 'craftable':` (line 175)
- CSS: `badge-potion` -> `badge-craftable` (lines 176, 470, 568)
- Template:
  - Tab text: `Potions` -> `Craftables` (line 304)
  - `currentTab === 'potions'` -> `currentTab === 'craftables'`
  - `<PotionTable` -> `<CraftableTable`
  - `:potions="potionProfits"` -> `:craftables="craftableProfits"`
  - `@update:craft-time="updatePotionCraftTime"` -> `@update:craft-time="updateCraftableRecipeTime"`
  - `@delete:potion="removePotionCraft"` -> `@delete:craftable="removeCraftableRecipe"`

### D. src/components/MarketTable.vue (~80 renames)
- `untrackedPotionCount` -> `untrackedCraftableCount`
- `isUntrackedPotionRecipe()` -> `isUntrackedCraftableRecipe()`
- `sectionsExpanded.potions` -> `sectionsExpanded.craftables`
- `category: 'potions'` -> `category: 'craftables'` (all instances)
- `getDefaultPotionPrice()` -> `getDefaultCraftablePrice()`
- `dataProvider.potions` -> `dataProvider.craftables`
- `filteredPotions` -> `filteredCraftables`
- `resetPotionsToDefaults()` -> `resetCraftablesToDefaults()`
- `updatePotionPrice()` -> `updateCraftablePrice()`
- `inferPotionName()` -> `inferCraftableName()`
- `addUntrackedPotion()` -> `addUntrackedCraftable()`
- `trackAllUntrackedPotions()` -> `trackAllUntrackedCraftables()`
- `dataProvider.addPotionCraft()` -> `dataProvider.addCraftableRecipe()`
- `dataProvider.addPotion()` -> `dataProvider.addCraftable()`
- `dataProvider.potionCrafts` -> `dataProvider.craftableRecipes`
- `dataProvider.updatePotionPrice()` -> `dataProvider.updateCraftablePrice()`
- `dataProvider.clearCategoryOverrides('potions')` -> `dataProvider.clearCategoryOverrides('craftables')`
- All console.log `[AddPotion]` -> `[AddCraftable]`
- All template section headers: "Potions" -> "Craftables"
- All user-facing strings:
  - "Reset all potion prices..." -> "Reset all craftable prices..."
  - "materials, potions, resources" -> "materials, craftables, resources"
  - "No untracked potions found" -> "No untracked craftables found"
  - "Tracked N potions" -> "Tracked N craftables"
  - "Untracked Potion" badge -> "Untracked Craftable"
  - "Add this potion to tracked potions" -> "Add this craftable to tracked craftables"
  - "API key required to track potions" -> "API key required to track craftables"
  - "Cannot determine which potion this recipe produces" -> "Cannot determine which craftable this recipe produces"
  - "Failed to add potion" -> "Failed to add craftable"
  - "Check the Potions tab" -> "Check the Craftables tab"

### E. src/components/ProfitRankingTable.vue (~10 renames)
- `filterPotions` -> `filterCraftables` (from useActivityFilters)
- `case 'potion': return 'badge-potion'` -> `case 'craftable': return 'badge-craftable'`
- `:class="{ ..., 'badge-potion': filterPotions }"` -> `'badge-craftable': filterCraftables`
- `:aria-pressed="filterPotions"` -> `:aria-pressed="filterCraftables"`
- `aria-label="Toggle potion activities"` -> `"Toggle craftable activities"`
- `@click="filterPotions = !filterPotions"` -> `filterCraftables = !filterCraftables`
- Button text: `Potions` -> `Craftables`
- CSS: `.badge-potion` -> `.badge-craftable` (2 locations)

### F. src/components/DungeonTable.vue (1 rename)
- title text: "Price computed from potion profitability" -> "Price computed from craftable profitability" (line 253)

### G. src/components/HashedIdModal.vue (1 rename)
- Category type: `'potions'` -> `'craftables'` (line 8)

### H. src/components/charts/RevenueBreakdown.vue (~15 renames)
- `totals.potion` -> `totals.craftable` (lines 18, 30, 39, 57)
- `totals.potionCount` -> `totals.craftableCount` (lines 19, 31, 142, 260)
- `activity.activityType === 'potion'` -> `'craftable'` (line 29)
- `totals.potionPercent` -> `totals.craftablePercent` (lines 45, 110, 139)
- Label: `'Potions'` -> `'Craftables'` (line 55)
- Comment: "Green for potions" -> "Green for craftables" (line 61)

### I. src/components/charts/ProfitBarChart.vue (2 renames)
- `case 'potion':` -> `case 'craftable':` (lines 40, 53)

### J. src/api/mock.ts (~8 renames)
- `this.defaults.potions` -> `this.defaults.craftables`
- `const potion = ...` -> `const craftable = ...`
- `description: 'Potion: ...'` -> `description: 'Craftable: ...'`
- `type: 'potion'` -> `type: 'craftable'`

## Acceptance Criteria
- [ ] PotionTable.vue renamed to CraftableTable.vue
- [ ] All component files updated with no 'potion' code references (except in-game item names)
- [ ] All CSS classes renamed
- [ ] All user-facing text updated
- [ ] TypeScript compiles without errors


## Notes

**2026-02-27T20:36:15Z**

Phase 5 complete - all UI components renamed:

Files updated:
1. PotionTable.vue -> CraftableTable.vue (renamed via git mv)
   - All props, emits, types, functions, variables updated
   - CSS classes: .potion-table -> .craftable-table
   - UI text: Potion Name -> Craftable Name, etc.
2. App.vue: Imports, tab type, functions, CSS classes, template text
3. MarketTable.vue: ~80 renames including functions, variables, console logs, user-facing text
4. ProfitRankingTable.vue: Filters, CSS classes, aria labels, button text
5. DungeonTable.vue: Tooltip text updated
6. HashedIdModal.vue: Category type updated
7. RevenueBreakdown.vue: All totals properties and labels
8. ProfitBarChart.vue: Case statements
9. mock.ts: All references updated

TypeScript compilation: Clean (no errors in UI layer)
