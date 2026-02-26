---
id: imp-8p0b
status: closed
deps: []
links: []
created: 2026-02-26T19:15:10Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Replace 'White shark' with 'Great White Shark'

Replace all references to 'White shark' with 'Great White Shark' in both cooked and regular versions throughout the codebase


## Notes

**2026-02-26T19:16:16Z**

## Planning Complete

### Rename Mapping
- White shark -> Great White Shark
- Cooked White Shark -> Cooked Great White Shark
- Cooked White Shark full -> Cooked Great White Shark full
- Cooked White Shark full + coal -> Cooked Great White Shark full + coal

### Affected Files (6 source files + 4 ticket files)
1. src/data/defaults.json -- 8 occurrences (data layer, most critical)
2. scripts/test-resource-costs.ts -- 12 occurrences (test script)
3. scripts/validate-vendor-values.js -- 2 occurrences (validation script)
4. src/tests/resource-cost-calculation.test.md -- 12 occurrences (test docs)
5. .tickets/imp-90r5.md -- 1 occurrence
6. .tickets/imp-aorl.md -- 2 occurrences
7. .tickets/imp-pyol.md -- 5 occurrences
8. .tickets/imp-o9wf.md -- 4 occurrences

Total: ~46 occurrences across 8 files (excluding this epic ticket itself)

### Phases: 4 tasks
- Phase 1 (imp-y1kr): defaults.json -- data layer, do first
- Phase 2 (imp-zpq7): test scripts -- depends on Phase 1
- Phase 3 (imp-eicm): test documentation -- depends on Phase 1
- Phase 4 (imp-jbvv): ticket files -- depends on Phase 1

### Dependencies
Phase 1 is the foundation. Phases 2, 3, 4 can run in parallel after Phase 1.

### Risks
- Low risk: This is a string rename with no logic changes.
- The resourceName field in defaults.json (line 4671) is used for input lookups. The name must match exactly between the resource definition and the input reference. Both are being renamed consistently.

Ready for implementation.

**2026-02-26T19:21:05Z**

Implementation complete. All 4 phases completed successfully.

Summary of changes:
- Phase 1 (imp-y1kr): defaults.json - 7 occurrences
- Phase 2 (imp-zpq7): Test scripts - 14 occurrences  
- Phase 3 (imp-eicm): Test documentation - 12 occurrences
- Phase 4 (imp-jbvv): Ticket files - 12 occurrences

Total: 45 occurrences renamed across 8 files.

All 'White shark' variants successfully renamed to 'Great White Shark' variants:
✓ White shark → Great White Shark
✓ Cooked White Shark → Cooked Great White Shark  
✓ Cooked White Shark full → Cooked Great White Shark full
✓ Cooked White Shark full + coal → Cooked Great White Shark full + coal

Files modified:
- /home/felix/idle-mmo-profiter/src/data/defaults.json
- /home/felix/idle-mmo-profiter/scripts/test-resource-costs.ts
- /home/felix/idle-mmo-profiter/scripts/validate-vendor-values.js
- /home/felix/idle-mmo-profiter/src/tests/resource-cost-calculation.test.md
- /home/felix/idle-mmo-profiter/.tickets/imp-90r5.md
- /home/felix/idle-mmo-profiter/.tickets/imp-aorl.md
- /home/felix/idle-mmo-profiter/.tickets/imp-pyol.md
- /home/felix/idle-mmo-profiter/.tickets/imp-o9wf.md

Ready for review.

**2026-02-26T19:22:59Z**

## Code Review: APPROVED

### Files reviewed:
- /home/felix/idle-mmo-profiter/src/data/defaults.json (7 renames)
- /home/felix/idle-mmo-profiter/scripts/test-resource-costs.ts (12 renames)
- /home/felix/idle-mmo-profiter/scripts/validate-vendor-values.js (2 renames)
- /home/felix/idle-mmo-profiter/src/tests/resource-cost-calculation.test.md (12 renames)
- /home/felix/idle-mmo-profiter/.tickets/imp-90r5.md (1 rename)
- /home/felix/idle-mmo-profiter/.tickets/imp-aorl.md (2 renames)
- /home/felix/idle-mmo-profiter/.tickets/imp-pyol.md (5 renames)
- /home/felix/idle-mmo-profiter/.tickets/imp-o9wf.md (4 renames)

### Verification Results

**Grep for remaining "White shark" in src/ and scripts/:** PASS - Zero occurrences of old name found. Every match contains "Great White Shark".

**Rename completeness:**
- "White shark" -> "Great White Shark": DONE (all occurrences)
- "Cooked White Shark" -> "Cooked Great White Shark": DONE
- "Cooked White Shark full" -> "Cooked Great White Shark full": DONE
- "Cooked White Shark full + coal" -> "Cooked Great White Shark full + coal": DONE

**defaults.json consistency:** PASS
- resources array (lines 148-159): names updated for res-4 ("Great White Shark") and res-5 ("Cooked Great White Shark")
- resourceGathering array (lines 4658-4703): all 5 entries updated consistently
- resourceName reference in inputs (line 4671): "Great White Shark" matches the resource definition name exactly
- No data values were changed -- only name strings were modified

**No unintended changes:** PASS - Diff shows only string replacements of the exact item names. No structural changes, no value modifications, no logic changes.

### Test Results

**TypeScript type checker (vue-tsc):** PASS
**Vitest (156 tests):** ALL PASSING (9 test files, 156 tests)
**Resource cost calculation script:** ALL 3 TESTS PASSED (default prices, coal=10, stingray=50)
**Vendor value validation script:** PASSED (all 7 resources validated)
**Production build:** PASS (84 modules, built successfully)

### Linter

**ESLint:** 49 pre-existing errors in test files (global/Storage/beforeEach not defined, no-explicit-any). These are all in test infrastructure files unrelated to this change:
- src/tests/components/ApiKeyInput.test.ts
- src/tests/composables/useApiKeyValidation.test.ts
- src/tests/composables/useDataProvider.test.ts
- src/tests/setup.ts

None of these files were modified by this change. No new lint issues introduced.

### Summary

Clean rename across all source and documentation files. The data layer (defaults.json) is internally consistent -- the resourceName input reference matches the resource definition name. All tests and validation scripts pass with the new names. No unintended side effects. Ready for user review.

**2026-02-26T19:24:00Z**

User Review: Perfect - work approved
