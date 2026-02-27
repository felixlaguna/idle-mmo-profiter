---
id: imp-ba32
status: closed
deps: []
links: []
created: 2026-02-27T13:15:22Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-15ic
---
# Phase 1: Add trackAllUntrackedPotions function in MarketTable.vue

Add a new async function 'trackAllUntrackedPotions' in MarketTable.vue that:

1. Collects all untracked potion recipes by filtering dataProvider.recipes.value through isUntrackedPotionRecipe()
2. Processes them sequentially (NOT in parallel) to respect the 20 req/min API rate limit
3. Calls the existing addUntrackedPotion() for each one, awaiting completion before starting the next
4. Tracks progress (current/total) in a new reactive ref for UI feedback
5. Tracks success/failure counts for a summary toast at the end
6. Has a loading state ref (trackAllLoading) to disable the button during processing
7. Shows a final summary toast: 'Tracked X of Y potions. Z failed.'
8. Skips recipes that have no hashedId (same validation as addUntrackedPotion already does)

### Files to modify:

1. **src/components/MarketTable.vue** (script section, around line 339-528)
   - Add new reactive refs:
     - trackAllLoading = ref(false)
     - trackAllProgress = ref({ current: 0, total: 0 })
   - Add new function trackAllUntrackedPotions():
     - Filter recipes: dataProvider.recipes.value.filter(r => isUntrackedPotionRecipe(r.name, r.producesItemName) && r.hashedId)
     - If none found, show info toast and return
     - Set trackAllLoading = true, trackAllProgress = { current: 0, total: filtered.length }
     - For each recipe (sequential for loop with await):
       - Increment trackAllProgress.current
       - try { await addUntrackedPotion(recipe) } catch { increment failCount }
     - Show summary toast
     - Set trackAllLoading = false

### Important considerations:
- Must process sequentially (for...of with await), NOT Promise.all, because each addUntrackedPotion makes 2-4 API calls and the rate limiter queues them
- The existing addUntrackedPotion already handles its own error catching and loading state per-recipe; the bulk function wraps this with additional progress tracking
- The hasApiKey check should gate the button in the template (Phase 2), but also guard the function entry

## Acceptance Criteria

- trackAllUntrackedPotions function exists and works
- Sequential processing respects rate limits
- Progress tracking refs are reactive
- Summary toast shows success/failure counts
- TypeScript compiles without errors


## Notes

**2026-02-27T13:19:01Z**

Phase 1 complete: Added trackAllUntrackedPotions function with:
- trackAllLoading and trackAllProgress reactive refs
- Sequential processing with for...of loop
- Success/failure count tracking
- Summary toast message
- Filters recipes by isUntrackedPotionRecipe and hashedId check
