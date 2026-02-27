---
id: imp-f6dm
status: closed
deps: []
links: []
created: 2026-02-27T17:27:49Z
type: bug
priority: 2
assignee: Félix Laguna Teno
parent: imp-15ic
---
# Fix: Handle items with no recipe data in addUntrackedPotion

## Problem

During bulk tracking ('Track All'), the item 'Aqua Reaper' (hashed_id: brz9RZnWN76DQKAp0Mdl, id: rec-313) fails because the inspect API returns an item of type FISHING_ROD with recipe: null. This item is not a craftable potion -- it is a fishing rod that happens to be in the recipes list (it is a fishing loot drop, not a crafting recipe).

The existing code at line 392 already checks for recipe: null and returns false, so the function does not crash. However, the item is incorrectly identified as an 'untracked potion' by isUntrackedPotionRecipe(), which causes:
1. It appears in the untracked count shown on the Track All button
2. It wastes an API call during bulk tracking just to discover it has no recipe
3. It shows as a 'failed' item in the summary toast, which is confusing

## Root Cause

inferPotionName('Aqua Reaper') returns 'Aqua Reaper' (the name does not end in 'Recipe' so nothing is stripped). Since 'Aqua Reaper' is not in potionCrafts, isUntrackedPotionRecipe() returns true. The item then passes all filtering in both untrackedPotionCount and trackAllUntrackedPotions.

The core issue is that isUntrackedPotionRecipe assumes all recipes in the list are craftable potion/item recipes, but some entries (like Aqua Reaper) are fishing loot items with no recipe data.

## Fix

Two-layer fix, both in /home/felix/idle-mmo-profiter/src/components/MarketTable.vue:

### Layer 1: Filter out non-recipe items at the source (preferred fix)
Update isUntrackedPotionRecipe() (line 313) to reject recipe names that do not end in 'Recipe' or 'Recipe (Untradable)'. The inferPotionName function strips 'Recipe' and '(Untradable)' suffixes. If the name does not contain 'Recipe' at all, inferPotionName returns the name unchanged -- but that does not mean it is actually a recipe that produces a craftable item.

Add a guard at the top of isUntrackedPotionRecipe:
- If producesItemName is not set AND the recipe name does not contain 'Recipe' (case-insensitive), return false
- This filters out items like 'Aqua Reaper', 'Brute', etc. that are fishing/loot drops, not crafting recipes
- Items that have producesItemName set (from a previous inspect/refresh) are still included regardless of name pattern

### Layer 2: Defensive handling in addUntrackedPotion (already exists but improve logging)
The check at line 392 (if (!recipeDetails?.recipe) return false) already handles this case. Optionally improve the console.error message to include the item type from the API response, making debugging easier.

## Files to modify
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue
  - isUntrackedPotionRecipe() function (line 313): Add name-pattern guard
  - Optionally: improve console.error at line 396 to log recipeDetails.type

## Affected code paths
- isUntrackedPotionRecipe() -- called by untrackedPotionCount computed, trackAllUntrackedPotions filter, template v-if for untracked badge and add button
- addUntrackedPotion() -- the recipe:null check at line 392 (existing, defensive)
- inferPotionName() -- not modified, but its behavior is central to understanding the bug

## Acceptance Criteria

- 'Aqua Reaper' and similar non-recipe items (names without 'Recipe') are excluded from the untracked potion count and Track All operation
- Items that have producesItemName already set are NOT excluded (they were previously inspected and confirmed as recipes)
- The Track All button count accurately reflects only actual craftable recipes
- No wasted API calls on non-recipe items during bulk tracking
- The individual '+' button still does NOT appear next to non-recipe items
- TypeScript compiles without errors
- All existing tests pass


## Notes

**2026-02-27T17:28:37Z**

Investigation: Root cause confirmed - isUntrackedPotionRecipe() at line 313 does not verify the recipe name contains 'Recipe'. For 'Aqua Reaper' (a FISHING_ROD), inferPotionName returns 'Aqua Reaper' unchanged, and since it's not in potionCrafts, the function returns true. The defensive check at line 392 prevents crashes but wastes API calls.

**2026-02-27T17:29:45Z**

Failing test created: MarketTable.isUntrackedPotionRecipe.test.ts - 3/12 tests fail, confirming bug. Tests show 'Aqua Reaper', 'Brute', and 'Steel Sword' are incorrectly identified as untracked potion recipes.

**2026-02-27T17:30:41Z**

Fix applied successfully:

Layer 1 (Root cause fix):
- Added guard in isUntrackedPotionRecipe() at line 313
- If producesItemName is not set AND recipe name doesn't contain 'Recipe', return false
- This filters out fishing loot items, equipment drops, etc. that aren't actual crafting recipes
- Items with producesItemName set (from previous inspect) are still included regardless of name

Layer 2 (Improved logging):
- Enhanced console.error at line 398 to include item type from API response
- Now logs: type field (e.g., 'FISHING_ROD') making debugging easier

Test results:
- Created 12 new tests in MarketTable.isUntrackedPotionRecipe.test.ts
- All tests verified: 3 failed before fix, all 12 pass after fix
- Total tests: 228/228 passing (was 216, added 12 new)
- Build: SUCCESS (TypeScript compiles, no errors)

Files modified:
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue (isUntrackedPotionRecipe function and addUntrackedPotion error logging)
- /home/felix/idle-mmo-profiter/src/tests/components/MarketTable.isUntrackedPotionRecipe.test.ts (new test file)

Bug fix verified:
- 'Aqua Reaper' and similar non-recipe items now correctly excluded from untracked potion count
- Track All button count now accurate (only shows actual craftable recipes)
- No wasted API calls on non-recipe items during bulk tracking
