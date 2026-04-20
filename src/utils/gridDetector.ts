/**
 * Grid detector utility for inventory screenshot processing
 *
 * Detects and extracts individual inventory slot images from a screenshot
 * of the IdleMMO inventory grid using a gradient-based edge-fraction approach:
 *   1. Convert image to grayscale
 *   2. For each column/row, count the fraction of adjacent pixels whose
 *      brightness difference exceeds a minimum edge strength.
 *   3. Project these edge-fractions onto X and Y axes.
 *   4. Find peaks in the edge-fraction projections — these correspond to
 *      grid-border lines (columns/rows where many pixels have an edge).
 *   5. Use gaps between peaks to identify cell boundaries.
 *   6. Extract each cell as a sub-image.
 *
 * This gradient-based approach works correctly on dark-themed UIs where
 * both borders and cell backgrounds are dark, because it detects contrast
 * changes (edges) rather than absolute pixel brightness.
 */

/**
 * A single extracted inventory grid cell
 */
export interface GridCell {
  /** Zero-based row index */
  row: number
  /** Zero-based column index */
  col: number
  /** Pixel X position in the original image */
  x: number
  /** Pixel Y position in the original image */
  y: number
  /** Cell width in pixels */
  width: number
  /** Cell height in pixels */
  height: number
  /**
   * Modal (reference) row height in pixels as detected by normalizeIntervals.
   * Passed to computeDHash so it can correctly align the center-crop for
   * tall cells that include extra separator pixels at the top.
   */
  referenceHeight: number
  /** Raw pixel data for the cell */
  imageData: ImageData
  /** Offscreen canvas element containing only this cell */
  canvas: HTMLCanvasElement
  /** True if the cell appears to be an empty inventory slot */
  isEmpty: boolean
}

/**
 * Options that control detection behaviour
 */
export interface GridDetectorOptions {
  /**
   * Minimum fraction of rows (for vertical lines) or columns (for
   * horizontal lines) that must have a detectable edge for a position
   * to be considered a grid border. Expressed as a fraction of the
   * column/row length (0–1). Default: 1.0 (100 %).
   *
   * Higher values require stronger/wider borders — this rejects spurious
   * inner-cell edges that occur at sprite boundaries inside inventory cells.
   * Lower values detect more lines but may include sprite edges as false
   * grid lines. For IdleMMO inventory screenshots, 1.0 selects only the
   * true cell-border peaks (projX/projY ≈ 1.3) while discarding the
   * weaker sprite edges (≈ 0.7).
   */
  lineThreshold?: number
  /**
   * Minimum absolute brightness difference between adjacent pixels for
   * an edge to be counted in the edge-fraction projection. Default: 5.
   *
   * This controls sensitivity to subtle borders — lower values detect
   * weaker contrast edges, higher values require stronger contrast.
   *
   * Previously named darkPixelThreshold in the raw-darkness algorithm;
   * kept for backwards-compatibility but the semantics have changed.
   */
  darkPixelThreshold?: number
  /**
   * Minimum cell dimension (px). Cells smaller than this are discarded
   * as noise. Default: 20.
   */
  minCellSize?: number
  /**
   * Maximum cell dimension (px). Cells larger than this are discarded.
   * Default: 2000.  The previous default of 300 was too small for high-DPI
   * phone screenshots where cells can reach 300–350 px per axis.
   * `normalizeIntervals` handles noise filtering, so a generous upper bound
   * is safe here.
   */
  maxCellSize?: number
  /**
   * Fraction of a cell's area that must be uniform for the cell to be
   * classified as empty (0–1). Default: 0.85.
   */
  emptyUniformityThreshold?: number
  /**
   * Standard-deviation of brightness within a cell below which the
   * cell is considered to have a uniform (empty) background.
   * Default: 18.
   */
  emptyStdDevThreshold?: number
  /**
   * Number of pixels to inset from each detected cell boundary when
   * extracting slot image data.  Use this to trim the inter-slot gap
   * pixels that surround each slot and differ from the reference DB
   * renders.
   *
   * Can be specified as a single number (applied to all sides) or as
   * `{ x: number; y: number }` to set separate horizontal/vertical
   * insets.  Default: `{ x: 0, y: 0 }` (no inset).
   *
   * Empirically, IdleMMO desktop screenshots need `{ x: 7, y: 5 }` to
   * align the extracted slot content with the 96×64 reference renders.
   */
  cellInset?: number | { x: number; y: number }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert an RGBA ImageData to a Float32Array of grayscale intensities [0–255]
 * using the luminance formula: 0.299 R + 0.587 G + 0.114 B
 */
function toGrayscale(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }
  return gray
}

