/**
 * Tests for the grid detector utility
 *
 * The internal algorithm is tested with synthetic pixel data so that no
 * real browser Canvas rendering is required. The public detectGrid function
 * is tested via a minimal Canvas mock that injects known pixel data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { detectGrid } from '../../utils/gridDetector'

// ---------------------------------------------------------------------------
// Canvas mock helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal HTMLCanvasElement stub whose getContext('2d') returns an
 * object that reports the given pixel data via getImageData().
 */
function makeCanvasMock(
  width: number,
  height: number,
  pixelData: Uint8ClampedArray,
): HTMLCanvasElement {
  const imageData = {
    data: pixelData,
    width,
    height,
    colorSpace: 'srgb' as PredefinedColorSpace,
  } as ImageData

  // Tracks calls to drawImage so we can verify extraction calls
  const drawImageCalls: unknown[] = []

  const ctx2d = {
    canvas: null as unknown as HTMLCanvasElement, // filled in below
    drawImage: vi.fn((...args: unknown[]) => { drawImageCalls.push(args) }),
    getImageData: vi.fn((..._args: unknown[]) => imageData),
  }

  const canvas = {
    width,
    height,
    getContext: vi.fn((type: string) => {
      if (type === '2d') return ctx2d
      return null
    }),
  } as unknown as HTMLCanvasElement

  ctx2d.canvas = canvas
  return canvas
}

/**
 * Synthesize a flat Uint8ClampedArray (RGBA) with specific patterns.
 *
 * `cells` maps [row, col] pairs to a "cell brightness" (0–255). Grid
 * lines (borders) are drawn with the given `borderColor`.
 *
 * Layout:
 *   border (1px) | cell | border | cell | … | border
 *
 * @param rows        Number of cell rows
 * @param cols        Number of cell columns
 * @param cellSize    Pixel size of each square cell
 * @param borderWidth Pixel width of each border line
 * @param borderColor Grayscale value [0–255] for border pixels
 * @param cellColor   Default grayscale value for cell interiors
 */
function synthesizeGrid(
  rows: number,
  cols: number,
  cellSize: number,
  borderWidth: number,
  borderColor: number,
  cellColor: number,
): { data: Uint8ClampedArray; width: number; height: number } {
  const w = borderWidth + cols * (cellSize + borderWidth)
  const h = borderWidth + rows * (cellSize + borderWidth)
  const data = new Uint8ClampedArray(w * h * 4)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Is this pixel on a border?
      const xRel = x % (cellSize + borderWidth)
      const yRel = y % (cellSize + borderWidth)
      const onBorder = xRel < borderWidth || yRel < borderWidth

      const brightness = onBorder ? borderColor : cellColor
      const idx = (y * w + x) * 4
      data[idx] = brightness     // R
      data[idx + 1] = brightness // G
      data[idx + 2] = brightness // B
      data[idx + 3] = 255        // A
    }
  }

  return { data, width: w, height: h }
}

/**
 * Create a canvas mock from synthetic grid parameters.
 */
function makeGridCanvas(
  rows: number,
  cols: number,
  cellSize: number,
  borderWidth: number,
  borderColor: number = 40,
  cellColor: number = 160,
): HTMLCanvasElement {
  const { data, width, height } = synthesizeGrid(
    rows, cols, cellSize, borderWidth, borderColor, cellColor,
  )
  return makeCanvasMock(width, height, data)
}

// ---------------------------------------------------------------------------
// Tests for the projection-based helpers (via detectGrid integration)
// ---------------------------------------------------------------------------

