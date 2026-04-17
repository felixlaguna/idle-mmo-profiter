---
id: imp-o17d
status: closed
deps: [imp-0gpz, imp-foao, imp-lkum]
links: []
created: 2026-04-15T10:26:33Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
---
# Phase 5: Screenshot import composable -- orchestrate the full pipeline

Create a composable that orchestrates the entire screenshot-to-inventory pipeline and provides reactive state for the UI.

### File: src/composables/useScreenshotImport.ts

### Pipeline:
1. Accept image from paste event or file drop
2. Load image onto offscreen Canvas
3. Run grid detection (Phase 3) -> GridCell[]
4. For each non-empty cell:
   a. Extract sprite region (center of cell, excluding quantity area)
   b. Compute dHash (Phase 2)
   c. Match against hash DB (Phase 2)
   d. Extract quantity (Phase 4)
5. Collect all recognized items into a results array
6. Return results with confidence scores for user review

### Composable API:
```typescript
function useScreenshotImport() {
  // State
  const isProcessing: Ref<boolean>
  const progress: Ref<{ step: string; current: number; total: number }>
  const results: Ref<ImportResult[]>
  const errors: Ref<ImportError[]>
  const previewImage: Ref<string | null>  // data URL of the pasted screenshot

  // Actions
  function processImage(file: File | Blob): Promise<void>
  function processFromClipboard(clipboardData: DataTransfer): Promise<void>
  function clearResults(): void
  function applyToInventory(): void  // calls setItemQuantity for each result

  return { isProcessing, progress, results, errors, previewImage, processImage, processFromClipboard, clearResults, applyToInventory }
}
```

### Types:
```typescript
interface ImportResult {
  hashedId: string
  name: string
  quantity: number
  confidence: number     // 0-1, based on hamming distance
  matchDistance: number   // raw hamming distance
  cellPreview?: string   // data URL of the cell image for review
  gridPosition: { row: number; col: number }
}

interface ImportError {
  gridPosition: { row: number; col: number }
  reason: 'no_match' | 'ambiguous' | 'empty_cell' | 'quantity_unreadable'
  cellPreview?: string
}
```

### applyToInventory():
- Uses useCharacterTracker().setItemQuantity() for each recognized item
- If an item already exists in inventory, ADD the quantity (don't replace)
- Requires an active character to be selected
- Shows toast notification with summary (X items imported, Y unrecognized)

### Performance:
- Process cells in batches to avoid blocking the UI
- Use requestAnimationFrame or setTimeout(0) between batches
- Show progress: 'Detecting grid...', 'Matching items (12/50)...', 'Reading quantities...'

## Acceptance Criteria

- Pipeline processes a screenshot end-to-end without errors
- Results include all recognized items with quantities and confidence scores
- Unrecognized cells are reported in errors array
- applyToInventory correctly adds items to character inventory
- Progress reporting works (step name + current/total)
- Processing does not block UI (batched with yields)
- Unit tests for pipeline orchestration


## Notes

**2026-04-15T10:31:18Z**

## Iteration: Propagate ambiguous match status through the pipeline (user feedback)

**Change**: The matcher now returns 'ambiguous' status with duplicate group info instead of returning null for duplicate-sprite items. The pipeline types must carry this through.

### Updated ImportResult type:
```typescript
interface ImportResult {
  hashedId: string
  name: string
  quantity: number
  confidence: number
  matchDistance: number
  status: 'matched' | 'ambiguous' | 'low-confidence'
  duplicateGroup?: string[]  // names of items sharing this sprite (when status='ambiguous')
  cellPreview?: string
  gridPosition: { row: number; col: number }
}
```

### Updated ImportError -- remove 'ambiguous' reason:
- [ ] Ambiguous matches are now ImportResult with `status: 'ambiguous'`, NOT ImportError
- [ ] They go into the `results` array, not the `errors` array
- [ ] This lets the UI present them as recoverable (user can pick the correct item) rather than failures
- [ ] ImportError.reason keeps: 'no_match' | 'empty_cell' | 'quantity_unreadable'

### Pipeline step 4c change:
- [ ] When hashMatcher returns a result with `status: 'ambiguous'`, still add it to results (not errors)
- [ ] Populate `duplicateGroup` from the matcher's response

### applyToInventory() change:
- [ ] Skip items with `status: 'ambiguous'` unless the user has resolved them (picked a specific item from the group)
- [ ] The UI will set a `resolvedHashedId` or change status to 'matched' when the user manually picks

**2026-04-15T10:49:39Z**

Implementation complete.

Files created:
- src/composables/useScreenshotImport.ts — composable orchestrating the full pipeline
- src/tests/composables/useScreenshotImport.test.ts — 31 unit tests, all passing

Key design decisions:
- Ambiguous matches land in results[] with status='ambiguous' (not errors[])
- applyToInventory() is additive (adds to existing qty, not replace)
- Ambiguous items skipped in applyToInventory() unless resolvedHashedId is set
- resolveAmbiguousItem() allows user to pick specific item from duplicate group
- Processing yields to event loop every BATCH_SIZE=5 cells
- processFromClipboard(DataTransfer) + processClipboardEvent(ClipboardEvent) both provided

All 822 project tests passing (46 test files, 1 pre-existing skip).