/**
 * Compute gradient-based edge-fraction projections onto the X and Y axes.
 *
 * For each column x, counts the fraction of row-pairs (y, y) for which the
 * horizontal brightness difference |gray[y,x+1] − gray[y,x]| exceeds
 * `minEdge`. Columns that straddle a vertical border line have many such
 * strong edges and produce a high value; cell interiors produce near-zero
 * values regardless of their absolute brightness.
 *
 * Similarly, for each row y, counts the fraction of column-pairs whose
 * vertical difference exceeds `minEdge`.
 *
 * Both channels of an edge (left pixel and right pixel) are credited, so
 * projection values can slightly exceed 1.0 at border positions when the
 * border is more than one pixel wide.
 *
 * Returns two Float32Array projections of lengths `width` and `height`.
 */
function projectEdgeFractions(
  gray: Float32Array,
  width: number,
  height: number,
  minEdge: number,
): { projX: Float32Array; projY: Float32Array } {
  const projX = new Float32Array(width)
  const projY = new Float32Array(height)

  // Horizontal edges → contribute to column projections
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const diff = Math.abs(gray[y * width + x + 1] - gray[y * width + x])
      if (diff > minEdge) {
        projX[x]++
        projX[x + 1]++
      }
    }
  }

  // Vertical edges → contribute to row projections
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      const diff = Math.abs(gray[(y + 1) * width + x] - gray[y * width + x])
      if (diff > minEdge) {
        projY[y]++
        projY[y + 1]++
      }
    }
  }

  // Normalise to a per-pixel fraction (rows for projX, cols for projY)
  for (let x = 0; x < width; x++) projX[x] /= height
  for (let y = 0; y < height; y++) projY[y] /= width

  return { projX, projY }
}

/**
 * Find the indices at which `projection` exceeds `threshold`.
 * Near-consecutive indices separated by a gap of at most `maxBandGap`
 * pixels are merged into a single band; the midpoint of each band is
 * returned as the grid-line position.
 *
 * The gap tolerance handles phone/high-DPI screenshots where a 4–6 px
 * wide grid border can produce two sub-peaks with a 1–2 px dip between
 * them (caused by the border's center channel being slightly below
 * threshold due to JPEG compression).  A gap of 2 is safe because real
 * inventory cell widths are always >> 20 px.
 *
 * Works with both the old dark-fraction projections and the new
 * edge-fraction projections — in both cases a high value means a border.
 */
function findGridLines(projection: Float32Array, threshold: number, maxBandGap: number = 2): number[] {
  const lines: number[] = []
  let inBand = false
  let bandStart = 0
  let gapRun = 0

  for (let i = 0; i < projection.length; i++) {
    if (projection[i] >= threshold) {
      if (!inBand) {
        inBand = true
        bandStart = i
      }
      gapRun = 0
    } else {
      if (inBand) {
        gapRun++
        if (gapRun > maxBandGap) {
          // Band ended — record midpoint of the band (excluding the gap tail)
          inBand = false
          lines.push(Math.round((bandStart + i - 1 - gapRun) / 2))
          gapRun = 0
        }
      }
    }
  }
  // Handle a band that runs to the very end
  if (inBand) {
    lines.push(Math.round((bandStart + projection.length - 1 - gapRun) / 2))
  }

  return lines
}

/**
 * Given an ordered list of grid-line positions and the total image
 * dimension, return an array of [start, end] intervals representing
 * cell boundaries (the gaps between lines).
 * Intervals smaller than `minSize` or larger than `maxSize` are dropped.
 */
function linesToIntervals(
  lines: number[],
  totalSize: number,
  minSize: number,
  maxSize: number,
): Array<[number, number]> {
  // Build boundary list: 0 … lines … totalSize-1
  const boundaries: number[] = [0, ...lines, totalSize]
  const intervals: Array<[number, number]> = []

  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i]
    const end = boundaries[i + 1]
    const size = end - start
    if (size >= minSize && size <= maxSize) {
      intervals.push([start, end])
    }
  }

  return intervals
}

