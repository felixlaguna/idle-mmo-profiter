---
id: imp-pyxq
status: closed
deps: [imp-ba32]
links: []
created: 2026-02-27T13:16:12Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-15ic
---
# Phase 3: Add deduplication guard to prevent re-tracking during bulk operation

During the bulk track-all operation, as each potion is tracked, it gets added to potionCrafts. The isUntrackedPotionRecipe function checks potionCrafts to determine if a recipe's potion is untracked. Since recipes can have both tradable and untradable variants that produce the same potion, we must ensure we don't try to track the same potion twice.

### Problem:
If two recipes (e.g., 'Health Potion Recipe' and 'Health Potion Recipe (Untradable)') both produce 'Health Potion', and both pass isUntrackedPotionRecipe at the start of the bulk operation, the loop could try to add the same potion twice.

### Solution:
In the trackAllUntrackedPotions function (from Phase 1), re-check isUntrackedPotionRecipe before each addUntrackedPotion call. Since addPotionCraft mutates the reactive potionCrafts array, subsequent calls to isUntrackedPotionRecipe will correctly return false for the already-tracked potion.

### Files to modify:

1. **src/components/MarketTable.vue** (trackAllUntrackedPotions function)
   - Inside the for loop, before calling addUntrackedPotion, add a guard:
     ```ts
     // Re-check: recipe may have been tracked by a sibling variant
     if (!isUntrackedPotionRecipe(recipe.name, recipe.producesItemName)) {
       continue // Already tracked by a previous iteration
     }
     ```
   - Adjust the progress counter to still increment even on skip, or track skip count separately for accurate toast message
   - Update summary toast to include skipped count if any: 'Tracked X potions (Y skipped as duplicates, Z failed)'

### Why this matters:
- The defaults.json recipes list includes both tradable and untradable variants for many potions
- Without this guard, the second variant would either fail (potion already exists) or create a duplicate entry
- The existing addUntrackedPotion does NOT check for this because it was designed for individual button clicks

### Testing approach:
- Manual test: ensure that when Track All runs, potions with both recipe variants are only tracked once
- The skip count in the toast message provides visibility into deduplication

## Acceptance Criteria

- Re-check guard prevents duplicate tracking during bulk operation
- Potions with both tradable and untradable recipe variants are tracked only once
- Summary toast accurately reflects tracked, skipped, and failed counts
- No duplicate entries in potionCrafts after bulk operation


## Notes

**2026-02-27T13:19:24Z**

Phase 3 complete: Added deduplication guard
- Re-checks isUntrackedPotionRecipe before each addUntrackedPotion call
- Tracks skipCount for duplicate recipe variants
- Updated summary toast to show skipped count
- Prevents tracking the same potion twice via tradable/untradable variants
