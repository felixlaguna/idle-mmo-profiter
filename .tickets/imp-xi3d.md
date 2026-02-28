---
id: imp-xi3d
status: closed
deps: [imp-n8d2]
links: []
created: 2026-02-27T22:11:38Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-259e
tags: [fix, data-provider]
---
# Fix: Ensure exportAsDefaultsJson bakes hashedIds into craftables

## Fix Task: Export Function

### Problem
The `exportAsDefaultsJson()` function in `useDataProvider.ts` (lines 815-821) maps craftables from `craftables.value`, which should include user overrides (including hashedIds). However, the craftable entries in `defaults.json` all have `hashedId: ''` (0/311 have populated values), suggesting either:
1. The user overrides are not being applied correctly to craftables at export time
2. The hashedIds were never set for craftables in user overrides

### Changes Required

**File: `/home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts`**

1. **Verify the export path correctly picks up overrides for craftables**: 
   - `craftables` computed (line 249-251) calls `applyOverrides(defaults.value.craftables, userOverrides.value.craftables)`
   - `applyOverrides` matches by `id` field
   - Confirm that user override keys match the craftable IDs in `defaults.value.craftables`

2. **If IDs mismatch is the cause**: The craftableRecipes sync on lines 183-211 generates IDs with `craft-auto-{Date.now()}-{random}`. These IDs are non-deterministic. If the app is reloaded (after copy), Date.now() produces different timestamps, but the sync only runs for craftables NOT already in defaults. Since exported defaults.json includes the craftables, the sync should NOT regenerate them. However, if it DOES (e.g., due to name mismatch), the IDs change and user overrides are orphaned.

3. **Potential fix approaches**:
   a. Make craftable IDs deterministic (e.g., based on name slug) so they survive reloads
   b. Ensure the export function bakes ALL override data directly into the exported JSON so user overrides are no longer needed after copy
   c. Add a name-based fallback lookup in applyOverrides for craftables

### Acceptance Criteria
- [ ] After exporting defaults.json and copying it to `src/data/defaults.json`, craftable hashedIds are preserved
- [ ] The export function produces craftable entries with non-empty hashedIds when user overrides contain them
- [ ] Existing user overrides are correctly matched to craftable entries


## Notes

**2026-02-27T22:22:23Z**

Closed: Not needed as a separate fix. The export function already works correctly — it faithfully exports whatever hashedId values are present. The issue is that hashedIds are empty at the source (craftable generation), not in the export step. The fix in imp-40gu will ensure hashedIds are populated before export.