/**
 * Normalise intervals by:
 *   1. Removing slivers (intervals well below the median size).
 *   2. Splitting oversized intervals that are approximately N× the median,
 *      which happen when a grid line is not detected and two adjacent cells
 *      are merged into one wide interval.
 *
 * @param intervals - Array of [start, end] pixel intervals.
 * @param toleranceFraction - How much deviation from median is allowed (default 35 %).
 * @returns Object with normalized intervals and the computed reference cell size.
 */
function normalizeIntervals(
  intervals: Array<[number, number]>,
  toleranceFraction: number = 0.35,
): { intervals: Array<[number, number]>; reference: number } {
  if (intervals.length === 0) return { intervals, reference: 0 }

  // Use a modal-like reference: refine median toward the cluster of largest
  // sizes. This avoids undersized slivers (caused by spurious internal edges)
  // dragging the reference down.
  const sizes = intervals.map(([s, e]) => e - s)
  const sorted = [...sizes].sort((a, b) => a - b)
  let reference = sorted[Math.floor(sorted.length / 2)]
  for (let iter = 0; iter < 3; iter++) {
    const above = sorted.filter((s) => s >= reference * 0.75)
    if (above.length === 0) break
    const newRef = above[Math.floor(above.length / 2)]
    if (newRef === reference) break
    reference = newRef
  }

  // Guard: if the reference is dragged down by a partial trailing row (e.g. the
  // last row is only 50 % of a full row), ignore all sizes below reference * 0.5
  // and recompute the median from the full-size rows only.
  const maxSize = sorted[sorted.length - 1]
  if (reference < maxSize * 0.5) {
    const upperHalf = sorted.filter((s) => s >= maxSize * 0.5)
    if (upperHalf.length > 0) {
      reference = upperHalf[Math.floor(upperHalf.length / 2)]
    }
  }

  const tolerance = reference * toleranceFraction
  const result: Array<[number, number]> = []
  let pendingMerge: [number, number] | null = null

  for (const [start, end] of intervals) {
    const size = end - start

    if (Math.abs(size - reference) <= tolerance) {
      if (pendingMerge !== null) {
        // A sliver was pending. Prefer absorbing it: combine sliver + this
        // interval and check if the merged span is closer to reference.
        const mergedStart = pendingMerge[0]
        const mergedSize = end - mergedStart
        if (Math.abs(mergedSize - reference) <= tolerance) {
          // Merged is within tolerance — absorb the sliver.
          result.push([mergedStart, end])
        } else if (mergedSize > reference + tolerance) {
          // Merged is oversized — split it.
          const n = Math.round(mergedSize / reference)
          if (n >= 2) {
            const cellSize = mergedSize / n
            for (let j = 0; j < n; j++) {
              const s = Math.round(mergedStart + j * cellSize)
              const e = j === n - 1 ? end : Math.round(mergedStart + (j + 1) * cellSize)
              result.push([s, e])
            }
          } else {
            result.push([start, end])
          }
        } else {
          // Drop the sliver, keep current interval.
          result.push([start, end])
        }
        pendingMerge = null
      } else {
        result.push([start, end])
      }
    } else if (size > reference + tolerance) {
      // If there is a pending sliver, try merging it with this oversized interval
      // before splitting, in case the combined span is an exact multiple of reference.
      const oversizedStart = pendingMerge ? pendingMerge[0] : start
      const oversizedSize = end - oversizedStart
      pendingMerge = null
      const n = Math.round(oversizedSize / reference)
      if (n >= 2) {
        const cellSize = oversizedSize / n
        for (let i = 0; i < n; i++) {
          const s = Math.round(oversizedStart + i * cellSize)
          const e = i === n - 1 ? end : Math.round(oversizedStart + (i + 1) * cellSize)
          result.push([s, e])
        }
      } else if (n === 1 && Math.abs(oversizedSize - reference) <= tolerance) {
        // After absorbing the sliver the interval is now within tolerance.
        result.push([oversizedStart, end])
      }
      // n === 1 but still oversized: drop (no clean split).
    } else {
      // Undersized sliver: accumulate with any pending merge and check if the
      // merged span reaches reference size.
      const mergedStart: number = pendingMerge ? pendingMerge[0] : start
      const mergedEnd: number = end
      const mergedSize = mergedEnd - mergedStart

      if (Math.abs(mergedSize - reference) <= tolerance) {
        result.push([mergedStart, mergedEnd])
        pendingMerge = null
      } else if (mergedSize > reference + tolerance) {
        result.push([mergedStart, mergedEnd])
        pendingMerge = null
      } else {
        pendingMerge = [mergedStart, mergedEnd]
      }
    }
  }

  return { intervals: result, reference }
}

