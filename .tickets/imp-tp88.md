---
id: imp-tp88
status: closed
deps: [imp-dx85]
links: []
created: 2026-02-27T20:24:42Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-yvyo
tags: [refactor, scripts, docs]
---
# Phase 7: Rename scripts and documentation

## Purpose
Update build/utility scripts and documentation files. These are lower-risk since they don't affect runtime, but should be consistent.

## Files & Renames

### A. File rename
- `scripts/link-recipes-to-potions.js` -> `scripts/link-recipes-to-craftables.js`

### B. scripts/link-recipes-to-craftables.js (~20 renames)
- Comment: "link recipes to the potions they produce" -> "link recipes to the craftables they produce"
- `data.potionCrafts` -> `data.craftableRecipes`
- `potionNames` -> `craftableNames`
- All comments: "potion" -> "craftable" (but keep in-game name patterns like "Potion Name Recipe" since those are regex patterns matching actual game data)
- Console logs: "Linked recipes to potions" -> "Linked recipes to craftables"
- NOTE: The regex patterns like `/^(.+?) Potion Recipe/` match GAME DATA and must NOT be changed.

### C. scripts/populate-hashed-ids.ts (~10 renames)
- Interface: `potions: Item[]` -> `craftables: Item[]` (line 44)
- `data.potions` -> `data.craftables` (lines 277, 299, 303)
- `processedPotions` -> `processedCraftables` (lines 298, 301, 303)
- Console: "Processing Potions" -> "Processing Craftables"
- Console: "Potions: ..." -> "Craftables: ..."

### D. scripts/generate-defaults-json.js (~15 renames)
- Comment: "Potions (columns F-G...)" -> "Craftables (columns F-G...)"
- `const potions = []` -> `const craftables = []` (line 39)
- `potions.push(...)` -> `craftables.push(...)` (line 44)
- `potionsSheet` -> `craftablesSheet` (line 131)
  - BUT the Excel sheet is still named "Potions" in the workbook! So: `workbook.Sheets['Potions']` must STAY as-is (it references the actual sheet tab name)
- `potionsData` -> `craftablesData` (line 132)
- `potionCrafts` -> `craftableRecipes` (lines 145, 182)
- Output key: `potions` -> `craftables` (line 226)
- Output key: `potionCrafts` -> `craftableRecipes` (line 230)
- Console: "potions", "potion crafts" -> "craftables", "craftable recipes"

### E. scripts/update-recipe-fields.js (~5 renames)
- Comment: "potionCrafts" -> "craftableRecipes"
- `data.potionCrafts` -> `data.craftableRecipes` (line 63)
- Loop var: `potion` -> `craftable`

### F. scripts/add-market-fields.js (~3 renames)
- Comment: "potions" -> "craftables"
- `data.potions` -> `data.craftables` (line 27)
- Console: "Potions:" -> "Craftables:"

### G. Documentation files (content updates only)
- `ARCHITECTURE.md` — replace "Potion"/"potion" code references with "Craftable"/"craftable" (but keep in-game names). Major sections affected:
  - Data flow diagrams
  - Interface definitions shown in docs
  - Function name references
- `ARCHITECTURE_BEFORE_AFTER.md` — same treatment
- `BUG_FIX_SUMMARY.md` — same treatment
- `MANUAL_TEST_GUIDE.md` — same treatment
- `FILTER_FIX_SUMMARY.md` — same treatment
- `README.md` — same treatment
- `src/tests/*.md` test documentation files — same treatment

### H. index.html (1 rename)
- meta description: "potions" -> "craftables" (line 6)

## Acceptance Criteria
- [ ] Script file renamed
- [ ] All scripts updated
- [ ] All documentation updated
- [ ] `node scripts/link-recipes-to-craftables.js` runs without error (if testable)
- [ ] Full test suite still passes


## Notes

**2026-02-27T20:38:29Z**

Phase 7 complete - all scripts and documentation updated:

Script file renamed (via git mv):
- link-recipes-to-potions.js -> link-recipes-to-craftables.js

Scripts updated:
1. link-recipes-to-craftables.js: Comments, variables, console logs
2. populate-hashed-ids.ts: Interface, data references, console logs
3. generate-defaults-json.js: Variables, output keys (Excel sheet name kept as 'Potions')
4. update-recipe-fields.js: Data references, loop variables
5. add-market-fields.js: Data references, console logs

Documentation updated:
- ARCHITECTURE.md, ARCHITECTURE_BEFORE_AFTER.md, BUG_FIX_SUMMARY.md
- MANUAL_TEST_GUIDE.md, FILTER_FIX_SUMMARY.md, README.md
- All test documentation files

Other files:
- index.html: Meta description updated

Note: Regex patterns matching game data (e.g., '/Potion Recipe/') preserved
TypeScript compilation: Clean
