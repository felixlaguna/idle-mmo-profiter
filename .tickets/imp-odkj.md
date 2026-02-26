---
id: imp-odkj
status: closed
deps: []
links: []
created: 2026-02-26T19:25:40Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: View/edit hashed ID of market items via modal button

Allow viewing and editing the hashed ID of items in the market so they can be corrected if wrong. Should be a small button that opens a modal - not always visible. This is for cases where the auto-detected hash ID is incorrect and needs manual correction.


## Notes

**2026-02-26T19:28:15Z**

## Planning Complete - Codebase Analysis

### Key Findings:

**hashedId already fully supported in the data layer:**
- All 4 item types (Material, Potion, Resource, Recipe) have hashedId?: string in their TypeScript interfaces (/home/felix/idle-mmo-profiter/src/types/index.ts)
- dataProvider.updateHashedId(category, id, hashedId) already exists and persists to localStorage (/home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts, line 328-349)
- useMarketRefresh.getHashedId() already reads hashedId from merged data and uses it for API calls (/home/felix/idle-mmo-profiter/src/composables/useMarketRefresh.ts, line 94-163)
- defaults.json has hashedId fields, currently empty strings for most items

**No backend/data layer changes needed.** This is purely a UI feature.

**Existing UI patterns to reuse:**
- Modal pattern: modal-overlay + modal-content-small from MarketTable.vue refresh estimate modal (line 371-412)
- Button pattern: btn-refresh-item (small inline SVG icon button, 14x14) in the Actions column
- Toast notifications via useToast composable
- CSS variables for theming (--bg-primary, --accent-primary, etc.)

### Affected Files:
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue (NEW)
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue (MODIFY - add button + modal integration)
- /home/felix/idle-mmo-profiter/src/types/index.ts (NO CHANGE - hashedId already defined)
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts (NO CHANGE - updateHashedId already exists)
- /home/felix/idle-mmo-profiter/src/composables/useMarketRefresh.ts (NO CHANGE - already consumes hashedId)

### Implementation Phases: 4 task tickets
- Phase 1 (imp-d4ny): Create HashedIdModal component
- Phase 2 (imp-defq): Add button to MarketTable item rows (depends on Phase 1)
- Phase 3 (imp-e8hx): Validation, toasts, edge cases (depends on Phase 2)
- Phase 4 (imp-8fpp): Responsive design / mobile (depends on Phase 3)

### Dependencies: Linear chain
Phase 1 -> Phase 2 -> Phase 3 -> Phase 4

### Risks:
- LOW: col-actions column width (60px) may be tight for 2 buttons; mitigation: increase to ~100px or use compact layout
- LOW: 345 recipe rows each getting a new button; mitigation: button is tiny and icon-only, minimal visual clutter
- NONE: Data layer risk; all save/load logic already exists and is tested

### Estimated Effort: Small feature
- Phase 1: ~30 min (new component, straightforward)
- Phase 2: ~30 min (repetitive across 4 sections but mechanical)
- Phase 3: ~15 min (validation/toast, mostly in HashedIdModal)
- Phase 4: ~15 min (responsive CSS tweaks)
Total: ~1.5 hours

### Notes:
- Phases 3 and 4 can realistically be merged into Phase 1 and 2 during implementation since they are small. They are separated for clarity of acceptance criteria.
- The implementer may combine phases if it makes sense.

**2026-02-26T19:35:26Z**

Implementation Complete - All 4 phases done

SUMMARY:
Successfully implemented feature for viewing/editing hashed IDs of market items via modal button.

FILES CREATED:
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue (new component)

FILES MODIFIED:
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue (added button, modal, handlers)

FEATURES IMPLEMENTED:
1. HashedIdModal component with full validation, keyboard support, and responsive design
2. '#' button added to all 4 market sections (materials, potions, resources, recipes)
3. Visual indicator (warning color) when hashed ID is missing
4. Toast notifications on save/clear (success/info)
5. Full responsive design for mobile with touch-friendly controls
6. Proper validation (trim whitespace, allow empty, no-op detection)
7. Reactivity: modal updates if item refreshed while open

TEST RESULTS:
- Build: SUCCESS (npm run build - no TypeScript errors)
- Tests: ALL PASSING (156/156 tests pass)
- No breaking changes to existing functionality

INTEGRATION:
- Integrates seamlessly with existing dataProvider.updateHashedId()
- Saved hashed IDs automatically used by useMarketRefresh.getHashedId()
- Persists to localStorage via existing override system

Ready for review and deployment.

**2026-02-26T19:37:50Z**

## Code Review: APPROVED (with minor suggestions)

Files reviewed:
- /home/felix/idle-mmo-profiter/src/components/HashedIdModal.vue (NEW - 330 lines)
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue (MODIFIED - diff adds ~200 lines)

### Build: PASS
- vue-tsc: No TypeScript errors
- vite build: Success (87 modules, 2.25s)

### Linter (ESLint): PASS
- No warnings or errors on either file

### Tests: ALL PASSING (156/156)
- 9 test files, 156 tests, 0 failures

### Style Guide / Pattern Compliance: COMPLIANT

