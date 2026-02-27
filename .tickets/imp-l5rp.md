---
id: imp-l5rp
status: closed
deps: [imp-ba32]
links: []
created: 2026-02-27T13:15:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-15ic
---
# Phase 2: Add 'Track All' button UI in MarketTable.vue recipes section

Add a 'Track All Untracked Potions' button in the MarketTable.vue recipes section header, next to the existing section controls. Shows progress during bulk operation.

### Files to modify:

1. **src/components/MarketTable.vue** (template section, around line 1253-1295 — the recipes section header)
   - In the recipes section header div, add a new button after the existing section toggle/count area

2. **src/components/MarketTable.vue** (script section)
   - Add a new computed property untrackedPotionCount that counts recipes passing isUntrackedPotionRecipe and having a hashedId
   - This shows the count in the button label so the user knows how many will be tracked

3. **src/components/MarketTable.vue** (style section)
   - Add styles for .btn-track-all:
     - Similar to existing action buttons (green success color scheme)
     - padding: 0.375rem 0.75rem, border-radius: 0.375rem, font-size: 0.8rem
     - Disabled state: opacity 0.5, cursor not-allowed
     - Loading state: shows progress text

### Button behavior:
- v-if untrackedPotionCount > 0
- :disabled when \!hasApiKey || trackAllLoading
- Shows 'Track All (N)' when idle, 'Tracking X/Y...' when processing
- @click calls trackAllUntrackedPotions (from Phase 1)

### Button placement:
The button should appear in the recipes section header bar (line ~1253-1264), alongside the section toggle and item count. Visually distinct as an action button (green/success color).

### UX considerations:
- Button only appears when there are untracked potions (v-if)
- Shows count of untracked potions in label
- Disabled when no API key is configured
- During processing, shows progress text
- Disabled during processing to prevent double-clicks

## Acceptance Criteria

- Track All button appears in recipes section header when untracked potions exist
- Button shows count of untracked potions
- Button disabled without API key
- Progress indicator shows during bulk operation
- Button hidden when all potions are tracked
- Styling consistent with existing UI patterns


## Notes

**2026-02-27T13:20:33Z**

Phase 2 complete: Added Track All button UI
- Added untrackedPotionCount computed property
- Added Track All button in recipes section header
- Button shows count when idle, progress when tracking
- Button disabled without API key or during tracking
- Added btn-track-all styles (green success color scheme)
- Button only shows when untrackedPotionCount > 0
