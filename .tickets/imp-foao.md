---
id: imp-foao
status: closed
deps: []
links: []
created: 2026-04-15T10:25:46Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
---
# Phase 3: Grid detection -- extract inventory slots from screenshot

Create a module that takes a pasted screenshot and extracts individual inventory slot images.

### File: src/utils/gridDetector.ts

### Algorithm:
1. User pastes/drops an image -> load into an offscreen Canvas
2. Convert to grayscale for edge detection
3. Detect grid structure:
   a. The inventory has dark-bordered cells in a grid pattern
   b. Scan for horizontal and vertical lines (rows of dark pixels)
   c. Use line intersection to find cell boundaries
   d. Alternative approach: template-match a known 'Empty' slot to find cell size, then tile the grid
4. Extract each cell as a separate ImageData
5. For each cell, determine if it is empty or has an item:
   - Empty cells: mostly uniform dark background or contain 'Empty' text
   - Item cells: have a sprite image in the center region

### Grid Detection Strategy (recommended approach):
Since the grid has consistent cell sizes within a single screenshot but may vary between screenshots:
1. Detect edges using simple Sobel-like gradient filter
2. Project edge strength onto X and Y axes (sum columns/rows)
3. Find peaks in both projections -- these are grid lines
4. Grid lines should be roughly equally spaced -- use this to validate and fill gaps
5. Cell boundaries = rectangles between consecutive grid lines

### Edge Cases:
- Screenshot may include areas outside the inventory (tabs, scrollbar, etc.)
- Some screenshots may have partially visible cells at edges -- discard those
- The grid background color and border color may vary with game themes
- Screenshot resolution varies (mobile vs desktop captures)

### Output:
```typescript
interface GridCell {
  row: number
  col: number
  x: number      // pixel X in original image
  y: number      // pixel Y in original image  
  width: number
  height: number
  imageData: ImageData
  isEmpty: boolean
}

function detectGrid(canvas: HTMLCanvasElement): GridCell[]
```

### Important:
- All processing on offscreen Canvas -- no visible UI during detection
- Should handle screenshots of varying sizes (300px to 4000px wide)
- Performance target: < 500ms for a typical 1920x1080 screenshot

## Acceptance Criteria

- detectGrid correctly identifies cell boundaries in test screenshots
- Empty cells are correctly classified
- Works with varying grid sizes (4x6, 5x8, etc.)
- Handles screenshots with extra UI elements around the grid
- Performance < 500ms for 1080p screenshots
- Unit tests with mock image data


## Notes

**2026-04-15T10:33:15Z**

Starting implementation of src/utils/gridDetector.ts. Will use projection-based approach: grayscale -> X/Y axis projection -> peak detection -> cell boundary extraction.

**2026-04-15T10:36:00Z**

Implementation complete.

Files created:
- src/utils/gridDetector.ts — projection-based grid detector (grayscale, X/Y projection, peak detection, cell extraction, isEmpty classification, file/clipboard helpers)
- src/tests/utils/gridDetector.test.ts — 26 unit tests covering edge cases, grid detection, isEmpty, options, varying grid sizes, performance

Fixed: added guard requiring at least 1 detected line in each axis before returning cells (prevents whole-image false positive when no dark borders present).

All 711 tests passing (42 test files, 0 failures).
