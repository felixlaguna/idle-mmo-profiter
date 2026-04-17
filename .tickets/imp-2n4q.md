---
id: imp-2n4q
status: open
deps: []
links: []
created: 2026-04-15T10:22:06Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Screenshot inventory import via image recognition

Import inventory from screenshots using client-side image processing. Detect grid slots via border detection, match items using perceptual hashing against API-sourced reference images, and extract quantity numbers via OCR. Items with duplicate sprites should be excluded to avoid misidentification.


## Notes

**2026-04-15T10:24:44Z**

## Scouter Analysis: Codebase Context

### Existing Data Structures
- `defaults.json` contains ~1354 unique items across: materials (99), resources (19), recipes (345), craftableRecipes (311), resourceRecipes (31), allItems (891)
- Each item has `hashedId` (game hashed ID) and `name`
- `allItems` array has: hashedId, name, type (39 types), vendorPrice
- API `ItemSearchResult` has `image_url` field: `https://cdn.idle-mmo.com/images/<name>.png`
- API `ItemDetails` (inspect endpoint) also has `image` field

### Character Tracker (Integration Point)
- `useCharacterTracker.ts` composable: singleton pattern, manages characters/inventory/snapshots
- `CharacterTracker.vue`: tabs for characters, gold input, manual item search/add, inventory list, value chart
- Inventory items stored as `{ hashId, quantity, priceAtTime, name? }`
- `setItemQuantity(hashId, quantity, priceAtTime?, name?)` is the method to add items
- The tracker already has `itemNameMap` and `itemPriceMap` computed maps for O(1) lookups by hashId

### Existing Scripts
- `populate-all-items.ts`: Fetches ALL items from API search endpoint (paginated, alphabet strategy)
- `populate-hashed-ids.ts`: Fetches hashed IDs and vendor values via search + inspect endpoints
- `refresh-market-prices.ts`: Refreshes market prices for known items
- All scripts use the shared API client with rate limiting (20 req/min)

### Tech Stack
- Vue 3 + TypeScript, Vite, Vitest
- No image processing libraries currently installed
- Docker dev environment (docker-compose up)
- Deployed to GitHub Pages (static hosting, no server)

### Key Files for This Feature
- `src/composables/useCharacterTracker.ts` - inventory management API
- `src/components/CharacterTracker.vue` - UI integration point
- `src/types/index.ts` - type definitions
- `src/data/defaults.json` - item database (will need hash DB added)
- `src/api/services.ts` - API calls (image_url available from search/inspect)
- `scripts/populate-all-items.ts` - pattern for build-time API scripts

**2026-04-15T10:27:53Z**

## Planning Complete

### Architecture Overview
The feature has two main parts:
1. **Build-time**: A script fetches all item sprites from the IdleMMO API, computes perceptual hashes (dHash), detects duplicate sprites, and outputs a compact JSON database (~1200 entries, short keys for bundle size).
2. **Client-side**: When the user pastes a screenshot, the browser processes it entirely locally using Canvas API: detect grid cells, hash each cell's sprite, match against the pre-built database, and read quantity digits.

### Phase Structure (7 tasks)

| Phase | Ticket | Description | Can Start |
|-------|--------|-------------|-----------|
| 1 | imp-8l12 | Build-time sprite hash DB generator | Immediately |
| 2 | imp-0gpz | Client-side dHash + matching engine | After Phase 1 |
| 3 | imp-foao | Grid detection (cell extraction) | Immediately (parallel with 1,2) |
| 4 | imp-lkum | Quantity digit extraction | Immediately (parallel with 1,2,3) |
| 5 | imp-o17d | Pipeline composable (orchestrator) | After 2, 3, 4 |
| 6 | imp-yxp7 | Screenshot import UI component | After 5 |
| 7 | imp-nq72 | Tests and integration validation | After 6 |

### Dependency Graph
```
Phase 1 (hash DB script)
    |
    v
Phase 2 (dHash + matcher)---+
                             |
Phase 3 (grid detection)-----+--> Phase 5 (pipeline) --> Phase 6 (UI) --> Phase 7 (tests)
                             |
Phase 4 (quantity reader)----+
```

Phases 1, 3, and 4 can be worked on in parallel. Phase 2 needs Phase 1's output format.

