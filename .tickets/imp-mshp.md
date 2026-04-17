---
id: imp-mshp
status: closed
deps: []
links: []
created: 2026-03-04T17:36:52Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Magic Find configuration UI in Dungeons tab

Add a Magic Find configuration section at the top of the Dungeons sub-tab. Shows total MF as compact text with a collapsible card for editing streak, items, and bonus MF values. Dungeon MF is configured via a separate button next to the card that opens a selector for completed dungeons. Each completed dungeon adds +1 MF. The dungeon list includes all existing dungeons PLUS 6 additional MF-only dungeons: Silverleaf Enclave, Stone Hollow, Pumpkin Hollow, Wickedroot Patch, Winter Wonderland, Snowbound Forest. These 6 extra dungeons appear only in the MF selector, not in profit calculations.


## Notes

**2026-03-04T17:39:58Z**

## Planning Complete - Scouter Analysis

### Affected Files (by phase)

**Phase 1 - Data Layer:**
- NEW: src/composables/useMagicFindConfig.ts (composable for completed dungeons + MF state)

**Phase 2 - MagicFindPanel Component:**
- NEW: src/components/MagicFindPanel.vue (collapsible card UI)

**Phase 3 - DungeonSelector Component:**
- NEW: src/components/DungeonSelector.vue (dungeon picker modal)

**Phase 4 - Integration:**
- MODIFY: src/components/DungeonTable.vue (render MagicFindPanel + DungeonSelector)
- MODIFY: src/components/SettingsPanel.vue (remove MF Dungeon input)
- MODIFY: src/composables/useStorage.ts (make refs singleton per key for cross-component sync)

**Phase 5 - Tests:**
- NEW: src/tests/composables/useMagicFindConfig.test.ts
- NEW: src/tests/components/MagicFindPanel.test.ts
- NEW: src/tests/components/DungeonSelector.test.ts

### Dependency Graph
Phase 1 (data) -> Phase 2 (panel) + Phase 3 (selector) -> Phase 4 (integration) -> Phase 5 (tests)
Phases 2 and 3 can be developed in parallel after Phase 1.

### Key Risk: useStorage Singleton
CRITICAL: useStorage.ts creates a NEW ref per call. App.vue and useMagicFindConfig would get separate refs for 'magicFind'. Phase 4 must address this by making useStorage cache refs at module level (keyed by storage key). This is a small refactor but essential for correctness.

### Dungeon Inventory
- 18 profit-calculation dungeons (from defaults.json)
- 6 MF-only dungeons: Silverleaf Enclave, Stone Hollow, Pumpkin Hollow, Wickedroot Patch, Winter Wonderland, Snowbound Forest
- Total: 24 selectable dungeons

### No Breaking Changes
- Existing dungeonCalculator.ts needs NO changes (it already reads magicFind.dungeon)
- Existing App.vue profit calculation chain needs NO changes (reactive through useStorage)
- MF values in SettingsPanel still work for streak/item/bonus (only dungeon moves to the new UI)

**2026-03-04T17:59:16Z**

## Code Review: NEEDS FIXES

### Files Reviewed
- /home/felix/idle-mmo-profiter/src/composables/useMagicFindConfig.ts (new)
- /home/felix/idle-mmo-profiter/src/components/MagicFindPanel.vue (new)
- /home/felix/idle-mmo-profiter/src/components/DungeonSelector.vue (new)
- /home/felix/idle-mmo-profiter/src/composables/useStorage.ts (modified)
- /home/felix/idle-mmo-profiter/src/components/DungeonTable.vue (modified)
- /home/felix/idle-mmo-profiter/src/components/SettingsPanel.vue (modified)
- /home/felix/idle-mmo-profiter/src/tests/composables/useMagicFindConfig.test.ts (new)
- /home/felix/idle-mmo-profiter/src/components/__tests__/MagicFindPanel.test.ts (new)
- /home/felix/idle-mmo-profiter/src/components/__tests__/DungeonSelector.test.ts (new)
- /home/felix/idle-mmo-profiter/src/tests/calculators/dungeonCalculator.test.ts (modified)

