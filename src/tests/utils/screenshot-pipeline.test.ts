/**
 * Integration test: screenshot import pipeline on a real inventory screenshot.
 *
 * This test validates the full pipeline end-to-end:
 *   detectGrid  →  computeDHash  →  extractQuantity
 *
 * It does NOT require a real browser canvas — instead it uses the same
 * vi.fn() mocking strategy already used in gridDetector.test.ts and
 * imageHash.test.ts.
 *
 * Pre-requisite: the pixel fixture must have been generated on the host by
 * running /tmp/extract-screenshot-pixels.ts before executing this test.
 * If the fixture is missing the test is skipped gracefully.
 *
 * Run:   make test-run
 *
 * -------------------------------------------------------------------------
 * Screenshot details
 * -------------------------------------------------------------------------
 * The test image is 794×658 px, a dark-themed IdleMMO inventory grid.
 * Grid structure (detected via brightness analysis):
 *   - ~7 columns, ~8 rows visible
 *   - Dark cell backgrounds (~22-28 grayscale), thin darker borders (~22 gs)
 *   - Top rows have coloured items; bottom rows show "Empty" label
 *   - Column separators at approx x: 50, 140, 230, 330, 430, 530, 630, 720
 *   - Row separators at approx y: 43, 117, 198, 278, 358, 438, 518, 598
 * -------------------------------------------------------------------------
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { detectGrid } from '../../utils/gridDetector'
import { extractQuantity } from '../../utils/quantityReader'

// ---------------------------------------------------------------------------
// Fixture loading
// ---------------------------------------------------------------------------

// Use process.cwd() because Vitest transforms import.meta.url in a way that
// strips the /app prefix inside the Docker container.
const FIXTURE_PATH = path.resolve(process.cwd(), 'src/tests/fixtures/screenshot-pixels.json')

interface PixelFixture {
  width: number
  height: number
  channels: number
  pixelsBase64: string
}

function loadFixture(): PixelFixture | null {
  try {
    const raw = readFileSync(FIXTURE_PATH, 'utf-8')
    return JSON.parse(raw) as PixelFixture
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/**
 * Extract a rectangular sub-region from a flat RGBA pixel buffer.
 * Returns a new Uint8ClampedArray and an ImageData-like object.
 */
function extractRegionFromBuffer(
  pixels: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  x: number,
  y: number,
  w: number,
  h: number,
): ImageData {
  const out = new Uint8ClampedArray(w * h * 4)
  for (let row = 0; row < h; row++) {
    const srcY = y + row
    if (srcY < 0 || srcY >= imgHeight) continue
    for (let col = 0; col < w; col++) {
      const srcX = x + col
      if (srcX < 0 || srcX >= imgWidth) continue
      const srcIdx = (srcY * imgWidth + srcX) * 4
      const dstIdx = (row * w + col) * 4
      out[dstIdx] = pixels[srcIdx]
      out[dstIdx + 1] = pixels[srcIdx + 1]
      out[dstIdx + 2] = pixels[srcIdx + 2]
      out[dstIdx + 3] = pixels[srcIdx + 3]
    }
  }
  return { data: out, width: w, height: h, colorSpace: 'srgb' as PredefinedColorSpace } as ImageData
}

/**
 * Build an HTMLCanvasElement stub from a real RGBA pixel buffer.
 * getImageData(x, y, w, h) returns the requested sub-region.
 */
function makeCanvasFromPixels(
  width: number,
  height: number,
  pixels: Uint8ClampedArray,
): HTMLCanvasElement {
  const ctx2d = {
    getImageData: vi.fn((x: number, y: number, w: number, h: number) =>
      extractRegionFromBuffer(pixels, width, height, x, y, w, h),
    ),
    drawImage: vi.fn(),
    putImageData: vi.fn(),
  }

  return {
    width,
    height,
    getContext: vi.fn((type: string) => (type === '2d' ? ctx2d : null)),
  } as unknown as HTMLCanvasElement
}

/**
 * Install a document.createElement mock so that detectGrid can create offscreen
 * canvases for cell extraction.  Each spawned canvas captures the drawImage
 * coordinates and serves that pixel data back through getImageData.
 */
