/**
 * Quantity digit extraction from inventory slot images.
 *
 * Reads the numeric quantity shown in the top-left corner of an inventory slot
 * using pure Canvas API — no external OCR libraries.
 *
 * Algorithm:
 * 1. Crop the top-left region of the cell (top 45%, left 30%).
 * 2. Threshold to isolate bright (white/light) text from the dark background.
 * 3. Find connected components (blobs) of bright pixels.
 * 4. Filter blobs by size/aspect ratio to identify digit candidates.
 * 5. Sort candidates left-to-right and read the assembled number.
 *
 * Real game measurements (794×658 screenshot, ~90×81 px cells):
 * - Quantity number appears at approximately dy=18–27, dx=0–20 within the cell.
 * - Digit height is ~9 px; max rendered luminance is ~162 (anti-aliased white).
 * - Empty slots have a maximum luminance of ~42 in that region, well below text.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface QuantityResult {
  /** Parsed quantity, or null if no number was detected / could not be read. */
  quantity: number | null
  /** Confidence score in [0, 1]. */
  confidence: number
  /** Bounding box (in cell coordinates) where the number was found. */
  region: { x: number; y: number; width: number; height: number }
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface BlobBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  /** Number of lit pixels in this blob. */
  pixelCount: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Fraction of the cell width/height used as the quantity region.
 * Top-left corner: leftFrac wide, topFrac tall.
 *
 * Real game measurements show the quantity number at approximately the top
 * 18 % of the cell height and the left 35 % of the cell width.  Using 35 %
 * width ensures 3-digit numbers (e.g. "187", "298") are fully captured while
 * keeping the right column border outside the crop region.
 */
const REGION_LEFT_FRAC = 0.35
const REGION_TOP_FRAC = 0.45

/**
 * Pixel brightness threshold (0-255).
 * Pixels with luminance above this are considered "bright" (part of the text).
 *
 * The game renders quantity numbers in a pixel font at roughly luma 60–162.
 * Empty inventory slots max out at ~42 in the same region, giving a clear gap.
 */
const BRIGHTNESS_THRESHOLD = 60

/**
 * Minimum number of lit pixels for a blob to be considered a digit candidate.
 * Prevents single-pixel noise from being classified as a digit.
 */
const MIN_BLOB_PIXELS = 4

/**
 * Maximum aspect ratio (width / height) for a digit blob.
 * Digits are taller than wide (or roughly square), so very wide blobs are noise.
 */
const MAX_DIGIT_ASPECT_RATIO = 1.6

/**
 * Minimum height (in pixels) for a digit blob.
 * Avoids classifying tiny noise specks as digits.
 */
const MIN_DIGIT_HEIGHT = 3

/**
 * Maximum gap (in pixels) between consecutive digit blobs along the x axis.
 * If blobs are farther apart than this they probably belong to separate "words"
 * (shouldn't happen for quantities, but guards against runaway parsing).
 */
const MAX_INTER_DIGIT_GAP = 10

// ---------------------------------------------------------------------------
// Primary export
// ---------------------------------------------------------------------------

/**
 * Extract the quantity number from an inventory cell image.
 *
 * @param cellImageData - Full ImageData for the cell (from canvas.getContext('2d').getImageData).
 * @param cellWidth     - Width of the cell in pixels.
 * @param cellHeight    - Height of the cell in pixels.
 * @returns QuantityResult with the parsed quantity (null = treat as 1).
 */
