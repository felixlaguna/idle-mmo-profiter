/**
 * useScreenshotImport — orchestrates the full screenshot-to-inventory pipeline.
 *
 * Pipeline:
 *   1. Accept image from paste event or file input
 *   2. Detect the inventory grid  (gridDetector)
 *   3. For each non-empty cell:
 *      a. Compute 192-bit dHash fingerprint  (imageHash)
 *      b. Match against sprite hash database via Hamming distance  (dHashMatcher)
 *      c. Extract quantity from the quantity region  (quantityReader)
 *   4. Collect results and errors into reactive arrays
 *   5. Optionally apply to character inventory via useCharacterTracker
 *
 * Processing is batched (BATCH_SIZE cells per microtask yield) so it does
 * not block the UI on large screenshots.
 */

import { ref, computed } from 'vue'
import { detectGridFromFile } from '../utils/gridDetector'
import { computeDHash } from '../utils/imageHash'
import { loadDHashDatabase, findBestDHashMatch } from '../utils/dHashMatcher'
import { extractQuantity } from '../utils/quantityReader'
import { useCharacterTracker } from './useCharacterTracker'
import { useToast } from './useToast'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A successfully recognised (or ambiguous) inventory cell.
 *
 * The ticket specifies two slightly different shapes; this implementation
 * follows the Phase-5 iteration note which supersedes the original spec:
 * - `status` field distinguishes matched / ambiguous / low-confidence results
 * - `duplicateGroup` carries the conflicting item names for ambiguous entries
 * - Ambiguous items end up in `results`, NOT `errors`
 */
export interface ImportResult {
  /** Sprite hash ID (game internal identifier). */
  hashedId: string
  /** Human-readable item name. */
  name: string
  /** Extracted quantity (defaults to 1 when the quantity region is unreadable). */
  quantity: number
  /**
   * Match confidence in [0, 1].
   * Derived from Hamming distance: 1 = exact match, lower = more bits differ.
   */
  confidence: number
  /** Hamming distance of the best match (0 = exact match, higher = more bits differ). */
  matchDistance: number
  /** Match quality classification. */
  status: 'matched' | 'ambiguous' | 'low-confidence'
  /**
   * Names of all items sharing the same sprite.
   * Present only when `status` is `'ambiguous'`.
   */
  duplicateGroup?: string[]
  /**
   * hashedId manually chosen by the user when `status` is `'ambiguous'`.
   * When set, `applyToInventory()` treats this result as resolved.
   */
  resolvedHashedId?: string
  /** Data-URL of the cropped cell image, for the review UI. */
  cellPreview?: string
  /** Original position in the detected grid. */
  gridPosition: { row: number; col: number }
  /** Pixel coordinates of the cell in the source image. */
  cellRect: { x: number; y: number; w: number; h: number }
}

/** A cell that could not be matched to any item. */
export interface ImportError {
  gridPosition: { row: number; col: number }
  reason: 'no_match' | 'empty_cell' | 'quantity_unreadable'
  /** Data-URL of the cropped cell image, for the review UI. */
  cellPreview?: string
  /** Pixel coordinates of the cell in the source image. */
  cellRect: { x: number; y: number; w: number; h: number }
}

/** Progress state during processing. */
export interface ImportProgress {
  /** Short human-readable description of the current step. */
  step: string
  /** Number of cells processed so far. */
  current: number
  /** Total number of cells to process. */
  total: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of cells to process before yielding to the event loop. */
const BATCH_SIZE = 5


// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useScreenshotImport() {
  // State
  const isProcessing = ref(false)
  const progress = ref<ImportProgress>({ step: 'Idle', current: 0, total: 0 })
  const results = ref<ImportResult[]>([])
  const errors = ref<ImportError[]>([])
  const previewImage = ref<string | null>(null)
  const imageSize = ref<{ width: number; height: number } | null>(null)

