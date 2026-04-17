---
id: imp-lkum
status: closed
deps: []
links: []
created: 2026-04-15T10:26:08Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
---
# Phase 4: Quantity digit extraction from inventory slots

Create a module that reads the quantity number from the top-right corner of each inventory slot.

### File: src/utils/quantityReader.ts

### Approach: Digit Template Matching (NOT full OCR)
Full OCR libraries (Tesseract.js) are too heavy (~2MB+) for this use case. Since inventory quantities use a fixed game font with limited digits (0-9), template matching is more appropriate.

### Algorithm:
1. Crop the top-right region of the cell (roughly top-right 40% x 30% of the cell)
2. The quantity text is white/light-colored on a semi-transparent dark background
3. Threshold the cropped region to isolate light text on dark background
4. Segment individual digit characters using connected component analysis or vertical projection
5. Match each digit against templates (0-9) using normalized cross-correlation or simple pixel matching

### Digit Templates:
- Option A: Ship a small digit template atlas (0-9 in the game font) as a base64 data URL -- ~2KB
- Option B: Build digit templates at runtime from a known reference (the 'Empty' text or a calibration step)
- Option C: Use the pre-built hash DB to include digit hashes (generated in Phase 1 script)
- **Recommended: Option A** -- most reliable, smallest payload

### Template Generation:
- Add a step to the Phase 1 script (or a separate script) that extracts digit templates from known inventory screenshots
- Store as a compact format in sprite-hashes.json or a separate digit-templates.json

### Output:
```typescript
function extractQuantity(cellImageData: ImageData, cellWidth: number, cellHeight: number): number | null
```
Returns null if quantity could not be read (treat as 1).

### Edge Cases:
- Single digit vs multi-digit numbers (1 vs 999)
- Large numbers may overlap the sprite slightly
- Some items have quantity 1 and may not show a number at all (return 1)
- The quantity background pill may vary in opacity

### Alternative: Simple Connected-Component + Aspect Ratio Matching
If template matching proves too fragile:
- Threshold the quantity region
- Find connected white components
- Use aspect ratios and pixel counts to classify digits (1 is narrow, 0/8 are wide, etc.)
- This is less accurate but requires zero shipped templates

## Acceptance Criteria

- extractQuantity correctly reads single-digit quantities (1-9)
- extractQuantity correctly reads multi-digit quantities (10, 99, 999)
- Returns null when quantity is not visible (defaults to 1 upstream)
- Works with standard game font at various screenshot resolutions
- Unit tests with cropped cell images
- No external OCR library dependency (< 5KB total for digit templates)


## Notes

**2026-04-15T10:33:45Z**

Implementing quantityReader.ts using connected-component analysis + aspect ratio classification approach. This requires no shipped templates and adapts to various resolutions. Algorithm: 1) Crop top-right region, 2) Threshold bright pixels, 3) Find connected components, 4) Classify each component as a digit via aspect ratio + pixel density, 5) Sort left-to-right and assemble number.

**2026-04-15T10:36:17Z**

Implementation complete.

Files created:
- src/utils/quantityReader.ts — pure Canvas API quantity extraction module
- src/tests/utils/quantityReader.test.ts — 32 unit tests

Algorithm: connected-component analysis + aspect-ratio/pixel-density classification. No external dependencies. Exports:
- extractQuantity(cellImageData, cellWidth, cellHeight): QuantityResult
- thresholdRegion, findConnectedComponents, classifyDigitBlob (also exported for testability)

All 43 test files pass (743 tests total).