export function extractQuantity(
  cellImageData: ImageData,
  cellWidth: number,
  cellHeight: number,
): QuantityResult {
  const NO_RESULT: QuantityResult = {
    quantity: null,
    confidence: 0,
    region: { x: 0, y: 0, width: 0, height: 0 },
  }

  if (cellWidth <= 0 || cellHeight <= 0) return NO_RESULT

  // Step 1: Determine the quantity region (top-left corner).
  const regionW = Math.max(1, Math.round(cellWidth * REGION_LEFT_FRAC))
  const regionH = Math.max(1, Math.round(cellHeight * REGION_TOP_FRAC))
  const regionX = 0
  const regionY = 0

  // Step 2: Extract a binary (thresholded) bitmap for the region.
  const bitmap = thresholdRegion(cellImageData, cellWidth, regionX, regionY, regionW, regionH)

  // Step 3: Find connected components (digit blobs).
  const blobs = findConnectedComponents(bitmap, regionW, regionH)

  // Step 4: Filter to plausible digit blobs.
  const digitBlobs = blobs.filter((b) => isDigitCandidate(b, regionH, regionW))

  if (digitBlobs.length === 0) return NO_RESULT

  // Step 5: Sort left-to-right.
  digitBlobs.sort((a, b) => a.minX - b.minX)

  // Step 6: Discard blobs that are too far from the group (outlier noise).
  const groupedBlobs = groupConsecutiveBlobs(digitBlobs)

  if (groupedBlobs.length === 0) return NO_RESULT

  // Step 7: Derive the bounding box of all digit blobs together.
  const groupBounds = getBoundingBox(groupedBlobs)

  // Step 8: Segment and classify each digit.
  const digits = groupedBlobs.map((blob) =>
    classifyDigitBlob(bitmap, regionW, blob, groupBounds.height),
  )

  // If any digit is unclassifiable, lower confidence but still attempt assembly.
  const unknownCount = digits.filter((d) => d === -1).length
  if (unknownCount === digits.length) return NO_RESULT

  // Replace unknowns with 0 for assembly (best-effort fallback).
  const sanitised = digits.map((d) => (d === -1 ? 0 : d))

  const quantity = sanitised.reduce((acc, d) => acc * 10 + d, 0)

  const confidence = unknownCount === 0 ? 0.9 : Math.max(0.3, 0.9 - unknownCount * 0.2)

  return {
    quantity,
    confidence,
    region: {
      x: regionX + groupBounds.minX,
      y: regionY + groupBounds.minY,
      width: groupBounds.width,
      height: groupBounds.height,
    },
  }
}

// ---------------------------------------------------------------------------
// Step 2: Threshold
// ---------------------------------------------------------------------------

/**
 * Create a flat boolean array (row-major) where true = bright pixel.
 * Only pixels within the specified rectangle of cellImageData are included.
 */
export function thresholdRegion(
  imageData: ImageData,
  cellWidth: number,
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number,
): boolean[] {
  const bitmap: boolean[] = new Array(regionW * regionH).fill(false)

  for (let y = 0; y < regionH; y++) {
    for (let x = 0; x < regionW; x++) {
      const srcX = regionX + x
      const srcY = regionY + y
      const idx = (srcY * cellWidth + srcX) * 4
      const r = imageData.data[idx]
      const g = imageData.data[idx + 1]
      const b = imageData.data[idx + 2]
      // Perceived luminance (fast approximation).
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      bitmap[y * regionW + x] = luma > BRIGHTNESS_THRESHOLD
    }
  }

  return bitmap
}

// ---------------------------------------------------------------------------
// Step 3: Connected components (union-find)
// ---------------------------------------------------------------------------

/**
 * Find connected components of bright pixels using 4-connectivity.
 * Returns a list of blob bounding boxes.
 */
export function findConnectedComponents(
  bitmap: boolean[],
  width: number,
  height: number,
): BlobBounds[] {
  // Label array: 0 = background, >0 = label id.
  const labels = new Int32Array(bitmap.length)
  let nextLabel = 1

  // Parent table for union-find.
  const parent: number[] = [0] // index 0 unused

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]] // path compression
      x = parent[x]
    }
    return x
  }

  function union(a: number, b: number): void {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[rb] = ra
  }

  // First pass: assign provisional labels.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (!bitmap[i]) continue

      const up = y > 0 ? labels[(y - 1) * width + x] : 0
      const left = x > 0 ? labels[i - 1] : 0

      if (up === 0 && left === 0) {
        labels[i] = nextLabel
        parent.push(nextLabel)
        nextLabel++
      } else if (up !== 0 && left === 0) {
        labels[i] = up
      } else if (up === 0 && left !== 0) {
        labels[i] = left
      } else {
        // Both neighbours are labelled — union them.
        labels[i] = up
        union(up, left)
      }
    }
  }

  // Second pass: resolve labels and collect bounds.
  const boundsMap = new Map<number, BlobBounds>()

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (labels[i] === 0) continue

      const root = find(labels[i])
      let b = boundsMap.get(root)
      if (!b) {
        b = { minX: x, maxX: x, minY: y, maxY: y, pixelCount: 0 }
        boundsMap.set(root, b)
      }
      if (x < b.minX) b.minX = x
      if (x > b.maxX) b.maxX = x
      if (y < b.minY) b.minY = y
      if (y > b.maxY) b.maxY = y
      b.pixelCount++
    }
  }

  return Array.from(boundsMap.values())
}

