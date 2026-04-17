---
id: imp-ttuw
status: closed
deps: [imp-jxd0]
links: []
created: 2026-04-15T19:56:45Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
tags: [iteration-3, template-matching]
---
# Phase 7b: Update tests for NCC matcher and cleanup

Update all tests to reflect the dHash-to-NCC pivot, and clean up dead code.

### Test files to rewrite:
1. src/tests/utils/imageHash.test.ts -> src/tests/utils/thumbnailExtractor.test.ts
   - Test extractCellThumbnail with synthetic ImageData
   - Test edge cropping removes border pixels
   - Test bounding box detection finds item within dark background
   - Test resize produces 16x16 output (256 bytes)
   - Test grayscale conversion formula

2. src/tests/utils/hashMatcher.test.ts -> src/tests/utils/thumbnailMatcher.test.ts
   - Test loadThumbnailDatabase parses JSON correctly
   - Test computeNCC returns 1.0 for identical inputs
   - Test computeNCC returns ~0 for uncorrelated inputs
   - Test computeNCC returns high score for similar inputs (brightness-shifted)
   - Test findBestMatch returns 'matched' for clear matches
   - Test findBestMatch returns 'ambiguous' for flagged items
   - Test findBestMatch returns 'no_match' below threshold
   - Test precomputed normalized arrays are cached

3. src/tests/composables/useScreenshotImport.test.ts
   - Update mocks to use thumbnailExtractor/thumbnailMatcher instead of imageHash/hashMatcher
   - Same test scenarios, different mock API

### Source files to delete (after new files confirmed working):
- src/utils/imageHash.ts (replaced by thumbnailExtractor.ts)
- src/utils/hashMatcher.ts (replaced by thumbnailMatcher.ts)
- src/data/sprite-hashes.json (replaced by sprite-thumbnails.json)
- src/tests/utils/imageHash.test.ts (replaced by thumbnailExtractor.test.ts)
- src/tests/utils/hashMatcher.test.ts (replaced by thumbnailMatcher.test.ts)

### Verify no dead references:
- grep entire src/ for: computeDHash, hammingDistance, loadHashDatabase, sprite-hashes
- All should return zero matches after cleanup

## Acceptance Criteria

- [ ] thumbnailExtractor.test.ts passes with comprehensive coverage
- [ ] thumbnailMatcher.test.ts passes with NCC-specific test cases
- [ ] useScreenshotImport.test.ts updated for new matcher API and passes
- [ ] Old test files (imageHash.test.ts, hashMatcher.test.ts) deleted
- [ ] Old source files (imageHash.ts, hashMatcher.ts, sprite-hashes.json) deleted
- [ ] No references to dHash, computeDHash, hammingDistance, or sprite-hashes remain in codebase
- [ ] Full test suite passes: npm test shows 0 failures
- [ ] TypeScript check passes: npx vue-tsc --noEmit
- [ ] Lint passes: npm run lint