The implementation follows existing project patterns very well:
- Uses the same modal-overlay / modal-content-small / modal-header-small / modal-body CSS class naming as the existing Refresh Estimate modal in MarketTable.vue
- btn-hashed-id styling mirrors btn-refresh-item (same padding, border-radius, inline-flex, transition)
- Uses CSS variables consistently (--bg-primary, --text-secondary, --border-color, --warning, --danger, etc.)
- Vue 3 Composition API with script setup lang=ts, defineProps, defineEmits
- Proper v-model:visible two-way binding pattern
- Toast integration via existing useToast composable
- Data persistence via existing dataProvider.updateHashedId()
- Responsive design with 768px breakpoint matching existing patterns

---

### Minor Suggestions (non-blocking)

These are quality observations, not blocking issues. The code is correct and safe to ship as-is.

**1. [Code Smell] HashedIdModal.vue:90,121 - Duplicate keydown handler**

The handleKeydown function is bound to both the modal-overlay div (line 90) AND the input element (line 121). When the user presses Enter or Escape while focused on the input, the handler fires twice due to event bubbling. This is functionally harmless because save() has an isValueChanged guard (idempotent on second call) and close() emitting update:visible=false twice is benign. However, it is a code smell.

Suggestion: Remove the @keydown from the overlay (line 90) since it is redundant -- the input is the only interactive element where keydown matters. Or alternatively, remove it from the input and rely only on the overlay-level handler via bubbling.

**2. [Minor] MarketTable.vue - hashedIdModalItem never reset to null**

Once openHashedIdModal is called, hashedIdModalItem is set to an object and never set back to null. The v-if="hashedIdModalItem" condition on the HashedIdModal component means the component stays mounted (though hidden via v-if="visible" inside it) after first use. This is not a bug -- the component is lightweight and the internal v-if="visible" correctly hides the DOM. But for perfect cleanup, hashedIdModalItem could be set to null when the modal closes.

**3. [CSS] MarketTable.vue:1602-1608 - display:flex on td element**

The .col-actions class now has display:flex applied to td elements. While this works in modern browsers, applying display:flex to a table cell overrides the default display:table-cell behavior and can cause subtle layout inconsistencies with column width calculation in some edge cases. In practice, this is fine for the two small icon buttons and is a common pattern. Just noting it for awareness.

**4. [DRY] MarketTable.vue - Repeated SVG hash icon across 4 sections**

The 23-line SVG block for the hash icon (#) is duplicated identically in all 4 category sections (materials, potions, resources, recipes). This is consistent with how the existing refresh button SVG is also duplicated. However, both could benefit from being extracted into a small icon component or a slot in the future. This is not a regression -- the pattern matches the existing approach.

---

### Summary

The implementation is clean, well-structured, and integrates seamlessly with existing code patterns. It correctly leverages the existing data layer (dataProvider.updateHashedId, useMarketRefresh.getHashedId) without modification. Edge cases are handled (empty values, trimming, no-op detection, warning states). Responsive design is thorough with mobile-friendly touch targets and iOS zoom prevention. The code is ready to ship.

**Verdict: APPROVED for merge.**

**2026-02-26T19:38:13Z**

Reviewer: APPROVED. Build/lint/tests all pass (156/156). Minor non-blocking suggestions noted (duplicate keydown handler, modal item not reset to null on close). No blocking issues.

**2026-02-26T19:41:21Z**

User Review: Minor styling issue - the '#' button has a visible border/box making it too prominent. It should be more subtle and match the refresh button style (icon-only, no border).

**2026-02-26T19:42:23Z**

User clarification: The issue is NOT just the '#' button - it's the non-continuous padding/border around BOTH the refresh and hash buttons in the Actions column. They look disconnected rather than being part of a cohesive cell layout.

**2026-02-26T19:44:33Z**

Fixed styling issue in Actions column.

PROBLEM:
- The col-actions td cells had display:flex which overrode display:table-cell
- This caused disconnected padding/borders around the two buttons (refresh and hash)
- Buttons had visible borders making them too prominent

SOLUTION:
- Removed display:flex from .col-actions td element (restored table-cell behavior)
- Wrapped both buttons in .actions-wrapper div with flex styling
- Removed borders from both .btn-refresh-item and .btn-hashed-id (border:none)
- Reduced gap between buttons from 0.5rem to 0.25rem for more compact layout
- Made hover states subtle (no borders, just background color change)
- Updated responsive design to apply flex-direction:column to wrapper instead of td

FILES MODIFIED:
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue

CSS CHANGES:
- .col-actions: removed display:flex, gap, align-items, justify-content
- .actions-wrapper (NEW): display:flex, gap:0.25rem, align/justify center
- .btn-refresh-item: border changed from 1px solid to none
- .btn-hashed-id: border changed from 1px solid to none
- Removed border-color from all hover states
- Mobile responsive: flex-direction:column on wrapper instead of td

RESULT:
- Buttons now sit naturally within table cell with continuous padding
- No visual separation artifacts between buttons
- Both buttons subtle and icon-only (no borders)
- Clean, cohesive cell layout matching original refresh-only design

BUILD: SUCCESS (npm run build)
TESTS: ALL PASSING (156/156)

**2026-02-26T19:45:25Z**

User Review: Perfect - styling fix approved. Work complete.
