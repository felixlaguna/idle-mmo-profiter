/**
 * Client-side dHash computation for browser-rendered inventory cells.
 *
 * Computes a 192-bit difference hash (dHash) from an inventory cell ImageData,
 * applying the same slot-rendering pipeline used by
 * scripts/generate-sprite-hashes-browser.ts so that hashes from live
 * screenshots match the pre-built sprite-hashes.json database.
 *
 * 192-bit hash = 64-bit luminance dHash (16-char hex)
 *              + 64-bit (R-B) dHash (16-char hex)
 *              + 64-bit (G-B) dHash (16-char hex)
 * Stored as a 48-character hex string.
 *
 * The third (G-B) channel separates red items (G-B ≈ 0) from orange items
 * (G-B > 0), which were previously indistinguishable at the 128-bit level.
 *
 * dHash algorithm (center-crop pipeline):
 *   1. Crop the center CANONICAL_SPRITE_SIZE × CANONICAL_SPRITE_SIZE region
 *      from the input cell.  Because the game sprite is always centered in the
 *      slot, this isolates the sprite content on BOTH the DB render side (where
 *      the slot is 84×64) and the screenshot side (where the inset cell is ~78×57).
 *   2. Resize the center crop to 9×8 using Canvas drawImage (bilinear).
 *   3. Compute 64-bit luminance dHash: 0.299R + 0.587G + 0.114B (Rec.709).
 *   4. Compute 64-bit (R-B) dHash: R channel - B channel.
 *   5. Compute 64-bit (G-B) dHash: G channel - B channel.
 *   6. Concatenate all three 16-char hex strings → 48-char hex.
 *
 * Why center-crop instead of bbox detection:
 *   JPEG-compressed screenshots inflate the detected bbox by ~10px in each
 *   dimension relative to clean DB renders, causing Hamming distances of 40+
 *   (vs 10-25 with center-crop).  Since all IdleMMO sprites are centered in
 *   their slots, center-crop gives a deterministic, JPEG-robust equivalent.
 *
 * The bbox detection functions (detectSpriteBBox, sampleCornerColors, cropToBBox)
 * are still exported as public utilities for callers that need them.
 *
 * The canonical sprite size and all constants MUST stay in sync with:
 *   scripts/generate-sprite-hashes-browser.ts
 *
 * No external dependencies — pure Canvas API only.
 */

// ---------------------------------------------------------------------------
// Constants (must match scripts/generate-sprite-hashes-browser.ts)
// ---------------------------------------------------------------------------

/**
 * Proportional sprite crop fractions.
 *
 * The game renders a 48×48 sprite image centred inside an 84×64 slot.
 * To extract the sprite region from a cell of any size we crop a proportional
 * rectangle whose dimensions are (width × SPRITE_WIDTH_FRAC) × (height ×
 * SPRITE_HEIGHT_FRAC), then downscale that crop to CANONICAL_SPRITE_SIZE before
 * hashing.  Using fractions instead of a fixed 48-pixel crop means large
 * phone-scale cells (~300×260 px) get the full sprite area rather than just a
 * tiny 48×48 centre patch.
 *
 * SPRITE_WIDTH_FRAC  = 48 / 84  ≈ 0.571  (sprite : slot width)
 * SPRITE_HEIGHT_FRAC = 48 / 64  = 0.75   (sprite : slot height)
 *
 * Both fractions MUST match the values used in
 * scripts/generate-sprite-hashes-browser.ts.
 */
export const SPRITE_WIDTH_FRAC  = 48 / 84   // ~0.5714
export const SPRITE_HEIGHT_FRAC = 48 / 64   // 0.75

/**
 * Canonical sprite size. After bounding-box detection and cropping, the sprite
 * is resized to this square before hashing. Matches the game's w-12 h-12 (48×48).
 *
 * This replaces the old CANONICAL_W/H slot-size approach. By cropping to just
 * the sprite pixels on both DB renders and screenshot cells, the sprite-to-frame
 * ratio difference is eliminated entirely.
 */
export const CANONICAL_SPRITE_SIZE = 48

