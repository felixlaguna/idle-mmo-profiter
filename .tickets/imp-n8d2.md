---
id: imp-n8d2
status: closed
deps: []
links: []
created: 2026-02-27T22:11:23Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-259e
tags: [investigation, bug]
---
# Investigate: Trace export-to-defaults data flow for craftable hashedIds

## Investigation Task

### Objective
Reproduce and confirm the exact point where craftable hashedIds are lost during the export-to-defaults → copy workflow.

### Steps
1. **Set up repro environment**: Start the app fresh. Manually set hashedIds on a few craftable items via the Hashed ID modal in the Market tab. Verify user overrides contain the hashedIds in localStorage.

2. **Export defaults.json**: Click 'Export defaults.json' in Settings. Open the exported file and verify:
   - Do craftable entries have their hashedIds populated?
   - Are the craftable IDs still `craft-auto-*` format?
   - Compare with the in-memory `craftables.value` computed property

3. **Copy and reload**: Copy the exported defaults.json to `src/data/defaults.json`. Reload the app. Check:
   - Do craftables in the Market tab show their hashedIds?
   - Are the IDs in defaults.json matching the keys in localStorage user overrides?
   - Does the craftableRecipes sync loop (lines 183-211) regenerate craftables with NEW IDs?

4. **Key hypothesis to test**: The craftableRecipes sync generates craftables with `craft-auto-{Date.now()}-{random}` IDs. After export+copy:
   - If craftables are now in defaults.json, they won't be re-generated (name check passes)
   - But if for some reason the sync DOES regenerate them, they'd get NEW random IDs
   - Those new IDs wouldn't match the user override keys → hashedIds lost

### Files to Investigate
- `src/composables/useDataProvider.ts` lines 176-211 (craftableRecipes sync)
- `src/composables/useDataProvider.ts` lines 804-886 (exportAsDefaultsJson)
- `src/composables/useDataProvider.ts` lines 249-251 (craftables computed)
- `src/composables/useDataProvider.ts` lines 221-239 (applyOverrides)

### Expected Output
A clear description of exactly which step loses the hashedIds and why, with evidence from repro testing.


## Notes

**2026-02-27T22:22:23Z**

Closed: Investigation complete. Root cause identified — craftables get hashedId: '' hardcoded in the sync loop (line 206). The fix is to carry over producesItemHashedId from the matching recipe. See epic imp-259e updated notes.