### Tests: PASS (582/582 all passing)

### Linter: FAIL (3 errors)

---

### Issue 1: [Linter] Undefined global type reference
File: /home/felix/idle-mmo-profiter/src/components/DungeonSelector.vue
Line: 18
Problem: `'HTMLButtonElement' is not defined (no-undef)`. The `ref<HTMLButtonElement | null>` uses a browser global type that ESLint's `no-undef` rule flags without proper env configuration.
Suggestion: Add `// eslint-disable-next-line no-undef` above line 18, or type the ref differently. The same pattern is likely used elsewhere in the project -- check how other components handle typed template refs. Alternatively, since this is a TypeScript file and the type is valid, this may need an ESLint env update, but a line-level disable is the least invasive fix.

### Issue 2: [Linter] Unused import
File: /home/felix/idle-mmo-profiter/src/components/__tests__/DungeonSelector.test.ts
Line: 1
Problem: `'vi' is defined but never used (@typescript-eslint/no-unused-vars)`. The `vi` import from vitest is unused.
Suggestion: Remove `vi` from the import statement. Change:
  Current:   `import { describe, it, expect, beforeEach, vi } from 'vitest'`
  Suggested: `import { describe, it, expect, beforeEach } from 'vitest'`

### Issue 3: [Linter] Unused variable
File: /home/felix/idle-mmo-profiter/src/components/__tests__/MagicFindPanel.test.ts
Line: 356
Problem: `'initialTotal' is assigned a value but never used (@typescript-eslint/no-unused-vars)`. The variable `initialTotal` is computed but never referenced.
Suggestion: Either remove the declaration or use it in an assertion. In the test "should share state with other composable instances" around line 356, either:
  - Remove `const initialTotal = instance1.totalMF.value` if it was just there for debugging
  - Or add an assertion like `expect(instance1.totalMF.value).not.toBe(initialTotal)` after the mutation to verify the state actually changed

### Issue 4: [Best Practice] Duplicate Escape key handler
File: /home/felix/idle-mmo-profiter/src/components/DungeonSelector.vue
Lines: 78-83 and 117-121
Problem: The Escape key is handled in two separate places: once inside `handleModalKeydown` (line 79, attached to `.modal-content @keydown`) and again in a global `window` keydown listener (`handleKeydown`, line 117). This means pressing Escape fires TWO close attempts. The global listener also fires even when the modal is closed (it checks `props.modelValue` but still runs the event handler on every keypress globally).
Suggestion: Remove the global `window.addEventListener('keydown', handleKeydown)` block (lines 117-129) entirely. The `handleModalKeydown` on the modal content element already handles Escape correctly. Alternatively, if you want the global handler for cases where focus is outside the modal, remove the Escape handling from `handleModalKeydown` and keep only the global one. Having both is redundant and could cause double-emit of `update:modelValue`.

### Issue 5: [Best Practice] useStorage singleton cache is not cleared on removeStorage/clearAllStorage
File: /home/felix/idle-mmo-profiter/src/composables/useStorage.ts
Lines: 6, 90-101
Problem: When `removeStorage(key)` or `clearAllStorage()` is called, the `storageCache` Map is not cleaned up. The stale ref remains in the cache. This is currently safe because all callers (`resetToDefaults`, `resetAll`) reload the page afterward, but it's a latent bug if anyone calls `removeStorage` without reloading.
Suggestion: Add `storageCache.delete(key)` inside `removeStorage()`:
```typescript
export function removeStorage(key: string): void {
  const prefixedKey = STORAGE_PREFIX + key
  localStorage.removeItem(prefixedKey)
  storageCache.delete(key)  // Clear cached ref
}
```
And add `storageCache.clear()` inside `clearAllStorage()`. This is a minor defensive improvement, not blocking.