/**
 * @deprecated Use CANONICAL_SPRITE_SIZE instead. Kept for backwards compatibility.
 * The old approach resized the whole 84×64 slot to the hash grid; now we
 * center-crop to CANONICAL_SPRITE_SIZE first.
 */
export const CANONICAL_W = 84
/**
 * @deprecated Use CANONICAL_SPRITE_SIZE instead. Kept for backwards compatibility.
 */
export const CANONICAL_H = 64

/**
 * dHash grid dimensions. Width is 9 so we get 8 horizontal-difference
 * bits per row × 8 rows = 64 bits per channel → 32-char hex total.
 */
export const DHASH_GRID_W = 9
export const DHASH_GRID_H = 8

/**
 * Corner masking removed — the quantity badge and tier number are small
 * relative to the 48×48 sprite and at 9×8 hash resolution they affect at
 * most 1-2 bits.  Masking 9+ of 64 bits was causing gradient-background
 * mythic items to produce identical hashes.
 *
 * @deprecated These constants are kept for backwards compatibility only.
 *             All masking has been removed from the hash computation.
 */
export const MASK_TL_ROWS = 0
export const MASK_TL_COLS = 0
export const MASK_BR_ROWS = 0
export const MASK_BR_COLS = 0

/**
 * Slot background for the "standard" quality tier.
 * Used to fill the canonical canvas; must match the reference rendering.
 */
const SLOT_BG = { r: 22, g: 29, b: 42 } // rgb(22,29,42)

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect the dark left margin in a cell ImageData.
 *
 * Scans the cell's horizontal centre row and returns the number of leading
 * dark pixels.  Used by computeDHash to centre the crop within the actual
 * slot content area rather than the full cell width.
 *
 * @param cellImageData - Raw RGBA ImageData for one inventory cell.
 * @param effectiveH    - Effective slot height (refH for merged-row cells).
 * @returns Number of leading dark pixels (0 if no dark margin detected).
 */
export function detectLeftMargin(cellImageData: ImageData, effectiveH: number): number {
  const { width } = cellImageData

  // Threshold chosen to distinguish UI chrome from slot background:
  //   UI chrome (device status bar / page bg): rgb(19,23,35) → luma ≈ 23
  //   Standard slot background:                rgb(22,29,42) → luma ≈ 28
  //   Refined slot background:                 rgb(21,41,81) → luma ≈ 40
  //
  // 26 accepts standard slot bg (28 ≥ 26) while rejecting UI chrome (23 < 26).
  // The previous value of 30 caused the entire standard-quality slot background
  // to register as "dark margin" because 28 < 30, shifting all phone cell crops.
  const DARK_LUMA_THRESHOLD = 26
  const sampleY = Math.round(effectiveH / 2)
  const rawData = cellImageData.data
  let leftMargin = 0
  for (let x = 0; x < Math.min(width, 200); x++) {
    const idx = (sampleY * width + x) * 4
    const luma = (rawData[idx] * 299 + rawData[idx + 1] * 587 + rawData[idx + 2] * 114) / 1000
    if (luma >= DARK_LUMA_THRESHOLD) break
    leftMargin = x + 1
  }
  return leftMargin
}

/**
 * Compute a 128-bit dHash fingerprint from a raw inventory cell ImageData.
 *
 * The input should be the inset cell image (borders/gap pixels already removed)
 * as extracted by gridDetector.ts with the standard inset (13px left, 1px right,
 * 9px top, 8px bottom). The function handles canonical resize and the 9×8 hash
 * grid internally.
 *
 * @param cellImageData - Raw RGBA ImageData for one inventory cell.
 * @param quality       - Optional quality tier string (e.g. "standard", "epic").
 *                        If omitted, defaults to "standard". Used to pick the
 *                        correct background colour for the canvas fill.
 * @returns 48-character hex dHash string (192 bits), or null on canvas failure.
 */
