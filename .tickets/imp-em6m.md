---
id: imp-em6m
status: closed
deps: [imp-48u4, imp-1zoi]
links: []
created: 2026-02-28T23:46:30Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-84k1
tags: [component, ui, market, api]
---
# Remove all API/refresh/edit controls from MarketTable in static mode

## Phase 4: Strip MarketTable of all interactive/API-dependent UI in static mode

### Summary
MarketTable.vue is the heaviest API-dependent component. It contains bulk refresh controls, per-item refresh buttons, hashed ID editing, exclude/include checkboxes, API key warnings, and "Track All Craftable Recipes" functionality. In static mode, MarketTable should become a simple read-only price reference table.

### Current interactive elements in MarketTable (all must be hidden in static mode)

**Header/toolbar area:**
- API key warning banner (`v-if="!hasApiKey"`)
- "Refresh All Prices" button with estimate modal
- Refresh progress bar
- "Track All Craftable Recipes" button
- Cancel refresh button
- Refresh error summary

**Per-item row elements:**
- Hashed ID display/edit icon (triggers HashedIdModal)
- Per-item "🔄" refresh button
- Exclude/include checkbox for bulk refresh
- EditableValue for prices (already handled by Phase 2)

**Related modal:**
- HashedIdModal (triggered from MarketTable rows)

### What to implement

**Modify `src/components/MarketTable.vue`:**
- Import `useStaticMode` composable
- Wrap ALL of the above interactive elements in `v-if="!isStaticMode"`:

1. **API key warning banner:** `v-if="!hasApiKey && !isStaticMode"`
2. **Refresh All Prices button:** `v-if="!isStaticMode"`
3. **Track All Craftable Recipes button:** `v-if="!isStaticMode"`
4. **Refresh progress section:** `v-if="isRefreshing && !isStaticMode"`
5. **Refresh estimate modal:** `v-if="showRefreshEstimate && !isStaticMode"`
6. **Refresh error summary:** `v-if="refreshErrors.length > 0 && !isStaticMode"`
7. **Per-row hashed ID icon/button:** `v-if="!isStaticMode"`
8. **Per-row refresh button:** `v-if="!isStaticMode"`
9. **Per-row exclude checkbox:** `v-if="!isStaticMode"`
10. **HashedIdModal component:** `v-if="hashedIdModalVisible && !isStaticMode"`

The table should still display all items with their current prices as read-only data.

### Files to modify
- MODIFY: `src/components/MarketTable.vue`

### Components that become dead code in static mode:
- `HashedIdModal.vue` (never rendered from MarketTable)

### Acceptance criteria
- [ ] In normal mode: MarketTable works exactly as before (no regression)
- [ ] In static mode: No refresh buttons (single or bulk)
- [ ] In static mode: No API key warning
- [ ] In static mode: No hashed ID editing icons
- [ ] In static mode: No exclude/include checkboxes
- [ ] In static mode: No "Track All Craftable Recipes" button
- [ ] In static mode: HashedIdModal is never rendered
- [ ] In static mode: Prices display as read-only (via Phase 2's EditableValue changes)
- [ ] In static mode: Table still shows all items with prices correctly
- [ ] All existing tests pass