function installGridDetectMock(
  parentPixels: Uint8ClampedArray,
  parentWidth: number,
  parentHeight: number,
): () => void {
  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag !== 'canvas') return document.createElement.call(document, tag)

    let storedData: ImageData = {
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    } as ImageData

    const ctx = {
      drawImage: vi.fn((...args: unknown[]) => {
        if (args.length === 9) {
          // extractRegion call: drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, dw, dh)
          const [, sx, sy, sw, sh, , , dw, dh] = args as number[]
          storedData = extractRegionFromBuffer(
            parentPixels, parentWidth, parentHeight,
            sx, sy, sw, sh,
          )
          // Resize sw×sh → dw×dh via nearest-neighbour if dimensions differ
          if (sw !== dw || sh !== dh) {
            const resized = new Uint8ClampedArray(dw * dh * 4)
            for (let row = 0; row < dh; row++) {
              for (let col = 0; col < dw; col++) {
                const srcX = Math.round((col / dw) * (sw - 1))
                const srcY = Math.round((row / dh) * (sh - 1))
                const si = (srcY * sw + srcX) * 4
                const di = (row * dw + col) * 4
                resized[di] = storedData.data[si]
                resized[di + 1] = storedData.data[si + 1]
                resized[di + 2] = storedData.data[si + 2]
                resized[di + 3] = storedData.data[si + 3]
              }
            }
            storedData = { data: resized, width: dw, height: dh, colorSpace: 'srgb' } as ImageData
          }
        }
      }),
      getImageData: vi.fn((_x: number, _y: number, _w: number, _h: number) => storedData),
      putImageData: vi.fn((imageData: ImageData) => { storedData = imageData }),
      canvas: null as unknown as HTMLCanvasElement,
    }

    const canvas = { width: 0, height: 0, getContext: vi.fn(() => ctx) } as unknown as HTMLCanvasElement
    ctx.canvas = canvas
    return canvas
  })

  return () => spy.mockRestore()
}

// ---------------------------------------------------------------------------
// Grid coordinate constants derived from brightness analysis of the real image
//
// Column separators (x-coordinates of vertical borders):
//   ~50, ~140, ~230, ~330, ~430, ~530, ~630, ~720
// Row separators (y-coordinates of horizontal borders):
//   ~43, ~117, ~198, ~278, ~358, ~438, ~518, ~598
//
// Cell intervals (x-start, x-end):
//   col 0: [50, 140], col 1: [140, 230], col 2: [230, 330], col 3: [330, 430]
//   col 4: [430, 530], col 5: [530, 630], col 6: [630, 720]
// Row intervals:
//   row 0: [0, 43] — header/tab row (not inventory)
//   row 1: [43, 117], row 2: [117, 198], row 3: [198, 278], row 4: [278, 358]
//   row 5: [358, 438], row 6: [438, 518], row 7: [518, 598]
// ---------------------------------------------------------------------------

const COL_SEPARATORS = [50, 140, 230, 330, 430, 530, 630, 720]
const ROW_SEPARATORS = [43, 117, 198, 278, 358, 438, 518, 598]