export function computeDHash(
  cellImageData: ImageData,
  quality?: string,
  referenceHeight?: number,
): string | null {
  let { width, height } = cellImageData

  if (width <= 0 || height <= 0) return null

  const bg = quality ? qualityBackground(quality) : SLOT_BG

  // Step 0: Normalize cell to canonical slot size so hashes match the DB.
  //
  // Desktop cells larger than 1.5× the canonical slot (84×64) are resized
  // to 84×64 before hashing.  Cells already at or below canonical size
  // need no resize.
  //
  // Phone support is not implemented — phone screenshots produce cells that
  // are much wider than CANONICAL_W and would require a separate DB hash set.
  if (width > CANONICAL_W * 1.5 || height > CANONICAL_H * 1.5) {
    // Desktop-oversized cell — resize to canonical desktop slot 84×64.
    const resizeCanvas = createOffscreen(width, height)
    const resizeCtx = resizeCanvas.getContext('2d') as CanvasRenderingContext2D | null
    if (!resizeCtx) return null
    resizeCtx.putImageData(cellImageData, 0, 0)

    const canonSlotCanvas = createOffscreen(CANONICAL_W, CANONICAL_H)
    const canonSlotCtx = canonSlotCanvas.getContext('2d') as CanvasRenderingContext2D | null
    if (!canonSlotCtx) return null
    canonSlotCtx.drawImage(
      resizeCanvas as unknown as CanvasImageSource,
      0, 0, CANONICAL_W, CANONICAL_H,
    )
    cellImageData = canonSlotCtx.getImageData(0, 0, CANONICAL_W, CANONICAL_H)
    width = CANONICAL_W
    height = CANONICAL_H
  }

  // Step 1: Put the cell on a temp canvas.
  const tmpCanvas = createOffscreen(width, height)
  const tmpCtx = tmpCanvas.getContext('2d') as CanvasRenderingContext2D | null
  if (!tmpCtx) return null
  tmpCtx.putImageData(cellImageData, 0, 0)

  // Step 2: Proportional square center-crop → resize to CANONICAL_SPRITE_SIZE × CANONICAL_SPRITE_SIZE.
  //
  // After the Step 0 resize, all cells are at most 84×64, so the proportional
  // crop always reduces to the canonical 48×48 region (SPRITE_WIDTH_FRAC×84=48,
  // SPRITE_HEIGHT_FRAC×64=48).  The referenceHeight logic is preserved for the
  // merged-row case where height may be ~2× refH even after resize.
  const refH = referenceHeight ?? CANONICAL_H
  const effectiveH = (height > refH * 1.5) ? refH : height

  const cropW = Math.max(CANONICAL_SPRITE_SIZE, Math.round(width     * SPRITE_WIDTH_FRAC))
  const cropH = Math.max(CANONICAL_SPRITE_SIZE, Math.round(effectiveH * SPRITE_HEIGHT_FRAC))
  const cropSize = Math.min(cropW, cropH)

  // Detect any dark left margin and centre the crop within the content area
  // (cell width minus the dark margin).
  const leftMargin = detectLeftMargin(cellImageData, effectiveH)
  const contentWidth = width - leftMargin
  const cropX = leftMargin + Math.round((contentWidth - cropSize) / 2)

  // cropY strategy expressed relative to effectiveH:
  //   • Very short cells (effectiveH < refH*0.6): sprite is top-aligned → 0
  //   • cropSize ≥ effectiveH: crop fills the slot — centre in full cell
  //   • Tall cells (height > refH+5, non-merged): skip separator, then centre
  //   • Normal/merged: centre within effectiveH window at top of cell
  let cropY: number
  if (effectiveH < refH * 0.6) {
    // Very short row (e.g. partial trailing row on desktop): sprite at top.
    cropY = 0
  } else if (cropSize >= effectiveH) {
    // crop covers the whole slot — centre in the full cell height.
    cropY = Math.round((height - cropSize) / 2)
  } else if (height > refH + 5 && effectiveH === height) {
    // Tall cell (non-merged): skip the separator border, then centre within refH.
    // Guard: when cropSize >= refH the offset formula (refH - cropSize)/2 goes
    // negative, cropping the bottom border instead of the sprite centre.
    // In that case just centre the crop within the full cell height.
    if (cropSize >= refH) {
      cropY = Math.round((height - cropSize) / 2)
    } else {
      cropY = (height - refH) + Math.round((refH - cropSize) / 2) + 1
    }
  } else {
    // Normal cell or merged-row: centre cropSize within the top effectiveH pixels.
    cropY = Math.round((effectiveH - cropSize) / 2)
  }

  const safeCropX = Math.max(0, Math.min(cropX, width  - cropSize))
  const safeCropY = Math.max(0, Math.min(cropY, height - cropSize))

  const canonicalCanvas = createOffscreen(CANONICAL_SPRITE_SIZE, CANONICAL_SPRITE_SIZE)
  const canonicalCtx = canonicalCanvas.getContext('2d') as CanvasRenderingContext2D | null
  if (!canonicalCtx) return null

  // Fill background first (handles transparent edges / cells smaller than 48px).
  canonicalCtx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`
  canonicalCtx.fillRect(0, 0, CANONICAL_SPRITE_SIZE, CANONICAL_SPRITE_SIZE)

  // Resize the proportional square crop to CANONICAL_SPRITE_SIZE × CANONICAL_SPRITE_SIZE.
  canonicalCtx.drawImage(
    tmpCanvas as unknown as CanvasImageSource,
    safeCropX, safeCropY, cropSize, cropSize,
    0, 0, CANONICAL_SPRITE_SIZE, CANONICAL_SPRITE_SIZE,
  )

  // Step 3: Resize to DHASH_GRID_W × DHASH_GRID_H (bilinear via drawImage).
  const smallCanvas = createOffscreen(DHASH_GRID_W, DHASH_GRID_H)
  const smallCtx = smallCanvas.getContext('2d') as CanvasRenderingContext2D | null
  if (!smallCtx) return null
  smallCtx.drawImage(
    canonicalCanvas as unknown as CanvasImageSource,
    0, 0,
    DHASH_GRID_W, DHASH_GRID_H,
  )

  // Step 4: Extract pixels.
  const pixels = smallCtx.getImageData(0, 0, DHASH_GRID_W, DHASH_GRID_H).data
  const nPx = DHASH_GRID_W * DHASH_GRID_H

  // Build luminance (grayscale), (R-B), and (G-B) channel arrays.
  const luma = new Uint8Array(nPx)
  const rb   = new Int16Array(nPx) // R-B can be negative, use Int16
  const gb   = new Int16Array(nPx) // G-B can be negative, use Int16

  for (let i = 0; i < nPx; i++) {
    const base = i * 4
    const r = pixels[base]
    const g = pixels[base + 1]
    const b = pixels[base + 2]
    luma[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    rb[i]   = r - b  // range -255..255
    gb[i]   = g - b  // range -255..255; red≈0, orange>0
  }

  // Step 5: Compute 192-bit hash: luma (64 bits) + (R-B) (64 bits) + (G-B) (64 bits).
  const lumaHex = bitsToHex(computeDiffBitsFromLuma(luma))
  const rbHex   = bitsToHex(computeDiffBitsFromRB(rb))
  const gbHex   = bitsToHex(computeDiffBitsFromGB(gb))

  return lumaHex + rbHex + gbHex
}

/**
 * Compute dHash from a pre-extracted 9×8 grayscale pixel array.
 *
 * Useful for testing without a real canvas. Applies the same masking as
 * computeDHash() — masked positions produce a 0 bit.
 *
 * @param gray9x8 - Uint8Array of 72 grayscale values in row-major order.
 * @returns 16-character hex dHash string (64-bit luminance only).
 */
export function computeDHashFromGray(gray9x8: Uint8Array): string {
  if (gray9x8.length !== DHASH_GRID_W * DHASH_GRID_H) {
    throw new Error(
      `computeDHashFromGray: expected ${DHASH_GRID_W * DHASH_GRID_H} bytes, ` +
        `got ${gray9x8.length}`,
    )
  }
  return bitsToHex(computeDiffBitsFromLuma(gray9x8))
}

/**
 * Compute the Hamming distance between two dHash strings.
 *
 * Supports 16-character (64-bit), 32-character (128-bit), and
 * 48-character (192-bit) hex strings.
 * Returns the number of bit positions that differ (0 = identical).
 * Returns max distance when either hash is invalid (different lengths / non-hex).
 */
export function hammingDistance(hashA: string, hashB: string): number {
  const len = hashA.length
  if (len !== hashB.length) {
    // Return the max bits for the longer hash on mismatch
    const maxLen = Math.max(len, hashB.length)
    return maxLen * 4
  }
  if (len !== 16 && len !== 32 && len !== 48) return 64

  const maxDist = len * 4 // 64, 128, or 192
  let dist = 0
  // Process 4 hex chars (16 bits) at a time
  for (let i = 0; i < len; i += 4) {
    const a = parseInt(hashA.slice(i, i + 4), 16)
    const b = parseInt(hashB.slice(i, i + 4), 16)
    if (isNaN(a) || isNaN(b)) return maxDist
    dist += popcount16(a ^ b)
  }
  return dist
}

// ---------------------------------------------------------------------------
// Color fingerprint (phone matching)
// ---------------------------------------------------------------------------

/**
 * Compute the average [R, G, B] color over the same crop region that
 * `computeDHash` uses.  This is JPEG-robust at large phone cell sizes where
 * dHash bit-flip rates are too high for reliable matching.
 *
 * Returns null if the canvas API is unavailable.
 *
 * @param cellImageData   - Source ImageData (the full cell image).
 * @param referenceHeight - Reference slot height for merged-row cells.
 * @param leftMargin      - Dark left-margin pixels (from detectLeftMargin).
 * @returns Average [R, G, B] over the proportional crop region, or null.
 */
export function computeCellColor(
  cellImageData: ImageData,
  referenceHeight?: number,
  leftMargin = 0,
): [number, number, number] | null {
  const { width, height } = cellImageData
  if (width <= 0 || height <= 0) return null

  const refH = referenceHeight ?? CANONICAL_H
  const effectiveH = (height > refH * 1.5) ? refH : height

  const cropW = Math.max(CANONICAL_SPRITE_SIZE, Math.round(width     * SPRITE_WIDTH_FRAC))
  const cropH = Math.max(CANONICAL_SPRITE_SIZE, Math.round(effectiveH * SPRITE_HEIGHT_FRAC))
  const cropSize = Math.min(cropW, cropH)

  const contentWidth = width - leftMargin
  const cropX = leftMargin + Math.round((contentWidth - cropSize) / 2)

  let cropY: number
  if (effectiveH < refH * 0.6) {
    cropY = 0
  } else if (cropSize >= effectiveH) {
    cropY = Math.round((height - cropSize) / 2)
  } else if (height > refH + 5 && effectiveH === height) {
    // Guard: when cropSize >= refH the offset goes negative — centre in full cell instead.
    if (cropSize >= refH) {
      cropY = Math.round((height - cropSize) / 2)
    } else {
      cropY = (height - refH) + Math.round((refH - cropSize) / 2) + 1
    }
  } else {
    cropY = Math.round((effectiveH - cropSize) / 2)
  }

  const safeCropX = Math.max(0, Math.min(cropX, width  - cropSize))
  const safeCropY = Math.max(0, Math.min(cropY, height - cropSize))

  // Sum RGB values over the crop region directly from cellImageData (no canvas needed).
  const data = cellImageData.data
  let sumR = 0, sumG = 0, sumB = 0
  let count = 0

  for (let row = safeCropY; row < safeCropY + cropSize; row++) {
    for (let col = safeCropX; col < safeCropX + cropSize; col++) {
      const i = (row * width + col) * 4
      sumR += data[i]
      sumG += data[i + 1]
      sumB += data[i + 2]
      count++
    }
  }

  if (count === 0) return null
  return [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)]
}

// ---------------------------------------------------------------------------
// Sprite bounding-box detection (public API)
// ---------------------------------------------------------------------------

/**
 * Sample the corner pixels of an ImageData to estimate the background color.
 *
 * Takes the top-left, top-right, bottom-left, and bottom-right N×N regions
 * and returns an array of sampled {r, g, b} values. These are used as
 * reference background colors for detectSpriteBBox — any pixel close to any
 * corner sample is treated as background.
 *
 * This handles gradient backgrounds (mythic, unique) gracefully: instead of
 * a single bg color, all four corners are sampled.
 *
 * @param imageData  - Source ImageData (the full cell image).
 * @param cornerSize - Number of pixels from each corner to sample (default 5).
 * @returns Array of {r, g, b} corner color samples.
 */
export function sampleCornerColors(
  imageData: ImageData,
  cornerSize = 5,
): Array<{ r: number; g: number; b: number }> {
  const { width, height, data } = imageData
  const samples: Array<{ r: number; g: number; b: number }> = []
  const cs = Math.min(cornerSize, Math.floor(width / 2), Math.floor(height / 2))

  for (let cy = 0; cy < cs; cy++) {
    for (let cx = 0; cx < cs; cx++) {
      // Top-left
      const tlIdx = (cy * width + cx) * 4
      samples.push({ r: data[tlIdx], g: data[tlIdx + 1], b: data[tlIdx + 2] })

      // Top-right
      const trIdx = (cy * width + (width - 1 - cx)) * 4
      samples.push({ r: data[trIdx], g: data[trIdx + 1], b: data[trIdx + 2] })

      // Bottom-left
      const blIdx = ((height - 1 - cy) * width + cx) * 4
      samples.push({ r: data[blIdx], g: data[blIdx + 1], b: data[blIdx + 2] })

      // Bottom-right
      const brIdx = ((height - 1 - cy) * width + (width - 1 - cx)) * 4
      samples.push({ r: data[brIdx], g: data[brIdx + 1], b: data[brIdx + 2] })
    }
  }

  return samples
}

/**
 * Detect the bounding box of non-background pixels in an ImageData.
 *
 * For each pixel, checks if its color is "far enough" from all background
 * samples (measured by Euclidean distance in RGB space). If the distance to
 * every sample exceeds `threshold`, the pixel is considered foreground.
 *
 * @param imageData  - Source ImageData to scan.
 * @param bgSamples  - Array of background color samples from sampleCornerColors.
 * @param threshold  - Euclidean RGB distance threshold (default 40). Pixels
 *                     closer than this to ANY background sample are treated as bg.
 * @returns Bounding box {x, y, w, h} of foreground pixels, or null if none found.
 */
export function detectSpriteBBox(
  imageData: ImageData,
  bgSamples: Array<{ r: number; g: number; b: number }>,
  threshold = 40,
): { x: number; y: number; w: number; h: number } | null {
  const { width, height, data } = imageData
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const pr = data[idx]
      const pg = data[idx + 1]
      const pb = data[idx + 2]

      // Check if this pixel is "far" from all background samples.
      let isForeground = true
      for (const bg of bgSamples) {
        const dr = pr - bg.r
        const dg = pg - bg.g
        const db = pb - bg.b
        const dist = Math.sqrt(dr * dr + dg * dg + db * db)
        if (dist <= threshold) {
          isForeground = false
          break
        }
      }

      if (isForeground) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return null // No foreground detected.
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * Crop a canvas to the given bounding box.
 *
 * Returns a new offscreen canvas containing only the pixels within the bbox.
 *
 * @param sourceCanvas - The canvas to crop from.
 * @param bbox         - {x, y, w, h} bounding box.
 * @returns New canvas containing the cropped region.
 */
export function cropToBBox(
  sourceCanvas: HTMLCanvasElement,
  bbox: { x: number; y: number; w: number; h: number },
): HTMLCanvasElement {
  const { x, y, w, h } = bbox
  const cropped = createOffscreen(w, h)
  const ctx = cropped.getContext('2d') as CanvasRenderingContext2D | null
  if (!ctx) return sourceCanvas // fallback

  ctx.drawImage(
    sourceCanvas as unknown as CanvasImageSource,
    x, y, w, h,
    0, 0, w, h,
  )
  return cropped
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute horizontal difference bits from a grayscale 9×8 pixel array.
 * Returns an array of 64 bits (0 or 1).
 */
function computeDiffBitsFromLuma(gray: Uint8Array): number[] {
  const outW = DHASH_GRID_W - 1 // 8
  const outH = DHASH_GRID_H // 8

  const bits: number[] = []
  for (let row = 0; row < outH; row++) {
    for (let col = 0; col < outW; col++) {
      const left = gray[row * DHASH_GRID_W + col]
      const right = gray[row * DHASH_GRID_W + col + 1]
      bits.push(left < right ? 1 : 0)
    }
  }
  return bits
}

/**
 * Compute horizontal difference bits from a (R-B) channel 9×8 pixel array.
 * Returns an array of 64 bits (0 or 1).
 */
function computeDiffBitsFromRB(rb: Int16Array): number[] {
  const outW = DHASH_GRID_W - 1 // 8
  const outH = DHASH_GRID_H // 8

  const bits: number[] = []
  for (let row = 0; row < outH; row++) {
    for (let col = 0; col < outW; col++) {
      const left = rb[row * DHASH_GRID_W + col]
      const right = rb[row * DHASH_GRID_W + col + 1]
      bits.push(left < right ? 1 : 0)
    }
  }
  return bits
}

/**
 * Compute horizontal difference bits from a (G-B) channel 9×8 pixel array.
 * Returns an array of 64 bits (0 or 1).
 *
 * This channel separates red items (G≈0, so G-B≈0) from orange items
 * (G is mid-range, so G-B>0), which have similar luminance and R-B values.
 */
function computeDiffBitsFromGB(gb: Int16Array): number[] {
  const outW = DHASH_GRID_W - 1 // 8
  const outH = DHASH_GRID_H // 8

  const bits: number[] = []
  for (let row = 0; row < outH; row++) {
    for (let col = 0; col < outW; col++) {
      const left = gb[row * DHASH_GRID_W + col]
      const right = gb[row * DHASH_GRID_W + col + 1]
      bits.push(left < right ? 1 : 0)
    }
  }
  return bits
}

/**
 * Pack 64 bits into a 16-character lowercase hex string.
 */
function bitsToHex(bits: number[]): string {
  let hex = ''
  for (let i = 0; i < 64; i += 4) {
    const nibble =
      (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]
    hex += nibble.toString(16)
  }
  return hex
}

/**
 * Return the background RGBA for a given quality tier.
 * Only the "standard" solid colour is used for masked regions.
 * Gradient backgrounds (mythic, unique) are approximated as the start colour.
 */
function qualityBackground(quality: string): { r: number; g: number; b: number } {
  switch (quality) {
    case 'refined':
      return { r: 21, g: 41, b: 81 }
    case 'premium':
      return { r: 22, g: 56, b: 43 }
    case 'epic':
      return { r: 66, g: 29, b: 37 }
    case 'legendary':
      return { r: 61, g: 50, b: 34 }
    case 'mythic':
      return { r: 118, g: 68, b: 48 } // start of gradient #764430
    case 'unique':
      return { r: 124, g: 89, b: 142 } // start of gradient #7c598e
    default:
      return SLOT_BG
  }
}

/**
 * Create an HTMLCanvasElement or OffscreenCanvas depending on the environment.
 */
function createOffscreen(width: number, height: number): HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height) as unknown as HTMLCanvasElement
  }
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
  throw new Error('imageHash: no Canvas implementation available in this environment')
}

/**
 * Count set bits in a 16-bit integer (popcount).
 *
 * Uses Kernighan's method — O(set bits) — which avoids the 32-bit
 * multiplication overflow that affects the standard bithack in JavaScript.
 */
function popcount16(x: number): number {
  let count = 0
  x = x & 0xffff
  while (x !== 0) {
    x = x & (x - 1)
    count++
  }
  return count
}