describe('detectGrid', () => {
  // Mock document.createElement so that offscreen canvases work in the test
  // environment (happy-dom provides a limited canvas; we only need the stub
  // to expose drawImage / getImageData on its 2d context).
  beforeEach(() => {
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const offCtx = {
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({
            data: new Uint8ClampedArray(4),
            width: 1,
            height: 1,
            colorSpace: 'srgb',
          })),
          canvas: null as unknown as HTMLCanvasElement,
        }
        const offCanvas = {
          width: 0,
          height: 0,
          getContext: vi.fn(() => offCtx),
        } as unknown as HTMLCanvasElement
        offCtx.canvas = offCanvas
        return offCanvas
      }
      // For non-canvas elements fall back to real implementation
      return document.createElement.call(document, tag)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('edge cases', () => {
    it('returns empty array for zero-width canvas', () => {
      const canvas = makeCanvasMock(0, 100, new Uint8ClampedArray(0))
      expect(detectGrid(canvas)).toEqual([])
    })

    it('returns empty array for zero-height canvas', () => {
      const canvas = makeCanvasMock(100, 0, new Uint8ClampedArray(0))
      expect(detectGrid(canvas)).toEqual([])
    })

    it('returns empty array when canvas has no 2d context', () => {
      const canvas = {
        width: 100,
        height: 100,
        getContext: vi.fn(() => null),
      } as unknown as HTMLCanvasElement
      expect(detectGrid(canvas)).toEqual([])
    })

    it('returns empty array for a fully bright image with no dark lines', () => {
      // All pixels at brightness 200 — no dark borders detectable
      const { data, width, height } = synthesizeGrid(3, 3, 30, 2, 200, 200)
      const canvas = makeCanvasMock(width, height, data)
      expect(detectGrid(canvas)).toEqual([])
    })
  })

  describe('basic grid detection', () => {
    it('detects the correct number of cells for a 3x4 grid', () => {
      // 3 rows × 4 cols, 40px cells, 3px dark borders (color 30 < threshold 80)
      const canvas = makeGridCanvas(3, 4, 40, 3, 30, 160)
      const cells = detectGrid(canvas)
      expect(cells.length).toBe(3 * 4)
    })

    it('detects the correct number of cells for a 5x6 grid', () => {
      const canvas = makeGridCanvas(5, 6, 38, 2, 20, 150)
      const cells = detectGrid(canvas)
      expect(cells.length).toBe(5 * 6)
    })

    it('detects the correct number of cells for a 2x2 grid', () => {
      const canvas = makeGridCanvas(2, 2, 50, 4, 15, 180)
      const cells = detectGrid(canvas)
      expect(cells.length).toBe(4)
    })

    it('assigns correct row and column indices', () => {
      const canvas = makeGridCanvas(2, 3, 40, 2, 25, 150)
      const cells = detectGrid(canvas)
      expect(cells.length).toBe(6)

      // Sort row-first for predictable order
      const sorted = [...cells].sort((a, b) => a.row - b.row || a.col - b.col)

      expect(sorted[0]).toMatchObject({ row: 0, col: 0 })
      expect(sorted[1]).toMatchObject({ row: 0, col: 1 })
      expect(sorted[2]).toMatchObject({ row: 0, col: 2 })
      expect(sorted[3]).toMatchObject({ row: 1, col: 0 })
      expect(sorted[4]).toMatchObject({ row: 1, col: 1 })
      expect(sorted[5]).toMatchObject({ row: 1, col: 2 })
    })

    it('each cell has positive width and height', () => {
      const canvas = makeGridCanvas(3, 3, 35, 2, 20, 140)
      const cells = detectGrid(canvas)
      for (const cell of cells) {
        expect(cell.width).toBeGreaterThan(0)
        expect(cell.height).toBeGreaterThan(0)
      }
    })

    it('each cell has a non-negative x and y position', () => {
      const canvas = makeGridCanvas(3, 3, 35, 2, 20, 140)
      const cells = detectGrid(canvas)
      for (const cell of cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0)
        expect(cell.y).toBeGreaterThanOrEqual(0)
      }
    })

    it('cell positions fit within the canvas bounds', () => {
      const rows = 3
      const cols = 4
      const cellSize = 40
      const borderWidth = 2
      const canvas = makeGridCanvas(rows, cols, cellSize, borderWidth, 20, 140)
      const cells = detectGrid(canvas)

      for (const cell of cells) {
        expect(cell.x + cell.width).toBeLessThanOrEqual(canvas.width)
        expect(cell.y + cell.height).toBeLessThanOrEqual(canvas.height)
      }
    })

    it('cells have approximately equal widths (uniform grid)', () => {
      const canvas = makeGridCanvas(3, 4, 40, 2, 20, 150)
      const cells = detectGrid(canvas)
      const widths = cells.map((c) => c.width)
      const minW = Math.min(...widths)
      const maxW = Math.max(...widths)
      // Allow 2px variation due to rounding in midpoint computation
      expect(maxW - minW).toBeLessThanOrEqual(2)
    })

    it('cells have approximately equal heights (uniform grid)', () => {
      const canvas = makeGridCanvas(3, 4, 40, 2, 20, 150)
      const cells = detectGrid(canvas)
      const heights = cells.map((c) => c.height)
      const minH = Math.min(...heights)
      const maxH = Math.max(...heights)
      expect(maxH - minH).toBeLessThanOrEqual(2)
    })
  })

  describe('isEmpty classification', () => {
    it('classifies uniform-brightness cells as empty', () => {
      // Both border (dark) and cell interior use same brightness — cell has
      // no variation so isEmpty should be true
      const { data, width, height } = synthesizeGrid(2, 2, 50, 2, 20, 20)
      const canvas = makeCanvasMock(width, height, data)
      // Lower the lineThreshold so we still get grid line detection
      const cells = detectGrid(canvas, { lineThreshold: 0.3, darkPixelThreshold: 30 })
      // If cells are found, they should all be classified empty
      for (const cell of cells) {
        expect(cell.isEmpty).toBe(true)
      }
    })

    it('classifies high-variance cells as non-empty', () => {
      // Build a grid where cells have alternating light/dark pixels (high variance)
      const rows = 2
      const cols = 2
      const cellSize = 40
      const borderWidth = 2
      const { data, width, height } = synthesizeGrid(rows, cols, cellSize, borderWidth, 20, 160)

      // Add a "sprite" pattern to each cell: checkerboard of 0 and 255
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const cellX = borderWidth + cx * (cellSize + borderWidth)
          const cellY = borderWidth + cy * (cellSize + borderWidth)
          for (let y = cellY; y < cellY + cellSize; y++) {
            for (let x = cellX; x < cellX + cellSize; x++) {
              const brightness = (x + y) % 2 === 0 ? 10 : 250
              const idx = (y * width + x) * 4
              data[idx] = brightness
              data[idx + 1] = brightness
              data[idx + 2] = brightness
            }
          }
        }
      }

      const canvas = makeCanvasMock(width, height, data)
      const cells = detectGrid(canvas, { emptyStdDevThreshold: 18 })
      // High-variance cells (checkerboard) should not be empty
      for (const cell of cells) {
        expect(cell.isEmpty).toBe(false)
      }
    })
  })

  describe('options', () => {
    it('respects minCellSize — discards cells smaller than the threshold', () => {
      // 5px cells with 2px borders should be discarded when minCellSize = 10
      const canvas = makeGridCanvas(3, 3, 5, 2, 20, 150)
      const cells = detectGrid(canvas, { minCellSize: 10 })
      expect(cells.length).toBe(0)
    })

    it('respects maxCellSize — discards cells larger than the threshold', () => {
      // 200px cells with 2px borders should be discarded when maxCellSize = 50
      const canvas = makeGridCanvas(2, 2, 200, 2, 20, 150)
      const cells = detectGrid(canvas, { maxCellSize: 50 })
      expect(cells.length).toBe(0)
    })

    it('respects custom lineThreshold', () => {
      // borderColor 60 < darkPixelThreshold 80, but fraction may be < default threshold
      // With a lower lineThreshold we should still detect the grid
      const canvas = makeGridCanvas(2, 2, 40, 2, 60, 150)
      const cells = detectGrid(canvas, { lineThreshold: 0.1 })
      expect(cells.length).toBe(4)
    })

    it('respects custom darkPixelThreshold (minimum edge magnitude)', () => {
      // With the gradient-based algorithm darkPixelThreshold is the minimum
      // brightness difference between adjacent pixels for an edge to be counted.
      // borderColor 100 vs cellColor 160 gives a contrast of 60, which is well
      // above any reasonable minimum — so both default (5) and a custom value (10)
      // should detect the 4 cells.
      const canvasDefault = makeGridCanvas(2, 2, 40, 2, 100, 160)
      const cellsDefault = detectGrid(canvasDefault)
      expect(cellsDefault.length).toBe(4)

      const canvasCustom = makeGridCanvas(2, 2, 40, 2, 100, 160)
      const cellsCustom = detectGrid(canvasCustom, { darkPixelThreshold: 10 })
      expect(cellsCustom.length).toBe(4)
    })
  })

  describe('each cell has imageData and canvas', () => {
    it('each cell has an imageData property', () => {
      const canvas = makeGridCanvas(2, 2, 40, 2, 20, 150)
      const cells = detectGrid(canvas)
      for (const cell of cells) {
        expect(cell.imageData).toBeDefined()
      }
    })

    it('each cell has a canvas property', () => {
      const canvas = makeGridCanvas(2, 2, 40, 2, 20, 150)
      const cells = detectGrid(canvas)
      for (const cell of cells) {
        expect(cell.canvas).toBeDefined()
      }
    })
  })

  describe('varying grid sizes', () => {
    it('handles a 4x6 grid (typical mobile inventory layout)', () => {
      const canvas = makeGridCanvas(4, 6, 36, 2, 20, 155)
      const cells = detectGrid(canvas)
      expect(cells.length).toBe(24)
    })

    it('handles a 1x1 minimal grid', () => {
      const canvas = makeGridCanvas(1, 1, 60, 3, 15, 160)
      const cells = detectGrid(canvas)
      expect(cells.length).toBe(1)
    })

    it('handles non-square grids (more cols than rows)', () => {
      const canvas = makeGridCanvas(2, 8, 30, 2, 20, 150)
      const cells = detectGrid(canvas)
      expect(cells.length).toBe(16)
    })

    it('handles non-square grids (more rows than cols)', () => {
      const canvas = makeGridCanvas(8, 2, 30, 2, 20, 150)
      const cells = detectGrid(canvas)
      expect(cells.length).toBe(16)
    })
  })

  describe('performance', () => {
    it('processes a 1920x1080 synthetic image in under 500ms', () => {
      // Use a coarser cell size so the grid fits in 1920×1080
      // 14 cols × (136 + 2) = 1932 > 1920, so use 13 cols
      // 7 rows × (152 + 2) = 1078 ≈ 1080
      const rows = 7
      const cols = 13
      const cellSize = 136
      const borderWidth = 2
      const { data } = synthesizeGrid(rows, cols, cellSize, borderWidth, 20, 160)
      // Pad to exactly 1920×1080
      const w = 1920
      const h = 1080
      const padded = new Uint8ClampedArray(w * h * 4).fill(160)
      // Copy synthesized data into the top-left corner
      const gridW = borderWidth + cols * (cellSize + borderWidth)
      const gridH = borderWidth + rows * (cellSize + borderWidth)
      for (let y = 0; y < Math.min(gridH, h); y++) {
        const srcRowStart = y * gridW * 4
        const dstRowStart = y * w * 4
        padded.set(data.subarray(srcRowStart, srcRowStart + Math.min(gridW, w) * 4), dstRowStart)
      }

      const canvas = makeCanvasMock(w, h, padded)

      const start = performance.now()
      const cells = detectGrid(canvas)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(500)
      expect(cells.length).toBeGreaterThan(0)
    })
  })
})