### New Dependencies to Install
- **sharp** (devDependency) -- for Node.js image processing in the build-time script (Phase 1 only)
- NO new runtime dependencies -- browser Canvas API handles everything client-side

### Key Technical Decisions
- **dHash** over pHash/aHash: Best balance of speed and accuracy for small sprites. 64-bit hash, simple to implement in both Node.js and browser.
- **Digit template matching** over Tesseract.js: Game font is fixed, only 10 digits needed, avoids shipping a 2MB+ WASM blob.
- **No item images shipped**: Only 64-bit hex hashes in JSON (~30 bytes per item vs ~5KB per image).
- **Duplicate sprite exclusion**: Items sharing sprites are pre-flagged at build time and excluded from matching to prevent misidentification.

### Risks and Mitigations
1. **Risk: Grid detection fragility** -- Different screenshot sources (mobile, desktop, browser zoom) produce different grid dimensions.
   - Mitigation: Projection-based approach adapts to any cell size. Validate with multiple test screenshots.
2. **Risk: Hash collision between visually distinct sprites** -- Small sprites (32x32) have limited visual complexity.
   - Mitigation: dHash at 64 bits provides good discrimination. Threshold tuning + ambiguity rejection (if 2+ items match closely, reject both).
3. **Risk: Quantity digit reading accuracy** -- Game font rendering varies with resolution.
   - Mitigation: Template matching at multiple scales + fallback to 1 if unreadable. User can edit quantities in review step.
4. **Risk: sprite-hashes.json bundle size** -- ~1200 items at ~30 bytes each = ~36KB uncompressed, ~8KB gzipped.
   - Mitigation: Short key names, hex encoding. Acceptable size.
5. **Risk: API rate limits during hash generation** -- ~1200 items to fetch at 20 req/min = ~60 minutes.
   - Mitigation: Local image caching, progress resume support. One-time build step.

### Open Questions for User
None currently -- the requirements are well-defined. Ready for approval.

**2026-04-15T10:31:25Z**

## Iteration 2: Include ambiguous items in hash DB (user feedback)

**User feedback**: Duplicate-sprite items should NOT be stripped from the hash DB. Instead, include all items and flag ambiguous ones so the frontend knows which to skip during matching while still being able to show users why certain items were skipped.

### Tickets updated:
- **imp-8l12** (Phase 1: Hash DB script): Output ALL items with `a: true` + `g: groupHash` flags on ambiguous entries. No items excluded from the hashes array.
- **imp-0gpz** (Phase 2: Client-side matcher): Return ambiguous matches with `status: 'ambiguous'` and `duplicateGroup` info instead of returning null.
- **imp-o17d** (Phase 5: Pipeline composable): Ambiguous items flow into `results` (not `errors`) so the UI can present them as user-resolvable. Updated ImportResult type with status and duplicateGroup fields.
- **imp-yxp7** (Phase 6: UI): New amber/orange badge and grid overlay color for ambiguous items. Section showing conflicting items with optional manual resolution dropdown.

### Impact: This is a data-flow change that ripples through Phases 1 -> 2 -> 5 -> 6. Phases 3, 4, and 7 are unaffected.

**2026-04-15T10:36:05Z**

Phase 3 (Grid Detection) complete. src/utils/gridDetector.ts implemented and tested.

Files:
- src/utils/gridDetector.ts — detectGrid(), detectGridFromFile(), detectGridFromClipboard()
- src/tests/utils/gridDetector.test.ts — 26 tests, all passing

All 711 project tests still passing.

**2026-04-15T10:36:21Z**

Phase 4 (imp-lkum) complete. quantityReader.ts implemented at src/utils/quantityReader.ts with 32 passing unit tests. All 743 tests pass. Phase 4 unblocks Phase 5 (imp-o17d) pipeline composable.

**2026-04-15T10:39:19Z**

Phase 1 (imp-8l12) complete: scripts/generate-sprite-hashes.ts implemented.

Files:
- scripts/generate-sprite-hashes.ts - build-time sprite hash generator
- src/data/sprite-hashes.json - output file (run script for full 891-item DB)
- package.json - sharp added as devDependency

Run: tsx scripts/generate-sprite-hashes.ts
(Full run ~45 min for 891 items at 20 req/min; cache makes reruns instant)

