---
id: imp-84k1
status: closed
deps: []
links: []
created: 2026-02-28T23:43:48Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Build-time static mode - remove all API/edit/settings UI for GitHub Pages deployment

The vote hack for accessing the idlemmo API won't work on GitHub Pages (no CORS header control). Need a build-time environment variable that, when set, removes all edit buttons, settings panels, and anything related to the API or customizing data. The goal is to produce a functionally static page for deployment. All interactive/API-dependent UI elements should be conditionally excluded at build time.


## Notes

**2026-02-28T23:45:21Z**

## Scouter Analysis: Build-time Static Mode

### Architecture Summary
- Build system: Vite 7.x + Vue 3 + TypeScript
- Existing env var support: VITE_API_BASE_URL, VITE_ALLOWED_HOSTS
- Deployment: GitHub Pages via GitHub Actions (deploy.yml)
- The Vite dev server has a proxy at /api that forwards to https://api.idle-mmo.com (the "vote hack" - works in dev because Vite proxy rewrites CORS headers, but impossible on static GitHub Pages)

### Affected Files Inventory

**[A] Components with Edit/Interactive UI (must be conditionally rendered):**
1. /src/components/EditableValue.vue - Inline editable values (pencil icon, click-to-edit). Used in SettingsPanel, CraftableTable, ResourceTable, DungeonTable, MarketTable
2. /src/components/SettingsPanel.vue - Full settings panel (magic find, tax rate, import/export, reset)
3. /src/components/ApiKeyInput.vue - API key input, validation, rate limit display
4. /src/components/HashedIdModal.vue - Modal to edit hashed IDs + refresh item data from API
5. /src/components/DataProviderStatus.vue - Shows API vs default data status
6. /src/components/MarketTable.vue - Contains refresh buttons, hashed ID editing, API key checks, bulk refresh, track/untrack, "Refresh All Prices" button - the heaviest API-dependent component

**[B] Parent component orchestrating interactive elements:**
7. /src/App.vue - Settings gear button in header, settings modal, overrideStats badge on Market tab

**[C] API layer (should be dead code in static mode but referenced by components):**
8. /src/api/client.ts - Rate-limited API client singleton
9. /src/api/services.ts - API service methods (search, inspect, market history)
10. /src/api/mock.ts - Mock/API data providers
11. /src/api/cache.ts - localStorage-based API response cache
12. /src/api/index.ts - Re-exports

**[D] Composables with API/edit dependencies:**
13. /src/composables/useApiKeyValidation.ts - API key validation logic
14. /src/composables/useMarketRefresh.ts - Market price refresh from API
15. /src/composables/useSettingsManager.ts - Settings import/export/reset
16. /src/composables/useDataProvider.ts - Data provider with user overrides (localStorage-based edits)

**[E] Storage layer:**
17. /src/storage/persistence.ts - StorageManager for API key + settings

**[F] Build configuration:**
18. /vite.config.ts - Vite config with API proxy
19. /src/vite-env.d.ts - Vite environment type declarations
20. /.github/workflows/deploy.yml - GitHub Pages deployment workflow

### What Needs to Happen Per Component

[EditableValue.vue] In static mode:
- Show value as plain text (no click-to-edit, no pencil icon, no reset button)
- OR: conditionally exclude the component entirely and use plain spans

[SettingsPanel.vue + ApiKeyInput.vue] In static mode:
- Hide the entire settings button in App.vue header
- Hide the entire settings modal
- SettingsPanel and ApiKeyInput become unreachable dead code

[HashedIdModal.vue] In static mode:
- Never shown - the hashed ID edit buttons in MarketTable trigger this
- All hashed ID edit icons/buttons in MarketTable must be hidden

[MarketTable.vue] In static mode:
- Hide: refresh buttons (single + bulk), "Refresh All Prices", "Track All Craftable Recipes"
- Hide: hashed ID edit icons, exclude/include toggle checkboxes
- Hide: API key warning banner
- Keep: display of item names + prices (read-only)

[CraftableTable.vue] In static mode:
- Hide: delete craftable button (X button)
- EditableValue becomes read-only display

[DungeonTable.vue] In static mode:
- EditableValue becomes read-only display

[ResourceTable.vue] In static mode:
- EditableValue becomes read-only display

[App.vue] In static mode:
- Hide: settings gear button
- Hide: settings modal
- Hide: override stats badge on Market tab

### Proposed Approach: Composable + Conditional Rendering
- Create a composable useStaticMode() that reads VITE_STATIC_MODE at build time
- In each component, wrap interactive elements in v-if="!isStaticMode"
- For EditableValue, add a prop or use the composable to render as plain text
- Update deploy.yml to set VITE_STATIC_MODE=true during the GitHub Pages build

**2026-02-28T23:47:39Z**

## Planning Complete

### Task Breakdown (7 tickets)