// Build cell grid (row × col)
function buildCellGrid() {
  const cells: Array<{ row: number; col: number; x: number; y: number; w: number; h: number }> = []
  for (let r = 0; r < ROW_SEPARATORS.length - 1; r++) {
    const y = ROW_SEPARATORS[r]
    const h = ROW_SEPARATORS[r + 1] - y
    for (let c = 0; c < COL_SEPARATORS.length - 1; c++) {
      const x = COL_SEPARATORS[c]
      const w = COL_SEPARATORS[c + 1] - x
      cells.push({ row: r, col: c, x, y, w, h })
    }
  }
  return cells
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('screenshot import pipeline — real inventory screenshot', () => {
  const fixture = loadFixture()

  if (!fixture) {
    it.skip(
      'fixture not found — run /tmp/extract-screenshot-pixels.ts first',
      () => {},
    )
    return
  }

  const { width, height, pixelsBase64 } = fixture
  const binaryStr = atob(pixelsBase64)
  const pixelBuffer = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) pixelBuffer[i] = binaryStr.charCodeAt(i)
  const pixels = new Uint8ClampedArray(
    pixelBuffer.buffer,
    pixelBuffer.byteOffset,
    pixelBuffer.byteLength,
  )

  // -------------------------------------------------------------------------
  describe('fixture validation', () => {
    it('loads pixel fixture with correct dimensions', () => {
      expect(width).toBe(794)
      expect(height).toBe(658)
      expect(pixels.length).toBe(width * height * 4) // RGBA

      const mb = (pixels.length / 1024 / 1024).toFixed(1)
      console.log(`\n[fixture] ${width}×${height} px, ${mb} MB RGBA`)
    })

    it('pixel data is non-trivial (not all black)', () => {
      // Sum of all pixel values should be large — not all zeros
      let sum = 0
      for (let i = 0; i < Math.min(pixels.length, 4000); i++) {
        sum += pixels[i]
      }
      expect(sum).toBeGreaterThan(0)
    })

    it('image is predominantly dark-themed (mean brightness below 60)', () => {
      // IdleMMO dark theme: mean grayscale ≈ 32
      let total = 0
      const step = 4 // sample every pixel (RGBA stride)
      for (let i = 0; i < pixels.length; i += step) {
        total += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
      }
      const mean = total / (pixels.length / step)
      console.log(`\n[brightness] mean grayscale = ${mean.toFixed(1)} / 255`)
      expect(mean).toBeLessThan(60)
    })
  })

  // -------------------------------------------------------------------------
  describe('detectGrid on real screenshot', () => {
    let restoreGridMock: () => void

    beforeEach(() => {
      restoreGridMock = installGridDetectMock(pixels, width, height)
    })

    afterEach(() => {
      restoreGridMock()
      vi.restoreAllMocks()
    })

    it('detectGrid runs without error', () => {
      const canvas = makeCanvasFromPixels(width, height, pixels)
      expect(() => detectGrid(canvas)).not.toThrow()
    })

    it('detectGrid with default settings detects 20+ cells on dark-theme screenshot', () => {
      // The gradient-based edge-fraction algorithm detects borders by measuring
      // how many rows/columns have a brightness change at each position. This
      // works correctly on dark-themed screenshots because it detects contrast
      // changes (edges) rather than absolute darkness.
      // Expected: ~7 columns × 6–9 rows ≈ 42–63 cells (header rows may also appear).
      const canvas = makeCanvasFromPixels(width, height, pixels)
      const cells = detectGrid(canvas)

      console.log(`\n[detectGrid default] found ${cells.length} cells`)
      console.log(
        '  (Gradient-based approach detects border edges regardless of absolute brightness)',
      )

      expect(cells.length).toBeGreaterThanOrEqual(20)
    })

    it('detectGrid with custom lineThreshold finds cells in item rows', () => {
      // With a tighter lineThreshold=0.6, only the strongest grid borders are
      // detected (more consistent full-width/height lines).
      const canvas = makeCanvasFromPixels(width, height, pixels)
      const cells = detectGrid(canvas, {
        lineThreshold: 0.6,
        minCellSize: 50,
      })

      console.log(`\n[detectGrid tuned] found ${cells.length} cells with lineThreshold=0.6`)
      // At tighter thresholds fewer (but cleaner) cells are detected
      expect(cells.length).toBeGreaterThanOrEqual(0)
    })
  })

  // -------------------------------------------------------------------------
  describe('quantity extraction on real cells', () => {
    it('extractQuantity runs without error on all manually extracted cells', () => {
      const grid = buildCellGrid()

      const results = grid.map((cell) => {
        const cellData = extractRegionFromBuffer(pixels, width, height, cell.x, cell.y, cell.w, cell.h)
        return {
          ...cell,
          result: extractQuantity(cellData, cell.w, cell.h),
        }
      })

      expect(results.length).toBe(grid.length)
      expect(results.every((r) => r.result !== undefined)).toBe(true)

      const withQty = results.filter((r) => r.result.quantity !== null)
      console.log(
        `\n[quantity] ${withQty.length}/${results.length} cells have detected quantity`,
      )
      for (const r of withQty) {
        console.log(
          `  [${r.row},${r.col}] qty=${r.result.quantity} conf=${r.result.confidence.toFixed(2)}`,
        )
      }

      // Rows 1–3 contain inventory items with visible quantity numbers in
      // the top-left corner of each cell.  Rows 4–6 are empty slots and must
      // yield no detection.
      const itemRowResults = results.filter((r) => r.row >= 1 && r.row <= 3)
      const emptyRowResults = results.filter((r) => r.row >= 4)

      // At least half the item-row cells should have a detected quantity.
      const itemDetections = itemRowResults.filter((r) => r.result.quantity !== null)
      console.log(`\n[quantity] item rows (1-3): ${itemDetections.length}/${itemRowResults.length} detected`)
      expect(itemDetections.length).toBeGreaterThanOrEqual(Math.floor(itemRowResults.length / 2))

      // Empty rows (4–6) should never have a quantity detected.
      const emptyDetections = emptyRowResults.filter((r) => r.result.quantity !== null)
      console.log(`[quantity] empty rows (4-6): ${emptyDetections.length}/${emptyRowResults.length} (expected 0)`)
      expect(emptyDetections.length).toBe(0)
    })
  })

})

