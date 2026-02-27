---
id: imp-dx85
status: closed
deps: [imp-xpbn]
links: []
created: 2026-02-27T20:24:16Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-yvyo
tags: [refactor, tests]
---
# Phase 6: Rename test files and update test content

## Purpose
Update all test files to use the new names. Tests should pass after this phase.

## Files & Renames

### A. File rename
- `src/tests/calculators/potionCalculator.test.ts` -> `src/tests/calculators/craftableCalculator.test.ts`
- `src/tests/components/MarketTable.isUntrackedPotionRecipe.test.ts` -> `src/tests/components/MarketTable.isUntrackedCraftableRecipe.test.ts`

### B. src/tests/calculators/craftableCalculator.test.ts (~50 renames)
- Import: `calculatePotionProfits` -> `calculateCraftableProfits`, `PotionCraft` -> `CraftableRecipe`
- Import path: `../../calculators/potionCalculator` -> `../../calculators/craftableCalculator`
- `describe('calculatePotionProfits', ...)` -> `describe('calculateCraftableProfits', ...)`
- `mockPotionCraft: PotionCraft` -> `mockCraftableRecipe: CraftableRecipe`
- All `calculatePotionProfits(...)` calls -> `calculateCraftableProfits(...)`
- All `potionCraft: PotionCraft` variables -> `craftableRecipe: CraftableRecipe`
- All in-describe variables like `mockPotionCraft` -> `mockCraftableRecipe`
- Comments: "potion" -> "craftable"
- NOTE: In-game item names in test data like "Alchemy Potion", "Mystery Potion", "Crystal Potion", "Unlimited Potion", "Edge Case Potion" may be renamed to something clearer like "Test Craftable A", "Test Craftable B" etc, OR left as-is since they are just test fixture names. Implementer can decide.

### C. src/tests/calculators/dungeonCalculator.test.ts (~40 renames)
- Import: `PotionCraft` -> `CraftableRecipe`
- `profitablePotion: PotionCraft` -> `profitableCraftable: CraftableRecipe`
- `unprofitablePotion: PotionCraft` -> `unprofitableCraftable: CraftableRecipe`
- All `potionCraftsRef` -> `craftableRecipesRef`
- All `potionCraft` variables -> `craftableRecipe`
- Comments: "potion profit", "potion not found", "Empty potion crafts" -> "craftable profit", "craftable not found", "Empty craftable recipes"
- Test names: "potion" -> "craftable" in describe/it strings
- NOTE: In-game item names like "Unknown Potion Recipe (Untradable)" and "NonExistentPotion" are test fixture data -- leave as-is or update, implementer's choice.

### D. src/tests/components/MarketTable.isUntrackedCraftableRecipe.test.ts
- `inferPotionName` -> `inferCraftableName`
- `interface PotionCraft` -> `interface CraftableRecipe` (local test interface)
- `isUntrackedPotionRecipe` -> `isUntrackedCraftableRecipe`
- `trackedPotions` -> `trackedCraftables`
- All `potionName` -> `craftableName`
- Comments: "potion" -> "craftable"
- Test names: "potion" -> "craftable"
- NOTE: In-game item names like "Lesser Health Potion", "Greater Mana Potion", "Fire Resist Potion Recipe" are test fixture data referencing real game items -- leave as-is.

### E. src/tests/composables/useDataProvider.test.ts (~30 renames)
- `data.potions` -> `data.craftables`
- `dataProvider.potions` -> `dataProvider.craftables`
- `'potions'` string literal -> `'craftables'`
- `dataProvider.setAllRefreshExcluded('potions', ...)` -> `...'craftables', ...)`
- `dataProvider.getExclusionStats('potions')` -> `...'craftables')`
- `exported.potions` -> `exported.craftables`
- `exported.potionCrafts` -> `exported.craftableRecipes`
- `dataProvider.potionCrafts` -> `dataProvider.craftableRecipes`
- `dataProvider.addPotionCraft(...)` -> `dataProvider.addCraftableRecipe(...)`
- Comments: "potionCraft", "potions(empty)" -> "craftableRecipe", "craftables(empty)"

### F. src/tests/composables/useSettingsManager.test.ts (1 rename)
- `potions: { 'potion-1': { price: 888 } }` -> `craftables: { 'craftable-1': { price: 888 } }`

### G. src/tests/mock-provider.test.ts (2 renames)
- `data.potions` -> `data.craftables`
- Comment: "Potions are now dynamically added..." -> "Craftables are now dynamically added..."

### H. src/storage/persistence.test.ts (1 rename)
- `'Health Potion'` test fixture name -> leave as-is (it's a game item name used as test data)

## Acceptance Criteria
- [ ] Test files renamed
- [ ] All test content updated
- [ ] Full test suite passes: `npx vitest run`
- [ ] Zero regressions from Phase 0 baseline


## Notes

**2026-02-27T20:37:20Z**

Phase 6 complete - all test files renamed and updated:

Files renamed (via git mv):
1. potionCalculator.test.ts -> craftableCalculator.test.ts
2. MarketTable.isUntrackedPotionRecipe.test.ts -> MarketTable.isUntrackedCraftableRecipe.test.ts

Files updated:
1. craftableCalculator.test.ts: All imports, types, variables, function calls
2. dungeonCalculator.test.ts: All potion references updated to craftable
3. MarketTable.isUntrackedCraftableRecipe.test.ts: All function names, types, variables
4. useDataProvider.test.ts: ~30 renames (potions -> craftables, potionCrafts -> craftableRecipes)
5. useSettingsManager.test.ts: Test fixture updated
6. mock-provider.test.ts: data.potions -> data.craftables

Test results: 228 passed (228) - ZERO REGRESSIONS from Phase 0 baseline!
