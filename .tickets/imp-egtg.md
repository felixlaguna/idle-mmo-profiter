---
id: imp-egtg
status: closed
deps: [imp-tani]
links: []
created: 2026-04-15T19:56:17Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
tags: [iteration-3, template-matching]
---
# Phase 2b: Client-side NCC matcher (replaces dHash)

Replace dHash-based imageHash.ts and hashMatcher.ts with NCC (Normalized Cross-Correlation) template matching.

### File: src/utils/imageHash.ts -> rewrite as src/utils/thumbnailExtractor.ts

Purpose: Extract a 16x16 grayscale thumbnail from a screenshot cell using Canvas API.

Functions:
1. extractCellThumbnail(cellImageData: ImageData): Uint8Array
   - Input: raw ImageData from a cropped inventory cell
   - Crop 4px edges to remove UI borders (cell padding/borders)
   - Detect the item bounding box within the remaining area (skip dark background margins)
     - Scan for non-background pixels (threshold: pixels significantly brighter than rgb(17,23,34))
     - Find tight bounding box around the item sprite
   - Resize the bounding box content to 16x16 grayscale
     - Use OffscreenCanvas for resize (browser handles interpolation)
     - Convert to grayscale: gray = 0.299*R + 0.587*G + 0.114*B (standard luminance)
   - Return flat Uint8Array of 256 bytes

### File: src/utils/hashMatcher.ts -> rewrite as src/utils/thumbnailMatcher.ts

Purpose: Load thumbnail database and find best NCC match.

Types:
- SpriteThumbnailEntry: { h: string, n: string, t: string, thumb: number[], a?: boolean, g?: string }
- SpriteThumbnailDB: { version: number, thumbSize: number, totalItems: number, items: SpriteThumbnailEntry[], duplicateGroups: Record<string, string[]> }
- MatchResult: { hashedId: string, name: string, type: string, score: number, status: 'matched' | 'ambiguous' | 'no_match', duplicateGroup?: string[] }

Functions:
1. loadThumbnailDatabase(): SpriteThumbnailDB
   - Import sprite-thumbnails.json
   - Precompute normalized arrays for each thumbnail (subtract mean, divide by std dev)
   - Cache the normalized arrays for repeated matching

2. computeNCC(a: Uint8Array, b: Float64Array): number
   - Normalized Cross-Correlation between query thumbnail and precomputed reference
   - NCC formula: sum((a[i] - mean_a) * b_normalized[i]) / (std_a * 256)
   - Where b_normalized is pre-normalized (mean=0, std=1)
   - Returns score in range [-1, 1]
   - Score > 0.7 = likely match (tune threshold empirically)

3. findBestMatch(queryThumb: Uint8Array, db: SpriteThumbnailDB): MatchResult
   - Compute NCC against all items in db
   - If best score < threshold (0.7): return status='no_match'
   - If best match is ambiguous (a:true): return status='ambiguous' with duplicateGroup
   - Otherwise: return status='matched' with item info and score

### Performance considerations:
- 891 items x 256 multiplications per NCC = ~228K float ops per cell
- With 20 cells per screenshot = ~4.5M ops total -- trivial for modern JS engines (<10ms)
- Precomputing normalized reference thumbnails saves repeated mean/std calculation

### Key difference from dHash approach:
- dHash compared 64-bit hex strings via Hamming distance
- NCC compares 256-element float arrays via correlation
- NCC is more robust: brightness/contrast invariant, handles grayscale formula differences
- NCC is slightly more compute but still fast (sub-ms per comparison)

## Acceptance Criteria

- [ ] extractCellThumbnail crops edges, detects bounding box, produces 16x16 grayscale
- [ ] computeNCC returns correct correlation scores (verified against known pairs)
- [ ] findBestMatch returns matched/ambiguous/no_match with correct status
- [ ] Ambiguous items return duplicateGroup info
- [ ] Old imageHash.ts and hashMatcher.ts removed or replaced
- [ ] Performance: < 50ms to match all cells in a typical 20-slot screenshot


## Notes

**2026-04-15T20:18:29Z**

Implementation complete.

Files created:
- src/utils/thumbnailExtractor.ts — 16×16 grayscale thumbnail extractor (replaces imageHash.ts)
- src/utils/thumbnailMatcher.ts — NCC-based matcher with loadThumbnailDatabase/findBestMatch/ncc (replaces hashMatcher.ts)
- src/tests/utils/thumbnailExtractor.test.ts — 12 tests covering output shape, grayscale conversion, Rec.709 formula
- src/tests/utils/thumbnailMatcher.test.ts — tests for ncc(), loadThumbnailDatabase(), findBestMatch() against both synthetic and real DB

Files modified:
- src/composables/useScreenshotImport.ts — updated imports to use thumbnailExtractor/thumbnailMatcher
- src/tests/composables/useScreenshotImport.test.ts — updated mocks from imageHash/hashMatcher to thumbnailExtractor/thumbnailMatcher, distance→score field
- src/tests/utils/screenshot-pipeline.test.ts — updated from computeDHash to extractThumbnail, installDHashMock→installThumbnailMock
- eslint.config.js — added atob/btoa to browser globals

Files deleted:
- src/utils/imageHash.ts
- src/utils/hashMatcher.ts
- src/tests/utils/imageHash.test.ts
- src/tests/utils/hashMatcher.test.ts

Tests: All passing (48 files / 896 tests)