// ---------------------------------------------------------------------------
// Step 4: Filter digit candidates
// ---------------------------------------------------------------------------

function isDigitCandidate(blob: BlobBounds, regionHeight: number, regionWidth: number): boolean {
  const w = blob.maxX - blob.minX + 1
  const h = blob.maxY - blob.minY + 1
  const aspectRatio = w / h

  if (blob.pixelCount < MIN_BLOB_PIXELS) return false
  if (h < MIN_DIGIT_HEIGHT) return false

  // Very narrow tall blobs are cell-border artifacts (vertical separator lines).
  if (aspectRatio < 0.20) return false

  if (aspectRatio > MAX_DIGIT_ASPECT_RATIO) return false

  // Digit must occupy at least 20% of the region height to be plausible.
  if (h < regionHeight * 0.2) return false

  // Blobs that span more than half the region height are background/border
  // artifacts (sprite gradients, separator lines spanning the full cell).
  // Digit glyphs are typically ~25% of regionH; the threshold of 50% gives
  // ample margin while reliably rejecting the tall-artifact blobs observed
  // in both 794×658 and 722×580 screenshots.
  if (h >= regionHeight * 0.50) return false

  // Blobs spanning more than 45% of region width encompass multiple digits or a
  // border — the widest single digit (e.g. "0", "8") is well below that limit.
  if (w > regionWidth * 0.45) return false

  return true
}

// ---------------------------------------------------------------------------
// Step 6: Group consecutive blobs (reject outliers)
// ---------------------------------------------------------------------------

/**
 * Return the largest cluster of blobs that are within MAX_INTER_DIGIT_GAP of
 * each other (left-to-right).  Blobs must already be sorted by minX.
 */
function groupConsecutiveBlobs(sortedBlobs: BlobBounds[]): BlobBounds[] {
  if (sortedBlobs.length === 0) return []
  if (sortedBlobs.length === 1) return sortedBlobs

  // Build groups separated by gaps larger than MAX_INTER_DIGIT_GAP.
  const groups: BlobBounds[][] = []
  let current: BlobBounds[] = [sortedBlobs[0]]

  for (let i = 1; i < sortedBlobs.length; i++) {
    const gap = sortedBlobs[i].minX - sortedBlobs[i - 1].maxX
    if (gap <= MAX_INTER_DIGIT_GAP) {
      current.push(sortedBlobs[i])
    } else {
      groups.push(current)
      current = [sortedBlobs[i]]
    }
  }
  groups.push(current)

  // Return the group with the most blobs (rightmost in case of tie = nearest corner).
  return groups.reduce((best, g) => (g.length >= best.length ? g : best), groups[0])
}

// ---------------------------------------------------------------------------
// Step 7: Bounding box helper
// ---------------------------------------------------------------------------

interface GroupBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

function getBoundingBox(blobs: BlobBounds[]): GroupBounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  for (const b of blobs) {
    if (b.minX < minX) minX = b.minX
    if (b.minY < minY) minY = b.minY
    if (b.maxX > maxX) maxX = b.maxX
    if (b.maxY > maxY) maxY = b.maxY
  }

  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

// ---------------------------------------------------------------------------
// Step 8: Digit classification via pixel-density features
// ---------------------------------------------------------------------------