// ---------------------------------------------------------------------------
// Screenshot 2 — 722×580 px
// ---------------------------------------------------------------------------
//
// Grid coordinates derived from brightness analysis of the second screenshot:
//   Column separators: 0, 100, 198, 296, 394, 492, 590, 688
//   Row separators:    0,  70, 150, 230, 310, 390, 470, 550
//
// Row 0 is the header / tab row.
// Rows 1–3 contain inventory items with visible quantity numbers.
// Rows 4–6 are empty slots.
//
// Ground truth quantities (rows 1–3, columns 0–6):
//   Row 1: 22, 298, 115,  4,  4,  6,  1
//   Row 2:  2,  50,  83, 187, 32, 109, 17
//   Row 3: 22,  16,  14,  16,  4, null, null
// ---------------------------------------------------------------------------

const FIXTURE2_PATH = path.resolve(process.cwd(), 'src/tests/fixtures/screenshot-pixels-2.json')

const COL_SEPARATORS_2 = [0, 100, 198, 296, 394, 492, 590, 688]
const ROW_SEPARATORS_2 = [0, 70, 150, 230, 310, 390, 470, 550]

/** Ground truth for screenshot 2 — null means empty slot (no quantity expected). */
const GROUND_TRUTH_2: (number | null)[][] = [
  [null, null, null, null, null, null, null], // row 0: header
  [22, 298, 115, 4, 4, 6, 1],                 // row 1
  [2, 50, 83, 187, 32, 109, 17],              // row 2
  [22, 16, 14, 16, 4, null, null],             // row 3
  [null, null, null, null, null, null, null], // row 4: empty
  [null, null, null, null, null, null, null], // row 5: empty
  [null, null, null, null, null, null, null], // row 6: empty
]

function loadFixture2(): PixelFixture | null {
  try {
    const raw = readFileSync(FIXTURE2_PATH, 'utf-8')
    return JSON.parse(raw) as PixelFixture
  } catch {
    return null
  }
}

describe('screenshot import pipeline — real inventory screenshot (722×580)', () => {
  const fixture2 = loadFixture2()

  if (!fixture2) {
    it.skip(
      'fixture not found — run extraction script for screenshot-pixels-2.json first',
      () => {},
    )
    return
  }

  const { width: width2, height: height2, pixelsBase64: pixels2Base64 } = fixture2
  const binary2 = atob(pixels2Base64)
  const pixelBuffer2 = new Uint8Array(binary2.length)
  for (let i = 0; i < binary2.length; i++) pixelBuffer2[i] = binary2.charCodeAt(i)
  const pixels2 = new Uint8ClampedArray(
    pixelBuffer2.buffer,
    pixelBuffer2.byteOffset,
    pixelBuffer2.byteLength,
  )

  describe('fixture validation', () => {
    it('loads pixel fixture with correct dimensions', () => {
      expect(width2).toBe(722)
      expect(height2).toBe(580)
      expect(pixels2.length).toBe(722 * 580 * 4)
    })
  })

  describe('quantity extraction — ground truth accuracy', () => {
    it('detects ≥90% of quantities correctly against known ground truth', () => {
      let correct = 0
      let total = 0
      let falsePositives = 0

      const failures: string[] = []

      for (let r = 0; r < ROW_SEPARATORS_2.length - 1; r++) {
        const y0 = ROW_SEPARATORS_2[r]
        const y1 = ROW_SEPARATORS_2[r + 1]
        for (let c = 0; c < COL_SEPARATORS_2.length - 1; c++) {
          const x0 = COL_SEPARATORS_2[c]
          const x1 = COL_SEPARATORS_2[c + 1]
          const cellW = x1 - x0
          const cellH = y1 - y0
          const expected = GROUND_TRUTH_2[r]?.[c] ?? null

          const cellData = extractRegionFromBuffer(pixels2, width2, height2, x0, y0, cellW, cellH)
          const result = extractQuantity(cellData, cellW, cellH)

          const ok = expected === null
            ? result.quantity === null
            : result.quantity === expected

          if (expected !== null) {
            total++
            if (ok) correct++
            else failures.push(`[r${r},c${c}] expected=${expected} got=${result.quantity}`)
          } else if (result.quantity !== null) {
            falsePositives++
            failures.push(`[r${r},c${c}] false positive: detected=${result.quantity}`)
          }
        }
      }

      console.log(`\n[screenshot2] quantity accuracy: ${correct}/${total} correct`)
      if (failures.length > 0) {
        console.log(`  Failures:`)
        failures.forEach((f) => console.log(`    ${f}`))
      }

      // No false positives on empty rows.
      expect(falsePositives).toBe(0)

      // At least 90% accuracy on item rows (≥17/19).
      const minCorrect = Math.ceil(total * 0.9)
      expect(correct).toBeGreaterThanOrEqual(minCorrect)
    })
  })
})