| ID | Phase | Title | Dependencies |
|---|---|---|---|
| imp-48u4 | 1 | Create useStaticMode composable and VITE_STATIC_MODE env var | None (starting point) |
| imp-1zoi | 2 | Make EditableValue support read-only static mode | imp-48u4 |
| imp-kkeb | 3 | Hide settings button, settings modal, and API key UI in static mode | imp-48u4 |
| imp-em6m | 4 | Remove all API/refresh/edit controls from MarketTable in static mode | imp-48u4, imp-1zoi |
| imp-h9na | 5 | Hide delete buttons in CraftableTable in static mode | imp-48u4 |
| imp-4jqk | 6 | Update GitHub Pages deploy workflow to set VITE_STATIC_MODE=true | imp-48u4 |
| imp-ow1l | 7 | Add static mode tests and verify bundle size reduction | All above |

### Dependency Structure
Phase 1 (composable) is the foundation — everything depends on it.
Phases 2-6 can be done in parallel after Phase 1 (except Phase 4 needs Phase 2 first).
Phase 7 (testing) depends on all other phases.

```
Phase 1 (composable)
├── Phase 2 (EditableValue) ─┐
├── Phase 3 (Settings/App)   ├── Phase 7 (Tests)
├── Phase 4 (MarketTable) ──┤
├── Phase 5 (CraftableTable) │
└── Phase 6 (deploy.yml) ───┘
```

### Risks and Mitigations
1. **Bundle size**: Even in static mode, unused components are imported. Mitigation: Use dynamic imports for SettingsPanel in App.vue so tree-shaking works. Moderate priority.
2. **Test environment**: Vitest may not pick up VITE_STATIC_MODE by default. Mitigation: Use vi.stubEnv() in tests. Low risk.
3. **Vite proxy still in config**: The Vite dev server proxy config for /api stays in vite.config.ts regardless — it only affects dev mode, not production builds. No risk.
4. **localStorage writes in static mode**: Components like useDataProvider still read/write to localStorage. This is fine — it doesn't break anything, and the user just can't see the edit UI. No risk.

### Design Decision: Why conditional rendering (v-if) instead of separate build targets?
- Simpler — one codebase, one build pipeline
- Vite's dead code elimination handles removing unused branches
- Lower maintenance burden than maintaining two separate component trees
- Consistent with Vue's standard patterns

### Estimated Effort
- Phase 1: ~15 min (small file creation)
- Phase 2: ~20 min (EditableValue template changes)
- Phase 3: ~15 min (App.vue v-if additions)
- Phase 4: ~30 min (MarketTable has many interactive elements)
- Phase 5: ~10 min (single button hide)
- Phase 6: ~10 min (one line in deploy.yml)
- Phase 7: ~30 min (tests + verification)
- **Total: ~2-3 hours**

Ready for user approval.

**2026-02-28T23:59:19Z**

Implementation complete!

All tickets completed:
✅ imp-48u4 - useStaticMode composable + VITE_STATIC_MODE env var
✅ imp-1zoi - EditableValue read-only mode
✅ imp-kkeb - Settings button + modal hidden
✅ imp-h9na - CraftableTable delete buttons hidden
✅ imp-4jqk - deploy.yml updated with VITE_STATIC_MODE=true
✅ imp-em6m - MarketTable API/refresh/edit controls hidden
✅ imp-ow1l - Tests added + build verification

Files modified:
- /home/felix/idle-mmo-profiter/src/composables/useStaticMode.ts (NEW)
- /home/felix/idle-mmo-profiter/src/vite-env.d.ts
- /home/felix/idle-mmo-profiter/.env.example
- /home/felix/idle-mmo-profiter/src/components/EditableValue.vue
- /home/felix/idle-mmo-profiter/src/App.vue
- /home/felix/idle-mmo-profiter/src/components/CraftableTable.vue
- /home/felix/idle-mmo-profiter/.github/workflows/deploy.yml
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue
- /home/felix/idle-mmo-profiter/src/tests/composables/useStaticMode.test.ts (NEW)

Tests: All passing (552/552)
Build verification: ✅ Both normal and static builds compile successfully

The GitHub Pages deployment will now render as a read-only static page with:
- No settings button or modal
- No API key input
- No edit buttons or pencil icons
- No refresh buttons
- No hashed ID editing
- No exclude/include checkboxes
- All values display as plain text (read-only)

**2026-02-28T23:59:56Z**

Implementation complete: All 7 tickets (imp-48u4 through imp-ow1l) implemented. 552/552 tests pass. Build succeeds in both normal and static modes. 9 files changed (2 new). Now proceeding to review.

**2026-03-01T00:02:39Z**

Review: Static Mode Feature - APPROVED ✅

## Summary
Clean, well-structured implementation. 552/552 tests pass, ESLint clean, TypeScript type-checking passes.

## Composable (useStaticMode.ts) — ✅ Good
- Simple, focused: reads `import.meta.env.VITE_STATIC_MODE === 'true'` and returns a plain boolean.
- Returns a non-reactive boolean (not a ref), which is correct since env vars are compile-time constants — Vite replaces them at build time, enabling dead-code elimination.
- Good JSDoc comment explaining the purpose.