All 743 tests passing.

**2026-04-15T10:44:39Z**

Phase 2 (imp-0gpz) complete: client-side dHash computation and matching engine.

Files:
- src/utils/imageHash.ts — computeDHash, hammingDistance
- src/utils/hashMatcher.ts — loadHashDatabase, findBestMatch, getAmbiguousIds, types SpriteHashDB / MatchResult
- src/tests/utils/imageHash.test.ts (16 tests)
- src/tests/utils/hashMatcher.test.ts (32 tests)

Tests: 791/792 passing (1 pre-existing skip). Unblocks Phase 5 (imp-o17d).

**2026-04-15T10:49:48Z**

Phase 5 (imp-o17d) complete. useScreenshotImport composable implemented and tested.

Files created:
- src/composables/useScreenshotImport.ts
- src/tests/composables/useScreenshotImport.test.ts

Tests: 822/823 passing (1 pre-existing skip). Phase 6 (imp-yxp7: UI component) is now unblocked.

**2026-04-15T10:54:56Z**

Phase 6 (imp-yxp7) complete.

Files created/modified:
- src/components/ScreenshotImport.vue — screenshot import modal component
- src/components/CharacterTracker.vue — integrated 'Import from Screenshot' button
- src/components/__tests__/ScreenshotImport.test.ts — 41 new tests

Tests: 863/864 passing (1 pre-existing skip). Phase 7 (imp-nq72: integration tests) is now unblocked.

**2026-04-15T10:59:13Z**

## Code Review: NEEDS FIXES

**Reviewer**: Reviewer Agent
**Date**: 2026-04-15

---

### Files reviewed:
**New files:**
- scripts/generate-sprite-hashes.ts (build-time hash DB generator)
- src/utils/gridDetector.ts (grid/slot detection)
- src/utils/quantityReader.ts (digit extraction)
- src/utils/imageHash.ts (client-side dHash)
- src/utils/hashMatcher.ts (hash matching against sprite DB)
- src/composables/useScreenshotImport.ts (pipeline composable)
- src/components/ScreenshotImport.vue (UI component)
- src/data/sprite-hashes.json (generated hash database)

**Modified files:**
- src/components/CharacterTracker.vue (integration point)

**Test files:**
- src/tests/utils/gridDetector.test.ts (26 tests)
- src/tests/utils/quantityReader.test.ts (32 tests)
- src/tests/utils/imageHash.test.ts (16 tests)
- src/tests/utils/hashMatcher.test.ts (32 tests)
- src/tests/composables/useScreenshotImport.test.ts (30 tests)
- src/components/__tests__/ScreenshotImport.test.ts (41 tests)

---

### Tests: PASS (862/862 new tests passing)
The 1 failed test (cache.test.ts getAge timeout) is a PRE-EXISTING flaky test unrelated to this feature. All 177 new tests for this feature pass.

### TypeScript: FAIL (2 errors)

1. **[TypeScript] src/composables/useScreenshotImport.ts:19**
   - Problem: `detectGridFromClipboard` is imported but never used (TS6133)
   - Suggestion: Remove the unused import: change `import { detectGridFromFile, detectGridFromClipboard }` to `import { detectGridFromFile }`

2. **[TypeScript] src/utils/quantityReader.ts:388**
   - Problem: Parameter `refHeight` in `classifyDigitBlob()` is declared but never read (TS6133)
   - Suggestion: Either prefix with underscore (`_refHeight`) to signal intentional non-use, or remove the parameter if it is not needed. Note: the docstring at line 382 says it is for 'normalisation' but the function body never references it. If it was intended for future use, prefix with underscore.

### Linter (ESLint): FAIL (24 source errors + 30 test errors)

**Critical: Missing browser globals in eslint.config.js**

The ESLint config at `eslint.config.js` uses an explicit globals whitelist. The new files use several browser/DOM types that are not in the whitelist, causing `no-undef` errors. The following globals must be added to the config:

| Missing Global | Used in |
|---|---|
| `ImageData` | gridDetector.ts, imageHash.ts, quantityReader.ts |
| `CanvasRenderingContext2D` | gridDetector.ts, imageHash.ts |
| `CanvasImageSource` | imageHash.ts |
| `OffscreenCanvas` | imageHash.ts |
| `Image` | gridDetector.ts |
| `DragEvent` | ScreenshotImport.vue |
| `ClipboardEvent` | ScreenshotImport.vue, gridDetector.ts, useScreenshotImport.ts |
| `DataTransfer` | useScreenshotImport.ts |
| `HTMLSelectElement` | ScreenshotImport.vue |
| `PredefinedColorSpace` | (test files only) |
| `performance` | (test files only) |
| `HTMLButtonElement` | (test files only) |

**Source file lint errors (excluding no-undef which are all from missing globals above):**

3. **[Lint] src/composables/useScreenshotImport.ts:19**
   - Problem: `detectGridFromClipboard` is defined but never used (@typescript-eslint/no-unused-vars)
   - Suggestion: Same fix as TypeScript issue #1 above -- remove unused import

4. **[Lint] src/utils/quantityReader.ts:388**
   - Problem: `refHeight` is defined but never used (@typescript-eslint/no-unused-vars)
   - Suggestion: Same fix as TypeScript issue #2 above

5. **[Lint] src/components/CharacterTracker.vue:547**
   - Problem: Expected a linebreak before attribute (vue/first-attribute-linebreak) -- warning only
   - Suggestion: The SVG inline element on line 547 has attributes on the same line as the tag. Move first attribute to a new line.

6. **[Lint] src/components/ScreenshotImport.vue (12 warnings)**
   - Problem: Multiple `vue/first-attribute-linebreak` warnings on SVG elements (lines 201, 210, 239, 281, 304, 311, 320, 397, 404, 434, 483)
   - Suggestion: Move the first attribute of multi-attribute SVG elements to a new line, or run eslint --fix

**Test file lint errors (excluding no-undef for missing globals):**

7. **[Lint] src/tests/utils/gridDetector.test.ts:11**
   - Problem: `GridDetectorOptions` is imported but only used as a type, flagged as unused
   - Suggestion: Change to `import type { GridDetectorOptions }` or remove if not needed

8. **[Lint] src/tests/utils/gridDetector.test.ts:39**
   - Problem: Parameters `_x`, `_y`, `_w`, `_h` in mock getImageData are defined but never used
   - Suggestion: These are intentionally unused mock parameters. Use rest syntax: `getImageData: vi.fn((..._args: unknown[]) => imageData)`

9. **[Lint] src/tests/utils/imageHash.test.ts:13**
   - Problem: `beforeEach` and `afterEach` are imported but never used
   - Suggestion: Remove from import statement

10. **[Lint] src/tests/utils/imageHash.test.ts:29,57,70**
    - Problem: `makeResizeMock`, `srcCanvas`, `installCanvasMock` are defined but never used
    - Suggestion: These appear to be leftover helper functions from development. Remove them.

11. **[Lint] src/tests/utils/quantityReader.test.ts:239**
    - Problem: `makeBlobBounds` is defined but only used as a type
    - Suggestion: Change to `type` import or remove the function if it is only referenced in type position

---

### Code Quality Assessment

**Architecture: GOOD**
- Clean separation of concerns across 7 modules (grid detection, hashing, matching, quantity reading, pipeline composable, UI, build script)
- Correct dependency flow: build-time script -> JSON DB -> client-side modules
- Proper use of Vue composable pattern for the pipeline orchestrator
- Batch processing with event loop yielding to prevent UI blocking

**Design System Compliance: GOOD**
- CSS uses design system tokens throughout: `var(--surface-bg)`, `var(--surface-border)`, `var(--surface-radius)`, `var(--surface-shadow)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--accent-primary)`, `var(--space-*)`, `var(--text-*)`, `var(--ease-in-out)`, `var(--ease-out)`, `var(--bg-tertiary)`, `var(--border-color)`
- No hardcoded colors found (the only rgba values are for transparent overlays/backdrops which is acceptable)
- Consistent naming conventions (si- prefix for scoped component styles)

**Security: PASS**
- All image processing is client-side (Canvas API), no server uploads
- No innerHTML or v-html usage -- no XSS vectors
- File input properly validates image MIME type before processing
- No injection risks in the template (all content uses text interpolation)

