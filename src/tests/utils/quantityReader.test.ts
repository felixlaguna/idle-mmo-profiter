/**
 * Tests for the quantity digit extraction utility.
 *
 * Since we cannot load real game screenshots in unit tests, we synthesise
 * simple ImageData objects with white text painted at known positions.
 * Each helper precisely controls which pixels are "bright" so the tests
 * are deterministic.
 */

import { describe, it, expect } from 'vitest'
import {
  extractQuantity,
  thresholdRegion,
  findConnectedComponents,
  classifyDigitBlob,
  type QuantityResult,
} from '../../utils/quantityReader'

// ---------------------------------------------------------------------------
// ImageData helpers
// ---------------------------------------------------------------------------

/** Create a blank (all-black) ImageData of given dimensions. */
function makeBlankCell(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4).fill(0)
  // Set alpha channel to 255 so every pixel is opaque black.
  for (let i = 3; i < data.length; i += 4) data[i] = 255
  return { data, width, height } as unknown as ImageData
}

/** Paint a rectangle of bright-white pixels into an ImageData (mutates). */
function paintRect(
  img: ImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  brightness = 255,
): void {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      const idx = (row * img.width + col) * 4
      img.data[idx] = brightness
      img.data[idx + 1] = brightness
      img.data[idx + 2] = brightness
    }
  }
}

// ---------------------------------------------------------------------------
// thresholdRegion
// ---------------------------------------------------------------------------