## Tests (useStaticMode.test.ts) — ✅ Good
- Covers 4 cases: unset, "false", "true", and arbitrary string ("yes"). Proper use of `vi.stubEnv()` and `vi.unstubAllEnvs()` cleanup.
- One minor gap: no component-level integration tests verifying the v-if branches render correctly in static vs normal mode. Acceptable for this scope since it's straightforward conditional rendering.

## Type Declarations (vite-env.d.ts) — ✅ Good
- `VITE_STATIC_MODE?: string` correctly typed as optional.

## .env.example — ✅ Good  
- Well-documented with clear explanation. Commented out by default (won't accidentally activate).

## EditableValue.vue — ✅ Good
- Clean separation: `v-if="isStaticMode"` renders a plain `.static-value` div; `v-else` renders the full interactive UI.
- Dedicated `.static-value` CSS class with matching styles. No edit affordances leak through.
- `v-if/v-else` is the correct choice here (not `v-show`) since in static mode the editing DOM is never needed.

## App.vue — ✅ Good
- Settings gear button: `v-if="!isStaticMode"` — correct.
- Settings modal: `v-if="showSettings && !isStaticMode"` — correct, double-guarded.
- Market tab override badge: `v-if="overrideStats.total > 0 && !isStaticMode"` — correct.
- Keyboard shortcut (Escape): `!isStaticMode` guard — correct.
- **Note**: SettingsPanel is still statically imported (not lazy-loaded). It won't be tree-shaken by Vite since it's imported at module level. This is fine for correctness but is a minor bundle-size opportunity for the future.

## CraftableTable.vue — ✅ Good
- Delete button (✕): `v-if="!isStaticMode"` — correct.
- EditableValue components for material prices, craft time, and market prices will naturally render in read-only mode via EditableValue's internal static mode handling. No double-gating needed.

## MarketTable.vue — ✅ Thorough
This was the most complex file. All interactive elements correctly gated:
- Override count stats: hidden with `v-if="!isStaticMode"`
- Exclusion count stats: hidden with `v-if="!isStaticMode"`
- "Refresh All Prices" button: `v-if="!isStaticMode"`
- "Reset All" button: `v-if="!isStaticMode"`
- Refresh progress bar: `v-if="marketRefresh.isRefreshing.value && !isStaticMode"`
- Refresh estimate modal: `v-if="showRefreshEstimate && !isStaticMode"`
- HashedIdModal: `v-if="hashedIdModalItem && !isStaticMode"`
- Section-level: all 4 sections (materials, craftables, resources, recipes) have:
  - Override/exclusion badges: hidden
  - Section action buttons (Toggle Exclusion, Reset Section): hidden via `v-if="!isStaticMode"` on container div
  - Table "Exclude" column header and cells: `v-if="!isStaticMode"`
  - Table "Actions" column header and cells: `v-if="!isStaticMode"`
- Recipes section: "Track All" button and Track All progress correctly gated
- **Consistent pattern**: all `v-if` checks use the same `!isStaticMode` guard across the component.

## deploy.yml — ✅ Good
- `docker compose run --rm -e VITE_STATIC_MODE=true app npm run build` — env var correctly passed to the Docker container via `-e` flag.
- Clear comment explaining the purpose.

## Potential Issues / Minor Observations

1. **No missed interactive elements detected.** DungeonTable and ResourceTable use EditableValue (which handles static mode internally). ProfitRankingTable only has filter toggles (appropriate to keep in static mode). PriceHistoryChart is data-driven with no interactive controls.

2. **`isStaticMode` is a plain boolean, not a ref.** This is intentional and correct — since it's compile-time, reactivity isn't needed. Template `v-if` bindings on non-reactive values work fine in Vue 3 (they evaluate once). However, calling `useStaticMode()` in each component creates a new binding each time. Could alternatively use a module-level constant, but the composable pattern is consistent with the codebase style. No issue.

3. **SettingsPanel still imported in App.vue even in static mode.** The component module is loaded but never rendered. Vite's production build won't tree-shake it since it's a static import. Low priority — could use `defineAsyncComponent` gated on `!isStaticMode` for marginal bundle savings.

4. **MarketTable still initializes `useMarketRefresh()` and computes API-related state (hasApiKey, refreshEstimate, etc.) in static mode.** These computations run but their results are never displayed. Negligible runtime cost. A future optimization could skip these initializations entirely via early returns in the composables when static mode is active, but it's not necessary now.

5. **`v-if` vs `v-show`**: All instances correctly use `v-if` (not `v-show`), which is appropriate since these elements should be completely excluded from the DOM in static mode, not just visually hidden.

## Verdict
**APPROVED.** The implementation is clean, consistent, thorough, and well-tested. All interactive elements are properly gated. The deploy workflow is correctly configured. No functional issues found.

**2026-03-01T00:03:04Z**

Review: APPROVED. 552/552 tests pass, ESLint clean, TypeScript clean. No missed interactive elements. All v-if checks consistent. Code quality good.

**2026-03-01T00:04:25Z**

Pushed to master (dab6f80). GitHub Pages deploy will build in static mode automatically.

**2026-03-01T00:07:13Z**

User confirmed: deployed site works great at https://felixlaguna.github.io/idle-mmo-profiter/ — all tickets closed.