  // Derived helpers
  const hasResults = computed(() => results.value.length > 0 || errors.value.length > 0)
  const matchedCount = computed(
    () => results.value.filter((r) => r.status === 'matched' || r.resolvedHashedId).length,
  )
  const ambiguousCount = computed(
    () => results.value.filter((r) => r.status === 'ambiguous' && !r.resolvedHashedId).length,
  )
  const unrecognizedCount = computed(() => errors.value.filter((e) => e.reason === 'no_match').length)

  // -------------------------------------------------------------------------
  // Core processing
  // -------------------------------------------------------------------------

  /**
   * Yield to the event loop so the browser can repaint between cell batches.
   */
  function yieldToEventLoop(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0))
  }

  /**
   * Convert an HTMLCanvasElement to a data-URL for preview purposes.
   * Returns undefined when the canvas is not available.
   */
  function canvasToDataUrl(canvas: HTMLCanvasElement | undefined): string | undefined {
    if (!canvas) return undefined
    try {
      return canvas.toDataURL('image/png')
    } catch {
      return undefined
    }
  }

  /**
   * Run the full grid → hash → quantity pipeline on `file`.
   */
  async function processImage(file: File | Blob): Promise<void> {
    if (isProcessing.value) return

    isProcessing.value = true
    results.value = []
    errors.value = []
    previewImage.value = null

    try {
      // Step 1: Detect grid
      progress.value = { step: 'Detecting grid…', current: 0, total: 0 }
      console.group('[screenshot-import] Pipeline start')
      console.log('Input file:', file instanceof File ? { name: file.name, size: file.size, type: file.type } : { size: file.size, type: file.type })
      // Use a higher lineThreshold (0.95) for real screenshots to reject
      // spurious inner-sprite edges (peak ≈0.7–0.90) while still detecting
      // real grid borders (peak ≈1.1–1.3). The default (0.5) is kept lower
      // for synthetic test images which produce projections of only 0.83–0.94.
      // computeDHash handles tall cells (h > CANONICAL_H+10) automatically.
      const cells = await detectGridFromFile(file, { lineThreshold: 0.95 })
      // Compute source image size from the furthest cell edge.
      if (cells.length > 0) {
        const maxX = Math.max(...cells.map((c) => c.x + c.width))
        const maxY = Math.max(...cells.map((c) => c.y + c.height))
        imageSize.value = { width: maxX, height: maxY }
      }
      console.log(`Grid detection: ${cells.length} cells, imageSize=${JSON.stringify(imageSize.value)}`)
      console.log(JSON.stringify(cells.map((c) => ({ row: c.row, col: c.col, x: c.x, y: c.y, w: c.width, h: c.height, empty: c.isEmpty }))))

      // Build a preview of the full screenshot from the first cell's canvas parent
      // (best-effort; not all environments support this)
      if (file instanceof File || file instanceof Blob) {
        try {
          previewImage.value = URL.createObjectURL(file)
        } catch {
          // Ignore — preview is optional
        }
      }

      // Skip cells from rows that start at y=0 — these are typically the
      // screenshot header area (sort controls, navigation) above the actual
      // inventory grid, which can produce false non-empty readings.
      const nonEmpty = cells.filter((c) => !c.isEmpty && c.y > 5)
      const totalCells = nonEmpty.length
      console.log(`Non-empty cells: ${totalCells} (after filtering y>5 header rows)`)

      if (totalCells === 0) {
        progress.value = { step: 'No items found', current: 0, total: 0 }
        console.warn('No non-empty cells detected — check grid detection')
        console.groupEnd()
        return
      }

      // Step 2: Pre-load hash database (cached after first call)
      progress.value = { step: 'Loading hash database…', current: 0, total: totalCells }
      const hashDb = await loadDHashDatabase()
      console.log(`Hash DB loaded: ${hashDb.entries.length} items`)

      // Step 3: Process cells in batches
      for (let i = 0; i < nonEmpty.length; i++) {
        if (i % BATCH_SIZE === 0 && i > 0) {
          progress.value = {
            step: `Matching items (${i}/${totalCells})…`,
            current: i,
            total: totalCells,
          }
          await yieldToEventLoop()
        }

        const cell = nonEmpty[i]
        const cellPreview = canvasToDataUrl(cell.canvas)

        // 3a: Compute 192-bit dHash fingerprint from cell image data.
        // computeDHash normalises cells to 84×64 before cropping, so desktop
        // and phone cells both produce hashes that match the pre-computed DB.
        const _px = cell.imageData.data
        const _mid = Math.floor(_px.length / 2)
        console.log(`[${cell.row},${cell.col}] imageData=${cell.imageData.width}x${cell.imageData.height} (cell=${cell.width}x${cell.height} refH=${cell.referenceHeight}) px[0]=${_px[0]},${_px[1]},${_px[2]} px[mid]=${_px[_mid]},${_px[_mid+1]},${_px[_mid+2]} len=${_px.length}`)
        const queryHash = computeDHash(cell.imageData, undefined, cell.referenceHeight)

        if (!queryHash) {
          console.log(`[${cell.row},${cell.col}] hash=null (skipped)`)
          errors.value.push({
            gridPosition: { row: cell.row, col: cell.col },
            reason: 'no_match',
            cellPreview,
            cellRect: { x: cell.x, y: cell.y, w: cell.width, h: cell.height },
          })
          continue
        }

        // 3b: Match against sprite hash database using pre-computed dHash.
        const match = await findBestDHashMatch(queryHash)

        // 3c: Extract quantity
        const qResult = extractQuantity(cell.imageData, cell.width, cell.height)
        const quantity = qResult.quantity ?? 1

        console.log(
          `[${cell.row},${cell.col}] ${cell.width}x${cell.height} hash=${queryHash} match=${match ? `${match.name} d=${match.distance}${match.ambiguous ? ' [amb]' : ''}` : 'NO MATCH'} qty=${quantity} (qConf=${qResult.confidence.toFixed(2)})`
        )

        if (!match) {
          errors.value.push({
            gridPosition: { row: cell.row, col: cell.col },
            reason: 'no_match',
            cellPreview,
            cellRect: { x: cell.x, y: cell.y, w: cell.width, h: cell.height },
          })
          continue
        }

        // Derive a [0,1] confidence from the Hamming distance.
        // 192-bit hash: distance 0 = 1.0, distance 192 = 0.0
        const confidence = 1 - match.distance / 192

        const result: ImportResult = {
          hashedId: match.hashedId,
          name: match.name,
          quantity,
          confidence,
          matchDistance: match.distance,
          status: match.ambiguous ? 'ambiguous' : 'matched',
          cellPreview,
          gridPosition: { row: cell.row, col: cell.col },
          cellRect: { x: cell.x, y: cell.y, w: cell.width, h: cell.height },
        }

        if (match.ambiguous && match.groupId) {
          const groupNames = hashDb.duplicateGroupMap.get(match.groupId)
          result.duplicateGroup = groupNames ?? [match.name]
        }

        results.value.push(result)
      }

      progress.value = {
        step: `Done — ${results.value.length} items found`,
        current: totalCells,
        total: totalCells,
      }
      console.log(`Summary: ${results.value.length} matched/ambiguous, ${errors.value.length} unrecognized`)
      console.groupEnd()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.value.push({
        gridPosition: { row: -1, col: -1 },
        reason: 'no_match',
        cellPreview: undefined,
        cellRect: { x: 0, y: 0, w: 0, h: 0 },
      })
      progress.value = { step: `Error: ${message}`, current: 0, total: 0 }
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Extract the first image from a ClipboardEvent and run the pipeline.
   */
  async function processFromClipboard(clipboardData: DataTransfer): Promise<void> {
    if (isProcessing.value) return

    isProcessing.value = true
    results.value = []
    errors.value = []
    previewImage.value = null

    try {
      progress.value = { step: 'Reading clipboard…', current: 0, total: 0 }

      // Find the first image item in the clipboard
      let imageFile: File | null = null
      for (const item of Array.from(clipboardData.items)) {
        if (item.type.startsWith('image/')) {
          imageFile = item.getAsFile()
          break
        }
      }

      if (!imageFile) {
        progress.value = { step: 'No image found in clipboard', current: 0, total: 0 }
        isProcessing.value = false
        return
      }

      // Delegate to processImage (it handles isProcessing itself, so we need
      // to reset it first since we already set it above)
      isProcessing.value = false
      await processImage(imageFile)
    } catch (err) {
      isProcessing.value = false
      throw err
    }
  }

  /**
   * Convenience wrapper that accepts a ClipboardEvent directly.
   */
  async function processClipboardEvent(event: ClipboardEvent): Promise<void> {
    if (!event.clipboardData) return
    await processFromClipboard(event.clipboardData)
  }

  // -------------------------------------------------------------------------
  // Manual ambiguity resolution
  // -------------------------------------------------------------------------

  /**
   * Manually resolve an ambiguous result by selecting a specific item.
   *
   * @param gridPosition - Row/col of the result to resolve.
   * @param hashedId     - The hashedId the user chose from the duplicate group.
   */
  function resolveAmbiguousItem(
    gridPosition: { row: number; col: number },
    hashedId: string,
  ): void {
    const result = results.value.find(
      (r) => r.gridPosition.row === gridPosition.row && r.gridPosition.col === gridPosition.col,
    )
    if (result && result.status === 'ambiguous') {
      result.resolvedHashedId = hashedId
    }
  }

  // -------------------------------------------------------------------------
  // Apply to inventory
  // -------------------------------------------------------------------------

  /**
   * Apply all matched (and manually resolved) results to the active character's
   * inventory via `useCharacterTracker().setItemQuantity()`.
   *
   * Behaviour:
   * - Ambiguous items without a `resolvedHashedId` are skipped.
   * - For each accepted result the quantity is ADDED to any existing quantity
   *   (not replaced), because screenshot imports are additive.
   * - A toast summarises the operation.
   */
  function applyToInventory(): void {
    const tracker = useCharacterTracker()
    const toast = useToast()

    if (!tracker.activeCharacter.value) {
      toast.error('No active character selected. Please select a character first.')
      return
    }

    // Build effective inventory map for ADD semantics
    const effectiveInventory = tracker.getEffectiveInventory.value
    const existingQtyMap = new Map<string, number>()
    for (const item of effectiveInventory) {
      existingQtyMap.set(item.hashId, item.quantity)
    }

    let imported = 0
    let skipped = 0

    for (const result of results.value) {
      // Determine the effective hashedId to apply
      let effectiveHashedId: string

      if (result.status === 'ambiguous') {
        if (!result.resolvedHashedId) {
          skipped++
          continue
        }
        effectiveHashedId = result.resolvedHashedId
      } else {
        effectiveHashedId = result.hashedId
      }

      // ADD to existing quantity (additive import semantics)
      const existing = existingQtyMap.get(effectiveHashedId) ?? 0
      const newQty = existing + result.quantity

      tracker.setItemQuantity(effectiveHashedId, newQty, undefined, result.name)
      existingQtyMap.set(effectiveHashedId, newQty)
      imported++
    }

    const unrecognized = errors.value.filter((e) => e.reason === 'no_match').length

    const parts: string[] = [`${imported} item${imported !== 1 ? 's' : ''} imported`]
    if (skipped > 0) parts.push(`${skipped} ambiguous skipped`)
    if (unrecognized > 0) parts.push(`${unrecognized} unrecognized`)

    if (imported > 0) {
      toast.success(parts.join(', ') + '.')
    } else {
      toast.warning(parts.join(', ') + '.')
    }
  }

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  /** Clear all results, errors, and preview state. */
  function clearResults(): void {
    results.value = []
    errors.value = []
    previewImage.value = null
    progress.value = { step: 'Idle', current: 0, total: 0 }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    // Reactive state
    isProcessing,
    progress,
    results,
    errors,
    previewImage,
    imageSize,

    // Derived
    hasResults,
    matchedCount,
    ambiguousCount,
    unrecognizedCount,

    // Pipeline entry points
    processImage,
    processFromClipboard,
    processClipboardEvent,

    // Ambiguity resolution
    resolveAmbiguousItem,

    // Inventory integration
    applyToInventory,

    // Reset
    clearResults,
  }
}