/**
 * Remove leading and trailing intervals that are edge-padding cells —
 * significantly smaller than the modal reference cell size.
 *
 * In inventory screenshots the inventory frame often adds a non-item
 * column or row at each edge that is slightly narrower than the actual
 * cells. Removing these avoids counting the frame border as an extra
 * inventory slot.
 *
 * @param intervals  - Already-normalised intervals (output of normalizeIntervals).
 * @param reference  - Modal cell size computed by normalizeIntervals.
 * @param minFraction - Minimum size as a fraction of reference (default 0.90).
 *                     Intervals smaller than `reference × minFraction` at the
 *                     edges are trimmed.
 */
function trimEdgePadding(
  intervals: Array<[number, number]>,
  reference: number,
  minFraction: number = 0.90,
): Array<[number, number]> {
  if (intervals.length === 0 || reference <= 0) return intervals

  const minSize = reference * minFraction

  // Trim leading padding cells
  let start = 0
  while (start < intervals.length && intervals[start][1] - intervals[start][0] < minSize) {
    start++
  }

  // Trim trailing padding cells
  let end = intervals.length - 1
  while (end > start && intervals[end][1] - intervals[end][0] < minSize) {
    end--
  }

  return intervals.slice(start, end + 1)
}

/**
 * Determine whether a cell's pixels are "empty" (uniform dark background).
 *
 * Strategy: compute the standard deviation of the grayscale brightness
 * inside the cell. Low std-dev (flat colour) = empty slot.
 */
function classifyEmpty(
  gray: Float32Array,
  imageWidth: number,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
  stdDevThreshold: number,
): boolean {
  if (cellW <= 0 || cellH <= 0) return true

  // Sample the inner 60 % of the cell to avoid border artefacts
  const padX = Math.round(cellW * 0.2)
  const padY = Math.round(cellH * 0.2)
  const x0 = cellX + padX
  const y0 = cellY + padY
  const x1 = cellX + cellW - padX
  const y1 = cellY + cellH - padY

  if (x1 <= x0 || y1 <= y0) return true

  let sum = 0
  let count = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      sum += gray[y * imageWidth + x]
      count++
    }
  }
  const mean = sum / count

  let variance = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const diff = gray[y * imageWidth + x] - mean
      variance += diff * diff
    }
  }
  const stdDev = Math.sqrt(variance / count)

  return stdDev < stdDevThreshold
}

/**
 * Extract a rectangular region from a canvas into a new offscreen canvas.
 */
