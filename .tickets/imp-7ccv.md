---
id: imp-7ccv
status: closed
deps: [imp-as1f]
links: []
created: 2026-02-26T19:51:39Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mpxc
---
# Phase 3: Handle edge cases and field normalization for export

Ensure the exported JSON is a clean, correct drop-in replacement for defaults.json by handling field normalization and edge cases.

## What to verify/fix
1. **resourceGathering 'cost' field**: The computed resourceGathering adds a 'cost' property that does NOT exist in defaults.json. The export must strip this field. Verify by comparing exported output against the original defaults.json structure.

2. **resourceGathering 'inputs' field**: Some resourceGathering items have an 'inputs' array. Verify these are preserved correctly in export.

3. **potionCrafts material unitCost flow**: When a user overrides a material price (e.g., mat-1 price=200), the potionCrafts computed updates the material's unitCost. The export should write the updated unitCost value back. Verify this works.

4. **Recipes with optional fields**: Recipes have optional 'value' field. If a recipe has value=undefined in the computed array, the export should match the original behavior (include value only if it was present in defaults.json, or include it as 0, or omit -- check what defaults.json does).

5. **Field ordering**: The exported JSON should maintain consistent field ordering to minimize diff noise when comparing with the original defaults.json. Use explicit field picking rather than spread operators where field order matters.

6. **Empty hashedId handling**: defaults.json uses empty string '' for unset hashedIds. Ensure user-set hashedIds are correctly exported and unset ones remain ''.

7. **vendorValue=0 handling**: defaults.json uses 0 for unset vendorValues. Ensure this is maintained.

## Key files
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts -- exportAsDefaultsJson() normalization logic
- /home/felix/idle-mmo-profiter/src/data/defaults.json -- reference for expected structure

## Verification approach
- Export with no overrides and compare against original defaults.json (should be identical or near-identical)
- Export with some overrides and verify only the overridden fields differ
- Check that the exported file can be placed at src/data/defaults.json and the app loads correctly

## Acceptance Criteria

- Exported JSON with zero overrides matches original defaults.json structure exactly (same fields, same order)
- 'cost' field on resourceGathering is NOT included in export
- Optional fields (Recipe.value) are handled consistently with original JSON
- hashedId empty strings and vendorValue zeros are preserved
- potionCraft material unitCost values reflect overridden prices
- Field ordering is consistent


## Notes

**2026-02-26T20:00:15Z**

Phase 3 verification complete. All edge cases are properly handled in the Phase 1 implementation.

Verification checklist:
✓ resourceGathering 'cost' field - STRIPPED (only baseCost, inputs, vendorValue, marketPrice included)
✓ resourceGathering 'inputs' field - PRESERVED (conditionally included when exists)
✓ potionCrafts material unitCost - FLOWS correctly from computed potionCrafts array with overrides
✓ Recipes optional 'value' field - HANDLED (only included if value \!== undefined)
✓ Field ordering - CONSISTENT (using explicit object literals with specific field order)
✓ Empty hashedId - PRESERVED (uses || '' to ensure empty string)
✓ vendorValue=0 - PRESERVED (uses || 0 to ensure zero for undefined)

Implementation analysis:
- exportAsDefaultsJson() uses explicit field picking for all objects
- Field order matches defaults.json structure
- No spread operators that could introduce unwanted fields
- All computed-only fields (like 'cost' on resourceGathering) are explicitly excluded
- Optional fields are conditionally included based on existence in source data

No code changes required - all edge cases already handled correctly in Phase 1.
