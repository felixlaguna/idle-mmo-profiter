---
id: imp-nq72
status: closed
deps: [imp-yxp7]
links: []
created: 2026-04-15T10:27:09Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
---
# Phase 7: Tests and integration validation

Write comprehensive tests for all screenshot import modules.

### Unit Tests:

**src/tests/utils/imageHash.test.ts:**
- computeDHash produces consistent output for same input
- computeDHash produces different output for different images
- hammingDistance returns 0 for identical hashes
- hammingDistance returns correct count for known differences
- Edge cases: all-black image, all-white image, single-pixel differences

**src/tests/utils/hashMatcher.test.ts:**
- findBestMatch returns exact match (distance 0)
- findBestMatch returns close match within threshold
- findBestMatch returns null when all distances exceed threshold
- findBestMatch returns null for ambiguous matches (two items equidistant)
- loadHashDatabase handles missing/malformed data

**src/tests/utils/gridDetector.test.ts:**
- detectGrid finds correct number of cells in mock grid image
- detectGrid handles different grid sizes
- Empty cell classification works correctly
- Handles images with no grid (returns empty array)

**src/tests/utils/quantityReader.test.ts:**
- extractQuantity reads single digits correctly
- extractQuantity reads multi-digit numbers
- extractQuantity returns null for unreadable regions
- Handles various background contrasts

**src/tests/composables/useScreenshotImport.test.ts:**
- Full pipeline test with mock image data
- applyToInventory calls setItemQuantity correctly
- Progress reporting updates during processing
- Error handling for invalid images

### Integration Considerations:
- Tests should use mock Canvas/ImageData since vitest runs in happy-dom
- May need to mock OffscreenCanvas or use jsdom with canvas support
- Consider using pre-computed hash values in tests rather than actual image processing
- Test the pipeline end-to-end with known input/output pairs

## Acceptance Criteria

- All unit tests pass (vitest run)
- Coverage for imageHash, hashMatcher, gridDetector, quantityReader modules
- Pipeline integration test passes
- Tests work in happy-dom environment
- No flaky tests (deterministic with mocks)