### Issue 6: [Accessibility] Summary row is not keyboard-activatable
File: /home/felix/idle-mmo-profiter/src/components/MagicFindPanel.vue
Line: 36
Problem: The `.summary-row` div has `@click="toggleExpanded"` but is not focusable and has no keyboard event handlers. Screen reader users and keyboard-only users cannot expand/collapse the panel by activating the summary row (they would need to click, which requires a mouse). The chevron button IS keyboard-accessible, but the entire row functions as a click target and should be accessible too.
Suggestion: Add `tabindex="0"`, `role="button"`, and `@keydown.enter="toggleExpanded"` / `@keydown.space.prevent="toggleExpanded"` to the `.summary-row` div. Alternatively, make the entire summary row a `<button>` element.

---

### Positive Observations

1. **Architecture**: The singleton pattern for `useMagicFindConfig` is well-implemented. Module-level state with a function that returns computed properties is clean and follows the existing `useDataProvider` pattern.

2. **useStorage singleton fix**: Correctly addresses the critical risk identified in planning. The cache keyed by unprefixed key is correct. The first caller's `defaultValue` wins, which is the right behavior.

3. **Reactivity chain**: The `watch` on `completedDungeonsSet` that writes back to `magicFind.value.dungeon` correctly bridges the new completed-dungeons UI to the existing profit calculator. The calculator reads `magicFind.dungeon` and needs no changes.

4. **MF-only dungeons isolation**: The 6 MF-only dungeons are defined only in `useMagicFindConfig.ts` and never added to `useDataProvider`'s dungeon list. They appear only in the DungeonSelector UI. Profit calculations remain unaffected.

5. **Design system compliance**: Components use `--surface-bg`, `--surface-border`, `--surface-radius`, `--surface-shadow`, `--ease-out`, `--text-primary`, `--text-secondary`, `--accent-primary`, `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--border-color` consistently. The `font-variant-numeric: tabular-nums` is applied on the breakdown summary.

6. **Touch targets**: All interactive elements meet the 44px minimum (desktop) and 48px minimum (mobile) touch target requirements per the design system.

7. **Focus management**: The DungeonSelector modal correctly traps focus, stores/restores previous focus, and has `focus-visible` outlines.

8. **Test coverage**: Comprehensive tests covering singleton behavior, reactivity, persistence, edge cases (corrupted localStorage, rapid toggling, empty names, case sensitivity), and Magic Find reactivity integration. 65 new tests across 4 test files, all passing.

9. **SettingsPanel update**: Clean removal of the dungeon MF input with a helpful redirect note. The note uses `aria-hidden="true"` on the emoji, which is correct.

10. **Modal UX**: Bottom-sheet pattern on narrow viewports (<380px), overlay click-to-close, focus trap, and pull indicator are all well-implemented.

---

### Summary
3 linter errors and 3 best-practice issues must be fixed. The linter errors are straightforward. The duplicate Escape handler (Issue 4) should definitely be resolved to prevent double-emit. The useStorage cache cleanup (Issue 5) is a defensive improvement worth making. The keyboard accessibility (Issue 6) should be addressed for WCAG compliance.

These must be fixed before proceeding.

**2026-03-04T17:59:38Z**

Review found 6 issues: 3 lint errors (unused imports/vars, HTMLButtonElement undef), duplicate escape handler in DungeonSelector, missing keyboard accessibility on MagicFindPanel summary row, useStorage cache not cleared on remove/clear.

**2026-03-04T18:52:51Z**

User Review: Bug - Dungeon profit not updating after MF changes. Need to investigate the reactive chain from MF settings to profit recalculation.

**2026-03-04T18:57:03Z**

Bug fix complete (imp-19b2): Dungeon profits now update correctly when MF settings change. Fixed by:
1. Explicitly accessing each magicFind property in App.vue computed to establish reactive dependencies
2. Using object spread in useMagicFindConfig watch to ensure reactivity triggers
All 584 tests passing.

**2026-03-04T18:59:09Z**

User Review: Perfect - work approved