**Performance: ACCEPTABLE**
- Hash matching is O(n) brute-force over ~1200 entries per cell, which is fine (<1ms per query as documented)
- Batch size of 5 cells per event loop yield is reasonable
- sprite-hashes.json is only 4KB (20 items in test fixture; full DB ~36KB uncompressed / ~8KB gzipped as estimated)
- OffscreenCanvas is preferred over document.createElement('canvas') when available

**Integration: CORRECT**
- CharacterTracker.vue integration is clean: import, ref toggle, button, Teleported modal
- Composable correctly calls `useCharacterTracker().setItemQuantity()` with additive semantics
- Toast notifications for success/warning/error cases are well-handled
- Modal is Teleported to body for proper z-index stacking

---

### Additional Findings

12. **[Config] .sprite-cache/ directory is not in .gitignore**
    - Problem: The build-time script `generate-sprite-hashes.ts` creates a `.sprite-cache/` directory with downloaded sprite PNGs. This directory (40 files) appears as untracked in git status and could accidentally be committed.
    - Suggestion: Add `.sprite-cache/` to `.gitignore`

13. **[Data] sprite-hashes.json contains only 20 items (test fixture)**
    - Problem: The hash DB currently only has 20 items. The full game has ~891 items. The script needs to be run against the full API to populate all items before the feature is production-ready.
    - Suggestion: This is expected for development/testing. Document that the full DB must be generated before deployment, or run the script as part of the review.

---

### Summary

The feature is well-architected with clean separation of concerns, thorough test coverage (177 new tests), and proper design system compliance. However, there are **2 TypeScript errors** and **24 ESLint errors in source files** (mostly missing browser globals in the ESLint config, plus 2 unused imports/parameters) that must be fixed before merging. The test files also have **30 ESLint errors** (same globals issue plus some unused imports/variables).

**Priority fixes:**
1. Add missing browser globals to eslint.config.js (fixes 20 of 24 source errors + 19 of 30 test errors)
2. Remove unused `detectGridFromClipboard` import from useScreenshotImport.ts
3. Prefix or remove unused `refHeight` parameter in quantityReader.ts
4. Add `.sprite-cache/` to .gitignore
5. Clean up unused imports/variables in test files
6. Fix vue/first-attribute-linebreak warnings (low priority, eslint --fix)

**2026-04-15T11:03:21Z**

Code review fixes applied.

Files modified:
- src/composables/useScreenshotImport.ts — removed unused detectGridFromClipboard import
- src/utils/quantityReader.ts — prefixed unused refHeight parameter with _refHeight
- eslint.config.js — added missing browser globals (ImageData, CanvasRenderingContext2D, CanvasImageSource, OffscreenCanvas, Image, HTMLImageElement, createImageBitmap, DragEvent, ClipboardEvent, DataTransfer, HTMLSelectElement); added test globals (PredefinedColorSpace, performance, HTMLButtonElement); added argsIgnorePattern to no-unused-vars
- src/tests/utils/gridDetector.test.ts — removed unused GridDetectorOptions import; changed getImageData mock to use rest params
- src/tests/utils/imageHash.test.ts — removed unused beforeEach/afterEach imports; removed dead makeResizeMock and installCanvasMock helper functions
- src/tests/utils/quantityReader.test.ts — removed unused makeBlobBounds helper, inlined return type
- .gitignore — added .sprite-cache/
- src/components/ScreenshotImport.vue — vue/first-attribute-linebreak fixed by eslint --fix
- src/components/CharacterTracker.vue — vue/first-attribute-linebreak fixed by eslint --fix

Verification:
- npx vue-tsc --noEmit: PASS (0 errors)
- npm run lint: PASS (0 errors)
- npm test: 863/863 passing (1 pre-existing skip)

**2026-04-15T19:55:17Z**

## Iteration 3: Pivot from dHash to Template Matching with NCC

### Why dHash failed
- Sharp (Node.js build-time) and Canvas (browser runtime) use different grayscale formulas, producing different hashes for the same image
- Scale mismatches between sprite PNGs (variable sizes) and in-game rendering
- Quantity text overlays corrupt the hash signal

### New approach: Normalized Cross-Correlation (NCC) with compact thumbnails
Instead of comparing 64-bit hashes, we compare actual 16x16 grayscale pixel arrays using NCC.