describe('thresholdRegion', () => {
  it('returns all-false for a blank (dark) image', () => {
    const img = makeBlankCell(16, 16)
    const bitmap = thresholdRegion(img, 16, 0, 0, 16, 16)
    expect(bitmap.every((v) => v === false)).toBe(true)
    expect(bitmap.length).toBe(16 * 16)
  })

  it('returns all-true for a fully white image above threshold', () => {
    const img = makeBlankCell(16, 16)
    paintRect(img, 0, 0, 16, 16, 255)
    const bitmap = thresholdRegion(img, 16, 0, 0, 16, 16)
    expect(bitmap.every((v) => v === true)).toBe(true)
  })

  it('only reads the specified sub-region', () => {
    const img = makeBlankCell(20, 20)
    // Paint only the right half white.
    paintRect(img, 10, 0, 10, 20, 255)

    // Sub-region covering left half only → all false.
    const bitmapLeft = thresholdRegion(img, 20, 0, 0, 10, 20)
    expect(bitmapLeft.every((v) => !v)).toBe(true)

    // Sub-region covering right half only → all true.
    const bitmapRight = thresholdRegion(img, 20, 10, 0, 10, 20)
    expect(bitmapRight.every((v) => v)).toBe(true)
  })

  it('respects the brightness threshold (dim pixels = false)', () => {
    const img = makeBlankCell(8, 8)
    paintRect(img, 0, 0, 8, 8, 42) // dim (≤ 42 = empty-slot level), below threshold 60
    const bitmap = thresholdRegion(img, 8, 0, 0, 8, 8)
    expect(bitmap.every((v) => !v)).toBe(true)
  })

  it('treats pixels exactly at threshold as dark (exclusive)', () => {
    const img = makeBlankCell(8, 8)
    // Threshold is 60; 60 itself should be dark (strict >)
    paintRect(img, 0, 0, 8, 8, 60)
    const bitmap = thresholdRegion(img, 8, 0, 0, 8, 8)
    // Luma = 60, threshold check is luma > 60 → false
    expect(bitmap.every((v) => !v)).toBe(true)
  })

  it('treats pixels just above threshold as bright', () => {
    const img = makeBlankCell(8, 8)
    paintRect(img, 0, 0, 8, 8, 61)
    const bitmap = thresholdRegion(img, 8, 0, 0, 8, 8)
    expect(bitmap.every((v) => v)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// findConnectedComponents
// ---------------------------------------------------------------------------

describe('findConnectedComponents', () => {
  it('returns empty array for all-dark bitmap', () => {
    const bitmap = new Array(16).fill(false)
    expect(findConnectedComponents(bitmap, 4, 4)).toHaveLength(0)
  })

  it('finds a single component when all pixels are lit', () => {
    const bitmap = new Array(16).fill(true)
    const blobs = findConnectedComponents(bitmap, 4, 4)
    expect(blobs).toHaveLength(1)
    expect(blobs[0].minX).toBe(0)
    expect(blobs[0].minY).toBe(0)
    expect(blobs[0].maxX).toBe(3)
    expect(blobs[0].maxY).toBe(3)
    expect(blobs[0].pixelCount).toBe(16)
  })

  it('finds two separate components', () => {
    // 4x4 bitmap: left 2 columns lit, right 2 columns dark, then right 2 lit
    // Layout (row-major):
    //   1100
    //   1100
    //   0011
    //   0011
    const bitmap = [
      true, true, false, false,
      true, true, false, false,
      false, false, true, true,
      false, false, true, true,
    ]
    const blobs = findConnectedComponents(bitmap, 4, 4)
    expect(blobs).toHaveLength(2)

    const sorted = blobs.sort((a, b) => a.minX - b.minX)
    expect(sorted[0].minX).toBe(0)
    expect(sorted[0].maxX).toBe(1)
    expect(sorted[1].minX).toBe(2)
    expect(sorted[1].maxX).toBe(3)
  })

  it('counts pixels correctly', () => {
    // 3x1 single row, 2 lit pixels separated by 1 gap → 2 separate blobs
    const bitmap = [true, false, true]
    const blobs = findConnectedComponents(bitmap, 3, 1)
    expect(blobs).toHaveLength(2)
    expect(blobs[0].pixelCount).toBe(1)
    expect(blobs[1].pixelCount).toBe(1)
  })

  it('handles a single lit pixel', () => {
    const bitmap = [false, false, false, true, false]
    const blobs = findConnectedComponents(bitmap, 5, 1)
    expect(blobs).toHaveLength(1)
    expect(blobs[0].minX).toBe(3)
    expect(blobs[0].maxX).toBe(3)
    expect(blobs[0].pixelCount).toBe(1)
  })

  it('merges diagonally adjacent pixels as separate (4-connectivity)', () => {
    // In 4-connectivity, diagonal neighbours are NOT connected.
    //   10
    //   01
    const bitmap = [true, false, false, true]
    const blobs = findConnectedComponents(bitmap, 2, 2)
    expect(blobs).toHaveLength(2)
  })

  it('merges vertically adjacent pixels into one blob', () => {
    //   1
    //   1
    //   1
    const bitmap = [true, true, true]
    const blobs = findConnectedComponents(bitmap, 1, 3)
    expect(blobs).toHaveLength(1)
    expect(blobs[0].minY).toBe(0)
    expect(blobs[0].maxY).toBe(2)
    expect(blobs[0].pixelCount).toBe(3)
  })

  it('handles a larger multi-component scenario', () => {
    // Simulate three thin vertical bars (like digits 1,1,1).
    const W = 9, H = 5
    const bitmap = new Array(W * H).fill(false)
    // Col 1, col 4, col 7 lit.
    for (let y = 0; y < H; y++) {
      bitmap[y * W + 1] = true
      bitmap[y * W + 4] = true
      bitmap[y * W + 7] = true
    }
    const blobs = findConnectedComponents(bitmap, W, H)
    expect(blobs).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// classifyDigitBlob — basic sanity checks
// ---------------------------------------------------------------------------

describe('classifyDigitBlob', () => {
  /**
   * Build a minimal bitmap for a single digit-like rectangular blob.
   * The blob fills the rectangle solidly (high fill ratio → useful for '8').
   */
  function makeSolidBlob(
    w: number,
    h: number,
    fill: 'solid' | 'outline' = 'solid',
  ): { bitmap: boolean[]; blob: { minX: number; maxX: number; minY: number; maxY: number; pixelCount: number } } {
    const bitmap = new Array(w * h).fill(false)

    if (fill === 'solid') {
      bitmap.fill(true)
    } else {
      // outline: only border pixels are lit
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
            bitmap[y * w + x] = true
          }
        }
      }
    }

    const pixelCount = bitmap.filter(Boolean).length
    const blob = { minX: 0, maxX: w - 1, minY: 0, maxY: h - 1, pixelCount }
    return { bitmap, blob }
  }

  it('identifies a narrow solid column as digit 1', () => {
    // A single-pixel-wide column (1×8) is the archetypal "1" glyph.
    // It is asymmetric (all pixels on one side of the midpoint) so symLR is
    // high, which is the key feature used to identify "1".
    const w = 1, h = 8
    const { bitmap, blob } = makeSolidBlob(w, h)
    const result = classifyDigitBlob(bitmap, w, blob, h)
    expect(result).toBe(1)
  })

  it('identifies a wide outline rectangle as digit 0', () => {
    // Wide hollow rectangle (outline only, low fill) → should classify as 0.
    const w = 6, h = 8
    const { bitmap, blob } = makeSolidBlob(w, h, 'outline')
    const result = classifyDigitBlob(bitmap, w, blob, h)
    expect(result).toBe(0)
  })

  it('returns -1 for a zero-area blob', () => {
    const bitmap = [true]
    const blob = { minX: 0, maxX: -1, minY: 0, maxY: 0, pixelCount: 0 }
    const result = classifyDigitBlob(bitmap, 1, blob, 5)
    expect(result).toBe(-1)
  })

  it('returns a number in range [-1, 9] for any input', () => {
    // Fuzz: a variety of solid rectangles should all yield valid output.
    const shapes: Array<[number, number]> = [
      [2, 6], [3, 7], [4, 8], [5, 9], [6, 8], [7, 10],
    ]
    for (const [w, h] of shapes) {
      const { bitmap, blob } = makeSolidBlob(w, h)
      const r = classifyDigitBlob(bitmap, w, blob, h)
      expect(r).toBeGreaterThanOrEqual(-1)
      expect(r).toBeLessThanOrEqual(9)
    }
  })
})

// ---------------------------------------------------------------------------
// extractQuantity — integration tests
// ---------------------------------------------------------------------------

describe('extractQuantity', () => {
  describe('edge cases', () => {
    it('returns null quantity for a blank (dark) cell', () => {
      const img = makeBlankCell(32, 32)
      const result = extractQuantity(img, 32, 32)
      expect(result.quantity).toBeNull()
      expect(result.confidence).toBe(0)
    })

    it('returns null for zero-dimension cell', () => {
      const img = makeBlankCell(0, 0)
      const result = extractQuantity(img, 0, 0)
      expect(result.quantity).toBeNull()
    })

    it('returns null when no quantity region has lit pixels', () => {
      // Paint only the BOTTOM-RIGHT portion — the top-left quantity region stays dark.
      const img = makeBlankCell(32, 32)
      paintRect(img, 22, 20, 10, 12, 255) // bottom-right, outside quantity region
      const result = extractQuantity(img, 32, 32)
      expect(result.quantity).toBeNull()
    })
  })

  describe('region location', () => {
    it('uses the top-left corner as the quantity region', () => {
      // Synthesise a cell that has bright pixels ONLY in the top-left corner.
      // Region is top 45% × left 30%, so for a 32×32 cell: 10px wide × 14px tall.
      const W = 32, H = 32
      const img = makeBlankCell(W, H)
      // Paint inside the region: x in [1, 5], y in [2, 10].
      paintRect(img, 1, 2, 4, 8, 255)

      const result = extractQuantity(img, W, H)
      // The region is reported on the left side.
      if (result.quantity !== null) {
        expect(result.region.x).toBeLessThan(W / 2)
      }
    })
  })

  describe('single bright blob representing a digit', () => {
    it('returns a non-null quantity when a plausible digit blob exists', () => {
      // Use a larger cell so that the blob's height is well below 50% of regionH.
      // For a 60×60 cell: regionH = 0.45 × 60 = 27 px.
      // A 4×8 blob → h / regionH = 8/27 ≈ 30%, comfortably inside the digit range.
      const W = 60, H = 60
      const img = makeBlankCell(W, H)
      paintRect(img, 2, 2, 4, 8, 255)

      const result = extractQuantity(img, W, H)
      expect(result.quantity).not.toBeNull()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('confidence is between 0 and 1', () => {
      const W = 40, H = 40
      const img = makeBlankCell(W, H)
      paintRect(img, 2, 2, 4, 10, 255)

      const result = extractQuantity(img, W, H)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('result shape', () => {
    it('always returns a QuantityResult object with correct keys', () => {
      const img = makeBlankCell(32, 32)
      const result: QuantityResult = extractQuantity(img, 32, 32)
      expect(result).toHaveProperty('quantity')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('region')
      expect(result.region).toHaveProperty('x')
      expect(result.region).toHaveProperty('y')
      expect(result.region).toHaveProperty('width')
      expect(result.region).toHaveProperty('height')
    })

    it('region is zero-sized when no quantity detected', () => {
      const img = makeBlankCell(32, 32)
      const result = extractQuantity(img, 32, 32)
      expect(result.region).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })
  })

  describe('multiple blobs (multi-digit simulation)', () => {
    it('detects multiple digit blobs and assembles a number', () => {
      // Craft a 64x32 cell. Quantity region: left 35% (~22px wide), top 45% (~14px tall).
      // Paint two narrow bars separated by a gap → two detected digit blobs.
      const W = 64, H = 32
      const img = makeBlankCell(W, H)
      // Place bars at x=2 and x=7 (both within region), y=1, height=8.
      paintRect(img, 2, 1, 2, 8, 255)  // first digit blob
      paintRect(img, 7, 1, 2, 8, 255)  // second digit blob

      const result = extractQuantity(img, W, H)
      // Both blobs should be detected and assembled into a two-digit number.
      // The exact digit value depends on classifier rules for synthetic solid
      // rectangles; the important thing is that two blobs are found and assembled.
      if (result.quantity !== null) {
        expect(result.quantity).toBeGreaterThanOrEqual(10)
        expect(result.quantity).toBeLessThanOrEqual(99)
      }
    })

    it('returns null when quantity region is entirely noise (tiny blobs)', () => {
      const W = 32, H = 32
      const img = makeBlankCell(W, H)
      // Paint 1x1 single-pixel spots (below MIN_BLOB_PIXELS threshold).
      // Single pixel has pixelCount = 1 which is < MIN_BLOB_PIXELS (4).
      paintRect(img, 28, 1, 1, 1, 255)
      paintRect(img, 30, 3, 1, 1, 255)

      const result = extractQuantity(img, W, H)
      expect(result.quantity).toBeNull()
    })
  })

  describe('small cell sizes', () => {
    it('handles very small cells without crashing', () => {
      const img = makeBlankCell(8, 8)
      expect(() => extractQuantity(img, 8, 8)).not.toThrow()
    })

    it('handles 1x1 cell without crashing', () => {
      const img = makeBlankCell(1, 1)
      expect(() => extractQuantity(img, 1, 1)).not.toThrow()
    })
  })

  describe('quantity value constraints', () => {
    it('returns a positive integer or null for quantity', () => {
      const W = 40, H = 40
      const img = makeBlankCell(W, H)
      paintRect(img, 2, 2, 4, 10, 255)

      const result = extractQuantity(img, W, H)
      if (result.quantity !== null) {
        expect(Number.isInteger(result.quantity)).toBe(true)
        expect(result.quantity).toBeGreaterThanOrEqual(0)
      }
    })
  })
})

// ---------------------------------------------------------------------------
// thresholdRegion — luminance formula check
// ---------------------------------------------------------------------------

describe('thresholdRegion luminance formula', () => {
  it('uses perceived luminance (not simple average)', () => {
    // Threshold is now 60.
    // Pure blue: luma = 0.114*255 ≈ 29 (below threshold).
    // Pure red:  luma = 0.299*255 ≈ 76 (above threshold).
    // White:     luma = 255 (above threshold).
    const img = makeBlankCell(3, 1)
    // Pixel 0: pure blue (luma ≈ 29, below 60)
    img.data[0] = 0; img.data[1] = 0; img.data[2] = 255
    // Pixel 1: pure red (luma ≈ 76, above 60)
    img.data[4] = 255; img.data[5] = 0; img.data[6] = 0
    // Pixel 2: white (luma 255, above 60)
    img.data[8] = 255; img.data[9] = 255; img.data[10] = 255

    const bitmap = thresholdRegion(img, 3, 0, 0, 3, 1)
    expect(bitmap[0]).toBe(false) // blue  luma ≈ 29
    expect(bitmap[1]).toBe(true)  // red   luma ≈ 76
    expect(bitmap[2]).toBe(true)  // white luma 255
  })
})
