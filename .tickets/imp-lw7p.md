---
id: imp-lw7p
status: closed
deps: [imp-l5rp, imp-pyxq]
links: []
created: 2026-02-27T13:16:28Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-15ic
---
# Phase 4: Add cancel/abort support for bulk Track All operation

Allow the user to cancel the bulk Track All operation mid-way, since it can take a long time with many untracked potions (each requiring 2-4 API calls at 20 req/min rate limit).

### Files to modify:

1. **src/components/MarketTable.vue** (script section)
   - Add a new ref: trackAllAborted = ref(false)
   - In trackAllUntrackedPotions, check trackAllAborted.value at the start of each loop iteration:
     ```ts
     if (trackAllAborted.value) {
       showToast(`Cancelled. Tracked ${successCount} of ${total} potions.`, 'info')
       break
     }
     ```
   - Add a new function cancelTrackAll():
     ```ts
     const cancelTrackAll = () => { trackAllAborted.value = true }
     ```
   - Reset trackAllAborted to false at the start of trackAllUntrackedPotions

2. **src/components/MarketTable.vue** (template section)
   - When trackAllLoading is true, show a Cancel button next to the progress text:
     ```html
     <button
       v-if="trackAllLoading"
       class="btn-cancel-track"
       @click="cancelTrackAll"
     >
       ✕ Cancel
     </button>
     ```

3. **src/components/MarketTable.vue** (style section)
   - Add styles for .btn-cancel-track (red/danger color scheme, small button)

### UX rationale:
With 20+ untracked potions, each requiring ~3 API calls, and a 20 req/min rate limit, bulk tracking could take several minutes. The user should be able to cancel and keep the potions that were already tracked.

### Already-tracked potions are kept:
Cancellation just stops the loop. Potions tracked before cancellation are already persisted to localStorage via addPotionCraft, so they survive.

## Acceptance Criteria

- Cancel button appears during bulk tracking operation
- Clicking Cancel stops processing after the current potion completes
- Already-tracked potions are preserved
- Summary toast reflects partial completion
- trackAllAborted is reset on new Track All click


## Notes

**2026-02-27T13:21:35Z**

Phase 4 complete: Added cancel/abort support
- Added trackAllAborted ref
- Added cancelTrackAll function to set abort flag
- Updated trackAllUntrackedPotions to check abort flag at start of each loop iteration
- Added Cancel button in UI that appears during tracking
- Added track-all-progress container and btn-cancel-track styles
- Cancel stops processing and shows partial completion toast
- Already-tracked potions are preserved when cancelled