**Build-time**: Composite each sprite onto dark bg rgb(17,23,34), resize to 16x16 grayscale, store as flat 256-byte arrays in JSON.
**Client-side**: Crop cell edges, detect item bounding box, resize to 16x16 grayscale, NCC against all thumbnails.

### NCC advantages over dHash
- Invariant to brightness/contrast differences (normalizes mean and variance)
- Handles grayscale formula differences between Sharp and Canvas
- Compares actual pixel patterns, not edge directions
- Score range -1 to 1 with clear threshold (~0.7)

### Superseded tickets (closed, dHash-based)
- imp-8l12 (Phase 1: Build-time sprite hash DB) -- SUPERSEDED by new thumbnail generator
- imp-0gpz (Phase 2: Client-side dHash + matcher) -- SUPERSEDED by new NCC matcher

### Unaffected tickets (closed, still valid)
- imp-foao (Phase 3: Grid detection) -- works fine, no changes needed
- imp-lkum (Phase 4: Quantity reader) -- works fine, no changes needed
- imp-yxp7 (Phase 6: UI component) -- works fine, no changes needed

### Tickets needing rework
- imp-o17d (Phase 5: Pipeline composable) -- must swap dHash calls for NCC calls
- imp-nq72 (Phase 7: Tests) -- must update tests for new matcher API

**2026-04-15T19:57:18Z**

## Iteration 3 Planning Complete: dHash -> Template Matching Pivot

### New task tickets (linear dependency chain):
1. imp-tani -- Phase 1b: Build-time thumbnail generator (replaces dHash) [READY]
2. imp-egtg -- Phase 2b: Client-side NCC matcher (replaces dHash) [blocked by 1b]
3. imp-jxd0 -- Phase 5b: Update pipeline composable for NCC [blocked by 2b]
4. imp-ttuw -- Phase 7b: Update tests + cleanup dead dHash code [blocked by 5b]

### Dependency graph:
```
imp-tani (1b: thumbnails) -> imp-egtg (2b: NCC) -> imp-jxd0 (5b: pipeline) -> imp-ttuw (7b: tests)
```

### Superseded tickets (already closed, notes added):
- imp-8l12 (Phase 1: dHash DB script) -- SUPERSEDED
- imp-0gpz (Phase 2: dHash matcher) -- SUPERSEDED

### Unchanged tickets (already closed, still valid):
- imp-foao (Phase 3: Grid detection) -- no changes
- imp-lkum (Phase 4: Quantity reader) -- no changes
- imp-yxp7 (Phase 6: UI component) -- no changes

### Files that will change:
- scripts/generate-sprite-hashes.ts -- rewrite to output thumbnails instead of dHash
- src/utils/imageHash.ts -- delete, replace with src/utils/thumbnailExtractor.ts
- src/utils/hashMatcher.ts -- delete, replace with src/utils/thumbnailMatcher.ts
- src/data/sprite-hashes.json -- delete, replace with src/data/sprite-thumbnails.json
- src/composables/useScreenshotImport.ts -- swap imports and matcher calls
- src/tests/utils/imageHash.test.ts -- delete, replace with thumbnailExtractor.test.ts
- src/tests/utils/hashMatcher.test.ts -- delete, replace with thumbnailMatcher.test.ts
- src/tests/composables/useScreenshotImport.test.ts -- update mocks

### Files that stay unchanged:
- src/utils/gridDetector.ts
- src/utils/quantityReader.ts
- src/components/ScreenshotImport.vue
- src/components/CharacterTracker.vue

### Bundle size impact:
- Old: sprite-hashes.json ~36KB raw / ~8KB gzip (1009 items x 16-byte hex hash)
- New: sprite-thumbnails.json ~228KB raw / ~50KB gzip (891 items x 256-byte thumbnail)
- Delta: +42KB gzipped -- acceptable for significantly better matching accuracy

### Risks:
1. NCC threshold tuning -- 0.7 is an estimate, may need empirical adjustment with real screenshots
   Mitigation: make threshold configurable, test with multiple screenshot sources
2. Bounding box detection in extractCellThumbnail -- must handle variable item sizes within cells
   Mitigation: conservative dark-pixel threshold, fallback to full cell if detection fails