/**
 * Classify a single digit blob using pixel-density features.
 *
 * Feature vector (computed on the normalised blob bounding box):
 * - aspect: width / height
 * - fill:   pixelCount / (w * h)  — how densely packed the bright pixels are
 * - topHeavy: fraction of bright pixels in top half vs bottom half
 * - centerVoid: whether the center column + row is relatively empty (for 0/4/6/9)
 *
 * This is a rule-based nearest-neighbour classifier tuned to typical game fonts.
 * Accuracy is "good enough" for single-digit integers and common multi-digit
 * quantities.  Unknown digits return -1.
 *
 * @param bitmap      - Full thresholded bitmap of the quantity region.
 * @param regionWidth - Width of the bitmap.
 * @param blob        - Bounding box of this digit blob.
 * @param refHeight   - Reference height (group bounding box height) for normalisation.
 */
export function classifyDigitBlob(
  bitmap: boolean[],
  regionWidth: number,
  blob: BlobBounds,
  _refHeight: number,
): number {
  const w = blob.maxX - blob.minX + 1
  const h = blob.maxY - blob.minY + 1

  if (w === 0 || h === 0) return -1

  const aspect = w / h
  const totalPixels = w * h
  const fill = blob.pixelCount / totalPixels

  // Count bright pixels in the four quadrants of the blob bounding box.
  let topLeft = 0,
    topRight = 0,
    botLeft = 0,
    botRight = 0
  const midX = blob.minX + Math.floor(w / 2)
  const midY = blob.minY + Math.floor(h / 2)

  for (let y = blob.minY; y <= blob.maxY; y++) {
    for (let x = blob.minX; x <= blob.maxX; x++) {
      if (!bitmap[y * regionWidth + x]) continue
      const inLeft = x < midX
      const inTop = y < midY
      if (inTop && inLeft) topLeft++
      else if (inTop && !inLeft) topRight++
      else if (!inTop && inLeft) botLeft++
      else botRight++
    }
  }

  const topHalf = topLeft + topRight
  const botHalf = botLeft + botRight
  const leftHalf = topLeft + botLeft
  const rightHalf = topRight + botRight

  // Normalise relative to the half-pixel counts (avoid div by zero).
  const total = topHalf + botHalf || 1
  const topRatio = topHalf / total
  const symLR = Math.abs(leftHalf - rightHalf) / (leftHalf + rightHalf + 1)

  // Sample center column and center row for void detection.
  const centerCol = Math.round((blob.minX + blob.maxX) / 2)
  const centerRow = Math.round((blob.minY + blob.maxY) / 2)
  let centerColFill = 0
  for (let y = blob.minY; y <= blob.maxY; y++) {
    if (bitmap[y * regionWidth + centerCol]) centerColFill++
  }
  const centerColRatio = centerColFill / h

  let centerRowFill = 0
  for (let x = blob.minX; x <= blob.maxX; x++) {
    if (bitmap[centerRow * regionWidth + x]) centerRowFill++
  }
  const centerRowRatio = centerRowFill / w

  // -------------------------------------------------------------------------
  // Rule-based digit identification
  //
  // Rules are derived from measured pixel-font feature vectors across multiple
  // real IdleMMO inventory screenshots (794×658 and 722×580 px).  They are
  // ordered from most-distinctive to least-distinctive to avoid mismatches.
  //
  // Measured feature summary per digit (9-px tall blobs, ~6 px wide):
  //   digit | aspect | fill  | topRatio | symLR | centerCol | centerRow | notes
  //   ------+--------+-------+----------+-------+-----------+-----------+------
  //     0   |  0.78  | 0.59–0.64 | 0.45–0.46 | 0.00–0.24 | 0.44 | 0.43–0.57 | hollow
  //     1   |  0.44  | 0.56  |  0.50    |  0.76 |  1.00     |  0.50    | narrow
  //     2   |  0.67  | 0.54–0.57 | 0.48–0.49 | 0.03–0.09 | 0.56 | 0.33–0.50 | sweep
  //     3   |  0.67–0.78 | 0.49–0.63 | 0.44–0.45 | 0.16–0.23 | 0.33–0.67 | 0.43–0.50 | right
  //     4   |  0.89  | 0.40  |  0.38    |  0.17 |  0.56     |  0.38    | diagonal
  //     5   |  0.67  | 0.61  |  0.42    |  0.03 |  0.56     |  0.83    | left-top
  //     6   |  0.78  | 0.68  |  0.42    |  0.21 |  0.67     |  1.00    | round-bot
  //     7   |  0.67–0.78 | 0.38–0.41 | 0.54–0.58 | 0.17–0.40 | 0.56 | 0.29–0.33 | slash
  //     8   |  0.67  | 0.69  |  0.46    |  0.08 |  0.56     |  0.67    | double-o
  //     9   |  0.78  | 0.59–0.64 | 0.43–0.46 | 0.15–0.24 | 0.44 | 0.43–0.86 | top-ball
  // -------------------------------------------------------------------------

  // '1' — very narrow, almost entirely along center column (symLR > 0.5,
  //       centerColRatio ≈ 1.0).  Uniquely identifiable in all cases observed.
  if (aspect < 0.55 && symLR > 0.5 && centerColRatio > 0.85) return 1

  // '7' — top-heavy (topRatio > 0.50) AND sparse (fill < 0.44): the single
  //       horizontal bar at top accounts for most of the pixels.
  if (topRatio > 0.50 && fill < 0.44) return 7

  // '4' — bottom-heavy (topRatio < 0.40) AND sparse (fill < 0.46): the two
  //       diagonal strokes leave most of the bounding box empty.
  if (topRatio < 0.40 && fill < 0.46) return 4

  // '8' — dense (fill > 0.65) AND near-symmetric (symLR < 0.12) AND center-row
  //       not fully lit (centerRowRatio < 0.80 rules out '6').
  if (fill > 0.65 && symLR < 0.12 && centerRowRatio < 0.80) return 8

  // '6' — dense but not solid (0.60 < fill < 0.80) AND center-row entirely
  //       lit (centerRowRatio ≈ 1.0): the closed round bottom means the
  //       horizontal mid-row is always fully filled.  The fill ceiling of 0.80
  //       prevents a fully-solid rectangle from matching.
  if (fill > 0.60 && fill < 0.80 && centerRowRatio > 0.90) return 6

  // '5' — strongly left-heavy top (topLeft > 1.5 × topRight) AND center-row
  //       mostly lit (> 0.70): the horizontal mid-bar is nearly full and the
  //       top curves distinctly leftward.  The 1.5× threshold guards against
  //       '9' which can have topLeft ≈ topRight.
  if (topLeft > topRight * 1.5 && centerRowRatio > 0.70) return 5

  // '9' — round top ball, hollow bottom: centerColRatio < 0.52 (hollow at
  //       mid-column), center-row mostly lit (≥ 0.65) from the descending tail,
  //       fill > 0.55.  Checked before '3' because the heavy bottom-right of
  //       '9' would otherwise match the '3' rule.
  if (centerColRatio < 0.52 && centerRowRatio >= 0.65 && fill > 0.55) return 9

  // '0' — oval outline: hollow center (centerColRatio < 0.52), center-row
  //       relatively sparse (< 0.65, unlike '9'), moderate fill, and roughly
  //       symmetric bottom half (botRight ≤ 1.35 × botLeft guards against '3').
  if (centerColRatio < 0.52 && centerRowRatio < 0.65 && fill >= 0.45 && botRight <= botLeft * 1.60) return 0

  // '3' — right-heavy bottom: botRight substantially exceeds botLeft (≥ 1.4×).
  //       In all measured instances botRight ≥ 1.7 × botLeft for '3',
  //       while for '2' the ratio is ≤ 1.3.  Placed after '9' so the heavy
  //       bottom-right of '9' does not interfere.
  if (botRight > botLeft * 1.4 && topRight >= topLeft) return 3

  // '2' — diagonal sweep: top-right heavy, bottom more balanced.
  if (topRight >= topLeft) return 2

  // Default fallback.
  if (aspect < 0.5) return 1   // narrow  → probably 1
  if (fill > 0.65) return 8    // dense   → probably 8
  if (fill < 0.45) return 7    // sparse  → probably 7
  if (topRatio > 0.52) return 9
  if (topRatio < 0.42) return 4

  return -1 // genuinely unclassifiable
}