function extractRegion(
  sourceCtx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; imageData: ImageData } {
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const ctx = offscreen.getContext('2d')!
  ctx.drawImage(sourceCtx.canvas, x, y, width, height, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  return { canvas: offscreen, imageData }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect the inventory grid inside `sourceCanvas` and return an array of
 * extracted `GridCell` objects, one per slot.
 *
 * The function is pure-client-side and uses only the Canvas API.
 * Typical processing time is well under 500 ms for a 1920×1080 image.
 *
 * @param sourceCanvas - The canvas containing the screenshot. Must have
 *   already been drawn with the inventory screenshot (e.g. via
 *   `ctx.drawImage`).
 * @param options - Optional tuning parameters (see `GridDetectorOptions`).
 * @returns Array of `GridCell` objects sorted row-first (top-left to
 *   bottom-right). Returns an empty array when no grid is found.
 */
export function detectGrid(
  sourceCanvas: HTMLCanvasElement,
  options: GridDetectorOptions = {},
): GridCell[] {
  const {
    lineThreshold = 0.5,
    darkPixelThreshold = 5,
    minCellSize = 20,
    maxCellSize = 2000,
    emptyStdDevThreshold = 18,
    cellInset = 0,
  } = options

  const insetX = typeof cellInset === 'number' ? cellInset : cellInset.x
  const insetY = typeof cellInset === 'number' ? cellInset : cellInset.y

  const width = sourceCanvas.width
  const height = sourceCanvas.height

  if (width === 0 || height === 0) return []

  const ctx = sourceCanvas.getContext('2d')
  if (!ctx) return []

  // --- Step 1: grab raw pixel data and convert to grayscale ----------------
  const rgba = ctx.getImageData(0, 0, width, height)
  const gray = toGrayscale(rgba.data, width, height)

  // --- Step 2: compute gradient edge-fraction projections and find lines ---
  // darkPixelThreshold is now used as the minimum edge magnitude per pixel.
  const { projX, projY } = projectEdgeFractions(gray, width, height, darkPixelThreshold)

  // Adaptive threshold: each axis independently finds the best threshold.
  //
  // Different screenshots have different peak projection magnitudes:
  //   - Desktop: projX peaks ≈ 1.1–1.3  → lineThreshold=0.95 works well.
  //   - Phone:   projX peaks ≈ 0.65–0.68 → 0.95 gives zero lines; must fall back.
  //
  // We try the caller-supplied threshold first (handles desktop), then descend
  // through a fallback ladder until lines are detected on each axis separately.
  // Using separate per-axis thresholds ensures we always get the clearest lines
  // (highest threshold that still yields ≥1 line), even when one axis has
  // stronger edges than the other (common on phone screenshots where cell
  // borders differ in the horizontal vs vertical direction).
  const buildFallbackThresholds = (requested: number): number[] =>
    requested > 0.7
      ? [requested, 0.7, 0.5]
      : requested > 0.5
        ? [requested, 0.5]
        : [requested]

  const findLinesAdaptive = (proj: Float32Array): number[] => {
    for (const t of buildFallbackThresholds(lineThreshold)) {
      const lines = findGridLines(proj, t)
      if (lines.length > 0) return lines
    }
    return []
  }

  const vertLines = findLinesAdaptive(projX) // column separators
  const horizLines = findLinesAdaptive(projY) // row separators

  // A valid grid requires at least one detected line in each axis.
  // Without any lines there is no grid structure — just a plain image.
  if (vertLines.length === 0 || horizLines.length === 0) return []

  // --- Step 3: convert lines to cell intervals -----------------------------
  const rawColIntervals = linesToIntervals(vertLines, width, minCellSize, maxCellSize)
  const rawRowIntervals = linesToIntervals(horizLines, height, minCellSize, maxCellSize)

  // Normalise to remove slivers / noise.
  // Columns: also trim outer padding cells (frame border regions at image edges).
  // Rows: do NOT trim edges — empty rows at the bottom are valid inventory slots.
  const { intervals: normCols, reference: colRef } = normalizeIntervals(rawColIntervals)
  const { intervals: normRows, reference: rowRef } = normalizeIntervals(rawRowIntervals)

  const colIntervals = trimEdgePadding(normCols, colRef)

  // If the detected row reference is implausibly small compared to the column
  // reference (< 60 % of colRef), the row normalisation has converged on a
  // half-cell artefact caused by strong interior sprite edges.  In that case,
  // attempt to merge adjacent row-pairs whose combined height is close to
  // 2 × rowRef, effectively recovering the true cell height.
  let rowIntervals = normRows
  if (colRef > 0 && rowRef > 0 && rowRef < colRef * 0.6) {
    const doubleRef = rowRef * 2
    const doubleToler = doubleRef * 0.35
    const merged: Array<[number, number]> = []
    let i = 0
    while (i < normRows.length) {
      const [s1, e1] = normRows[i]
      if (i + 1 < normRows.length) {
        const [, e2] = normRows[i + 1]
        const combinedSize = e2 - s1
        if (Math.abs(combinedSize - doubleRef) <= doubleToler) {
          // Merge the pair into one cell
          merged.push([s1, e2])
          i += 2
          continue
        }
      }
      merged.push([s1, e1])
      i++
    }
    if (merged.length < normRows.length) {
      rowIntervals = merged
    }
  }

  // --- Step 3b: split an oversized first row (phone header + items merged) --
  // On phone screenshots the top row (y≈0) sometimes spans both the Date/Sort
  // header band AND the first item row because no strong grid line separates
  // them.  normalizeIntervals won't split it because 285/260 ≈ 1.10 — within
  // the 35 % tolerance.  We detect this case and re-use the existing projY
  // data to find the internal border.
  if (rowIntervals.length >= 2) {
    const [firstStart, firstEnd] = rowIntervals[0]
    const firstSize = firstEnd - firstStart
    const secondSize = rowIntervals[1][1] - rowIntervals[1][0]

    if (firstStart <= 5 && firstSize > secondSize * 1.15) {
      // Scan projY within the first row for the strongest internal peak.
      // Skip the first and last 10 px to avoid the cell borders themselves.
      const ySlice = projY.slice(firstStart, firstEnd)
      let bestPeak = 0
      let bestY = -1
      for (let i = 10; i < ySlice.length - 10; i++) {
        if (ySlice[i] > bestPeak) {
          bestPeak = ySlice[i]
          bestY = firstStart + i
        }
      }
      // Only split if the peak is meaningful and far enough from the top edge.
      if (bestPeak > 0.3 && bestY > firstStart + 20) {
        const headerPart: [number, number] = [firstStart, bestY]
        const itemPart: [number, number] = [bestY, firstEnd]
        const itemPartSize = firstEnd - bestY

        // If the item part is too small (< 50% of the next row), merge it
        // with the next row — the false grid line at y=firstEnd cut through
        // the first item row.
        if (rowIntervals.length >= 2 && itemPartSize < secondSize * 0.5) {
          const [, nextEnd] = rowIntervals[1]
          rowIntervals = [
            headerPart,
            [bestY, nextEnd] as [number, number],
            ...rowIntervals.slice(2),
          ]
        } else {
          rowIntervals = [
            headerPart,
            itemPart,
            ...rowIntervals.slice(1),
          ]
        }
      }
    }
  }

  if (colIntervals.length === 0 || rowIntervals.length === 0) return []

  // --- Step 4: extract cells -----------------------------------------------
  const cells: GridCell[] = []

  for (let r = 0; r < rowIntervals.length; r++) {
    const [cellY, cellYEnd] = rowIntervals[r]
    const cellH = cellYEnd - cellY

    for (let c = 0; c < colIntervals.length; c++) {
      const [cellX, cellXEnd] = colIntervals[c]
      const cellW = cellXEnd - cellX

      // Apply cell inset to trim gap/border pixels.
      const ix = Math.min(cellX + insetX, cellX + Math.floor(cellW / 2))
      const iy = Math.min(cellY + insetY, cellY + Math.floor(cellH / 2))
      const iw = Math.max(cellW - insetX * 2, 1)
      const ih = Math.max(cellH - insetY * 2, 1)

      const { canvas: cellCanvas, imageData: cellData } = extractRegion(
        ctx,
        ix,
        iy,
        iw,
        ih,
      )

      const isEmpty = classifyEmpty(
        gray,
        width,
        cellX,
        cellY,
        cellW,
        cellH,
        emptyStdDevThreshold,
      )

      cells.push({
        row: r,
        col: c,
        x: cellX,
        y: cellY,
        width: cellW,
        height: cellH,
        // When the merge step fires, pass the ORIGINAL half-height as referenceHeight
        // rather than the doubled value.  computeDHash uses referenceHeight to determine
        // effectiveH; the merged cells have their sprite in the TOP refH pixels, so
        // passing refH lets computeDHash crop correctly from the top of the merged cell.
        referenceHeight: rowRef,
        imageData: cellData,
        canvas: cellCanvas,
        isEmpty,
      })
    }
  }

  return cells
}

/**
 * Convenience helper: load an image from a `File` or `Blob` into an
 * offscreen canvas and then run `detectGrid`.
 *
 * @param file - The image file to process (PNG / JPG / WebP, etc.)
 * @param options - Optional tuning parameters.
 * @returns Promise that resolves to an array of `GridCell` objects.
 */
export async function detectGridFromFile(
  file: File | Blob,
  options: GridDetectorOptions = {},
): Promise<GridCell[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(detectGrid(canvas, options))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Convenience helper: extract the first image from a `ClipboardEvent`
 * paste event and run `detectGrid`.
 *
 * Usage in a Vue component:
 * ```ts
 * const cells = await detectGridFromClipboard(event)
 * ```
 *
 * @param event - The native paste `ClipboardEvent`.
 * @param options - Optional tuning parameters.
 * @returns Promise resolving to `GridCell[]`, or null when the clipboard
 *   contains no image data.
 */
export async function detectGridFromClipboard(
  event: ClipboardEvent,
  options: GridDetectorOptions = {},
): Promise<GridCell[] | null> {
  const items = event.clipboardData?.items
  if (!items) return null

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        return detectGridFromFile(file, options)
      }
    }
  }

  return null
}
