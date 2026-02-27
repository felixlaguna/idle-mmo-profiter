---
id: imp-jv5h
status: closed
deps: [imp-7ccv]
links: []
created: 2026-02-26T19:51:52Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mpxc
---
# Phase 4: Add unit tests for export functionality

Write tests to verify the export JSON functionality works correctly.

## Test cases to cover

### exportAsDefaultsJson() method tests (in a new test file or existing test file)
1. **No overrides**: Export with no user overrides should produce JSON matching the structure of defaults.json (same keys, same types, same array lengths)
2. **Material price override**: Set a material price override, export, verify the material's price is updated in the JSON
3. **HashedId override**: Set a hashedId for a material, export, verify hashedId is present in the exported material
4. **VendorValue override**: Set a vendorValue, export, verify it appears in export
5. **PotionCraft material cost flow**: Override a material price, verify the potionCraft that uses that material has its unitCost updated in the export
6. **ResourceGathering field stripping**: Verify 'cost' field is NOT present in exported resourceGathering items
7. **Multiple category overrides**: Set overrides across materials, potions, resources, recipes simultaneously, verify all are reflected
8. **Round-trip test**: Export JSON, parse it back, verify it matches DefaultData interface

### UI integration test (optional/stretch)
9. **Export button exists**: Verify MarketTable renders the export button
10. **Export button triggers download**: Mock file download, verify clicking export button calls exportAsDefaultsJson()

## Key files
- /home/felix/idle-mmo-profiter/src/tests/ -- new test file, e.g. src/tests/composables/useDataProvider.export.test.ts
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts -- the function under test
- /home/felix/idle-mmo-profiter/src/tests/setup.ts -- test setup reference

## Implementation notes
- Follow existing test patterns (see src/tests/ directory for conventions)
- Mock localStorage for override tests
- The test should import defaults.json to compare structure

## Acceptance Criteria

- Test file created with at least 6 test cases covering core scenarios
- All tests pass
- Tests verify structure match, override application, field stripping, and round-trip correctness


## Notes

**2026-02-26T20:02:27Z**

Phase 4 complete. Added comprehensive unit tests for exportAsDefaultsJson() functionality.

Test coverage (14 test cases):
✓ Valid JSON string output
✓ DefaultData schema structure matching
✓ Material price overrides reflected in export
✓ HashedId overrides reflected in export
✓ VendorValue overrides reflected in export
✓ Material price flow to potionCraft unitCost
✓ Computed 'cost' field stripped from resourceGathering
✓ ResourceGathering 'inputs' field preserved
✓ Multiple category overrides simultaneously
✓ Round-trip JSON parsing and schema validation
✓ Empty hashedId preserved as empty string
✓ VendorValue preserved as 0 when not overridden
✓ Resource price flow to resourceGathering marketPrice
✓ Recipe optional 'value' field handled correctly

Files modified:
- /home/felix/idle-mmo-profiter/src/tests/composables/useDataProvider.test.ts

Test results: All 170 tests passing (including 14 new export tests)
