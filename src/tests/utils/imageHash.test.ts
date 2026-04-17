/**
 * Tests for imageHash.ts — 192-bit dHash computation, Hamming distance,
 * and sprite bounding-box detection/cropping.
 *
 * These tests validate:
 *   - computeDHashFromGray: deterministic output from synthetic pixel grids (64-bit luma)
 *   - hammingDistance: correct Hamming distance for 16-char (64-bit),
 *     32-char (128-bit), and 48-char (192-bit) hex strings
 *   - Corner mask logic: masked bits are always 0
 *   - CANONICAL_SPRITE_SIZE constant is exported (new bbox pipeline)
 *   - CANONICAL_W/H constants still exported (deprecated but kept for compat)
 *   - detectSpriteBBox: returns correct bbox for synthetic inputs
 *   - sampleCornerColors: returns corner color samples
 *   - cropToBBox: correctness (tested via synthetic ImageData)
 *   - Edge cases: all-same pixel, gradient, etc.
 *
 * No canvas is required for gray/hash tests — all tests operate on
 * pre-computed gray arrays or hex strings directly.
 * BBox and crop tests use synthetic ImageData (no real canvas needed).
 */

import { describe, it, expect } from 'vitest'
import {
  computeDHashFromGray,
  hammingDistance,
  CANONICAL_SPRITE_SIZE,
  CANONICAL_W,
  CANONICAL_H,
  DHASH_GRID_W,
  DHASH_GRID_H,
  MASK_TL_ROWS,
  MASK_TL_COLS,
  MASK_BR_ROWS,
  MASK_BR_COLS,
  SPRITE_WIDTH_FRAC,
  SPRITE_HEIGHT_FRAC,
  detectSpriteBBox,
  sampleCornerColors,
} from '../../utils/imageHash'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a 9×8 = 72-element grayscale array filled with a constant value. */
function constGray(value: number): Uint8Array {
  return new Uint8Array(DHASH_GRID_W * DHASH_GRID_H).fill(value)
}

/** Create a 9×8 grayscale ramp: gray[i] = (i * 3) % 256. */
function rampGray(): Uint8Array {
  const arr = new Uint8Array(DHASH_GRID_W * DHASH_GRID_H)
  for (let i = 0; i < arr.length; i++) arr[i] = (i * 3) % 256
  return arr
}

/** Create a 9×8 array where every pixel increases left-to-right per row. */
function leftToRightGray(): Uint8Array {
  const arr = new Uint8Array(DHASH_GRID_W * DHASH_GRID_H)
  for (let row = 0; row < DHASH_GRID_H; row++) {
    for (let col = 0; col < DHASH_GRID_W; col++) {
      arr[row * DHASH_GRID_W + col] = col * 28 // 0..224 across 9 columns
    }
  }
  return arr
}

/** Create a 9×8 array where every pixel decreases left-to-right per row. */
function rightToLeftGray(): Uint8Array {
  const arr = new Uint8Array(DHASH_GRID_W * DHASH_GRID_H)
  for (let row = 0; row < DHASH_GRID_H; row++) {
    for (let col = 0; col < DHASH_GRID_W; col++) {
      arr[row * DHASH_GRID_W + col] = (8 - col) * 28 // 224..0 across 9 columns
    }
  }
  return arr
}

/** Parse a 16-char hex hash into an array of 64 bits (MSB first). */
function hexToBits(hex: string): number[] {
  const bits: number[] = []
  for (const ch of hex) {
    const nibble = parseInt(ch, 16)
    bits.push((nibble >> 3) & 1)
    bits.push((nibble >> 2) & 1)
    bits.push((nibble >> 1) & 1)
    bits.push(nibble & 1)
  }
  return bits
}

// ---------------------------------------------------------------------------
// computeDHashFromGray (returns 16-char hex — luminance channel only)
// ---------------------------------------------------------------------------

describe('computeDHashFromGray', () => {
  it('returns a 16-character hex string', () => {
    const hash = computeDHashFromGray(rampGray())
    expect(hash).toHaveLength(16)
    expect(hash).toMatch(/^[0-9a-f]{16}$/)
  })

  it('is deterministic — same input produces same hash', () => {
    const gray = rampGray()
    expect(computeDHashFromGray(gray)).toBe(computeDHashFromGray(gray))
  })

  it('constant input produces all-zero hash (no differences)', () => {
    // All pixels the same → no pixel is less than its right neighbour → all bits 0.
    const hash = computeDHashFromGray(constGray(128))
    expect(hash).toBe('0000000000000000')
  })

  it('strictly left-to-right increasing produces all-one bits (except masked)', () => {
    // Each pixel < its right neighbour → bit = 1, except in masked corners.
    const hash = computeDHashFromGray(leftToRightGray())
    const bits = hexToBits(hash)

    // Non-masked bits should all be 1.
    const outW = DHASH_GRID_W - 1 // 8
    const outH = DHASH_GRID_H // 8

    for (let row = 0; row < outH; row++) {
      for (let col = 0; col < outW; col++) {
        const bitIdx = row * outW + col
        const maskedTL = row < MASK_TL_ROWS && col < MASK_TL_COLS
        const maskedBR = row >= outH - MASK_BR_ROWS && col >= outW - MASK_BR_COLS
        if (maskedTL || maskedBR) {
          // Masked bits are forced to 0.
          expect(bits[bitIdx]).toBe(0)
        } else {
          // All non-masked bits are 1 (pixel < right neighbour).
          expect(bits[bitIdx]).toBe(1)
        }
      }
    }
  })

  it('strictly right-to-left decreasing produces all-zero bits', () => {
    // Each pixel > its right neighbour → bit = 0.
    const hash = computeDHashFromGray(rightToLeftGray())
    expect(hash).toBe('0000000000000000')
  })

  it('different inputs produce different hashes', () => {
    const h1 = computeDHashFromGray(leftToRightGray())
    const h2 = computeDHashFromGray(rightToLeftGray())
    expect(h1).not.toBe(h2)
  })

  it('throws on wrong-length input', () => {
    const wrong = new Uint8Array(10)
    expect(() => computeDHashFromGray(wrong)).toThrow()
  })

  it('masked top-left bits are always 0', () => {
    // Even with a left-to-right gradient that would set those bits to 1,
    // the mask forces them to 0.
    const hash = computeDHashFromGray(leftToRightGray())
    const bits = hexToBits(hash)
    const outW = DHASH_GRID_W - 1

    for (let row = 0; row < MASK_TL_ROWS; row++) {
      for (let col = 0; col < MASK_TL_COLS; col++) {
        expect(bits[row * outW + col]).toBe(0)
      }
    }
  })

  it('masked bottom-right bits are always 0', () => {
    const hash = computeDHashFromGray(leftToRightGray())
    const bits = hexToBits(hash)
    const outW = DHASH_GRID_W - 1
    const outH = DHASH_GRID_H

    for (let row = outH - MASK_BR_ROWS; row < outH; row++) {
      for (let col = outW - MASK_BR_COLS; col < outW; col++) {
        expect(bits[row * outW + col]).toBe(0)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// hammingDistance — supports 16-char (64-bit), 32-char (128-bit), 48-char (192-bit)
// ---------------------------------------------------------------------------

describe('hammingDistance', () => {
  it('returns 0 for identical 16-char hashes', () => {
    const h = computeDHashFromGray(rampGray())
    expect(hammingDistance(h, h)).toBe(0)
  })

  it('returns 0 for identical 32-char hashes', () => {
    const h16 = computeDHashFromGray(rampGray())
    const h32 = h16 + h16 // simulate a 128-bit hash
    expect(hammingDistance(h32, h32)).toBe(0)
  })

  it('returns 0 for identical 48-char hashes', () => {
    const h16 = computeDHashFromGray(rampGray())
    const h48 = h16 + h16 + h16 // simulate a 192-bit hash
    expect(hammingDistance(h48, h48)).toBe(0)
  })

  it('returns 64 for completely inverted 16-char hashes (accounting for masks)', () => {
    // left-to-right → all non-masked bits = 1
    // right-to-left → all bits = 0
    const h1 = computeDHashFromGray(leftToRightGray())
    const h2 = computeDHashFromGray(rightToLeftGray())
    // Non-masked bit count = 64 - (MASK_TL_ROWS*MASK_TL_COLS + MASK_BR_ROWS*MASK_BR_COLS)
    const maskedBits = MASK_TL_ROWS * MASK_TL_COLS + MASK_BR_ROWS * MASK_BR_COLS
    const expected = 64 - maskedBits
    expect(hammingDistance(h1, h2)).toBe(expected)
  })

  it('is symmetric: d(a,b) === d(b,a)', () => {
    const h1 = computeDHashFromGray(rampGray())
    const h2 = computeDHashFromGray(leftToRightGray())
    expect(hammingDistance(h1, h2)).toBe(hammingDistance(h2, h1))
  })

  it('returns 64 for 16-char invalid (wrong-length) hashes', () => {
    expect(hammingDistance('abc', '0000000000000000')).toBe(64)
    expect(hammingDistance('0000000000000000', '')).toBe(64)
  })

  it('returns max bits for hashes with mismatched lengths (32 vs 16)', () => {
    const h32 = '0'.repeat(32)
    const h16 = '0'.repeat(16)
    // max(32, 16) * 4 = 128
    expect(hammingDistance(h32, h16)).toBe(128)
  })

  it('returns max bits for hashes with mismatched lengths (48 vs 32)', () => {
    const h48 = '0'.repeat(48)
    const h32 = '0'.repeat(32)
    // max(48, 32) * 4 = 192
    expect(hammingDistance(h48, h32)).toBe(192)
  })

  it('returns 64 for non-hex 16-char hash strings', () => {
    expect(hammingDistance('zzzzzzzzzzzzzzzz', '0000000000000000')).toBe(64)
  })

  it('correctly counts differing bits for known 16-char hex values', () => {
    // '0001' vs '0000': bit 15 differs → distance 1
    const a = '000100000000000f'
    const b = '000000000000000f'
    expect(hammingDistance(a, b)).toBe(1)
  })

  it('correctly counts differing bits for 32-char hex values', () => {
    // First 16 chars differ by 1 bit, last 16 chars are identical
    const a = '000100000000000f' + '0000000000000000'
    const b = '000000000000000f' + '0000000000000000'
    expect(hammingDistance(a, b)).toBe(1)
  })

  it('correctly counts differing bits for 48-char hex values', () => {
    // First 16 chars differ by 1 bit, other 32 chars identical
    const a = '000100000000000f' + '0000000000000000' + '0000000000000000'
    const b = '000000000000000f' + '0000000000000000' + '0000000000000000'
    expect(hammingDistance(a, b)).toBe(1)
  })

  it('distance between constant and left-to-right is > 0', () => {
    const h1 = computeDHashFromGray(constGray(0))
    const h2 = computeDHashFromGray(leftToRightGray())
    expect(hammingDistance(h1, h2)).toBeGreaterThan(0)
  })

  it('handles 32-char hash where both halves differ', () => {
    // Each half has 1 differing bit → total 2
    const a = '000100000000000f' + '000100000000000f'
    const b = '000000000000000f' + '000000000000000f'
    expect(hammingDistance(a, b)).toBe(2)
  })

  it('handles 48-char hash where all three sections differ', () => {
    // Each section has 1 differing bit → total 3
    const a = '000100000000000f' + '000100000000000f' + '000100000000000f'
    const b = '000000000000000f' + '000000000000000f' + '000000000000000f'
    expect(hammingDistance(a, b)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Constants exported correctly
// ---------------------------------------------------------------------------

describe('exported constants', () => {
  it('CANONICAL_SPRITE_SIZE is 48 (new bbox pipeline)', () => expect(CANONICAL_SPRITE_SIZE).toBe(48))
  // Deprecated slot-size constants kept for backwards compatibility.
  it('CANONICAL_W is 84 (deprecated, kept for compat)', () => expect(CANONICAL_W).toBe(84))
  it('CANONICAL_H is 64 (deprecated, kept for compat)', () => expect(CANONICAL_H).toBe(64))
  it('DHASH_GRID_W is 9', () => expect(DHASH_GRID_W).toBe(9))
  it('DHASH_GRID_H is 8', () => expect(DHASH_GRID_H).toBe(8))
  // Corner masking removed — was causing hash collisions on gradient-background items.
  // Constants kept for backwards compatibility but are now all 0.
  it('MASK_TL_ROWS is 0 (masking removed)', () => expect(MASK_TL_ROWS).toBe(0))
  it('MASK_TL_COLS is 0 (masking removed)', () => expect(MASK_TL_COLS).toBe(0))
  it('MASK_BR_ROWS is 0 (masking removed)', () => expect(MASK_BR_ROWS).toBe(0))
  it('MASK_BR_COLS is 0 (masking removed)', () => expect(MASK_BR_COLS).toBe(0))

  it('grid produces 64 bits per channel (DHASH_GRID_W-1) * DHASH_GRID_H', () => {
    expect((DHASH_GRID_W - 1) * DHASH_GRID_H).toBe(64)
  })

  // Proportional crop fractions
  it('SPRITE_WIDTH_FRAC equals 48/84', () => {
    expect(SPRITE_WIDTH_FRAC).toBeCloseTo(48 / 84)
  })
  it('SPRITE_HEIGHT_FRAC equals 48/64', () => {
    expect(SPRITE_HEIGHT_FRAC).toBeCloseTo(48 / 64)
  })
  it('desktop slot (84×64) proportional crop equals CANONICAL_SPRITE_SIZE', () => {
    // For the canonical DB slot the crop must be exactly 48×48.
    const cropW = Math.max(CANONICAL_SPRITE_SIZE, Math.round(CANONICAL_W  * SPRITE_WIDTH_FRAC))
    const cropH = Math.max(CANONICAL_SPRITE_SIZE, Math.round(CANONICAL_H * SPRITE_HEIGHT_FRAC))
    expect(cropW).toBe(CANONICAL_SPRITE_SIZE)
    expect(cropH).toBe(CANONICAL_SPRITE_SIZE)
  })
  it('phone cell (300×260) square crop is larger than CANONICAL_SPRITE_SIZE', () => {
    const phoneW = 300
    const phoneH = 260
    const cropW = Math.max(CANONICAL_SPRITE_SIZE, Math.round(phoneW * SPRITE_WIDTH_FRAC))
    const cropH = Math.max(CANONICAL_SPRITE_SIZE, Math.round(phoneH * SPRITE_HEIGHT_FRAC))
    const cropSize = Math.min(cropW, cropH)
    expect(cropSize).toBeGreaterThan(CANONICAL_SPRITE_SIZE)
  })

  it('narrow phone cell (78×246) square crop equals CANONICAL_SPRITE_SIZE (old behaviour preserved)', () => {
    // When cell width is at or below the canonical slot width, cropW gets clamped
    // to 48 and cropSize = min(48, cropH) = 48 — same as the old fixed 48×48 crop.
    const narrowW = 78
    const tallH = 246
    const cropW = Math.max(CANONICAL_SPRITE_SIZE, Math.round(narrowW * SPRITE_WIDTH_FRAC))
    const cropH = Math.max(CANONICAL_SPRITE_SIZE, Math.round(tallH  * SPRITE_HEIGHT_FRAC))
    const cropSize = Math.min(cropW, cropH)
    expect(cropSize).toBe(CANONICAL_SPRITE_SIZE)
  })
})

// ---------------------------------------------------------------------------
// detectSpriteBBox — synthetic ImageData tests (no real canvas needed)
// ---------------------------------------------------------------------------

/**
 * Build a synthetic ImageData-compatible object (no browser API required).
 * detectSpriteBBox and sampleCornerColors only need .width, .height, .data.
 */
function makeSyntheticImageData(
  width: number,
  height: number,
  bgColor: { r: number; g: number; b: number },
  fgRect?: { x: number; y: number; w: number; h: number; color: { r: number; g: number; b: number } },
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  // Fill background
  for (let i = 0; i < width * height; i++) {
    data[i * 4]     = bgColor.r
    data[i * 4 + 1] = bgColor.g
    data[i * 4 + 2] = bgColor.b
    data[i * 4 + 3] = 255
  }
  // Paint foreground rectangle if given
  if (fgRect) {
    const { x: fx, y: fy, w: fw, h: fh, color } = fgRect
    for (let y = fy; y < fy + fh; y++) {
      for (let x = fx; x < fx + fw; x++) {
        const idx = (y * width + x) * 4
        data[idx]     = color.r
        data[idx + 1] = color.g
        data[idx + 2] = color.b
        data[idx + 3] = 255
      }
    }
  }
  // Return a plain object that satisfies the ImageData interface used by our functions.
  return { width, height, data, colorSpace: 'srgb' } as ImageData
}

describe('detectSpriteBBox', () => {
  const BG = { r: 22, g: 29, b: 42 }     // standard slot background
  const FG = { r: 220, g: 150, b: 80 }    // bright sprite color (far from bg)

  it('returns null for uniform background (no foreground)', () => {
    const img = makeSyntheticImageData(20, 20, BG)
    const bgSamples = sampleCornerColors(img)
    const bbox = detectSpriteBBox(img, bgSamples)
    expect(bbox).toBeNull()
  })

  it('detects a centered foreground square correctly', () => {
    // 20×20 image, 4×4 sprite centered at (8,8)
    const img = makeSyntheticImageData(20, 20, BG, { x: 8, y: 8, w: 4, h: 4, color: FG })
    const bgSamples = sampleCornerColors(img)
    const bbox = detectSpriteBBox(img, bgSamples)
    expect(bbox).not.toBeNull()
    expect(bbox!.x).toBe(8)
    expect(bbox!.y).toBe(8)
    expect(bbox!.w).toBe(4)
    expect(bbox!.h).toBe(4)
  })

  it('detects a top-left corner sprite', () => {
    const img = makeSyntheticImageData(20, 20, BG, { x: 0, y: 0, w: 5, h: 5, color: FG })
    // corner sampling will pick up FG color at TL — use threshold 200 to ignore it
    // use a custom bg sample that only has BG
    const bgSamples = [BG]
    const bbox = detectSpriteBBox(img, bgSamples)
    expect(bbox).not.toBeNull()
    expect(bbox!.x).toBe(0)
    expect(bbox!.y).toBe(0)
    expect(bbox!.w).toBe(5)
    expect(bbox!.h).toBe(5)
  })

  it('detects a bottom-right corner sprite', () => {
    const img = makeSyntheticImageData(20, 20, BG, { x: 15, y: 15, w: 5, h: 5, color: FG })
    const bgSamples = [BG]
    const bbox = detectSpriteBBox(img, bgSamples)
    expect(bbox).not.toBeNull()
    expect(bbox!.x).toBe(15)
    expect(bbox!.y).toBe(15)
    expect(bbox!.w).toBe(5)
    expect(bbox!.h).toBe(5)
  })

  it('detects a single pixel of foreground', () => {
    const img = makeSyntheticImageData(10, 10, BG, { x: 5, y: 5, w: 1, h: 1, color: FG })
    const bgSamples = [BG]
    const bbox = detectSpriteBBox(img, bgSamples)
    expect(bbox).not.toBeNull()
    expect(bbox!.x).toBe(5)
    expect(bbox!.y).toBe(5)
    expect(bbox!.w).toBe(1)
    expect(bbox!.h).toBe(1)
  })

  it('returns null when all pixels are within threshold of bg', () => {
    // Nearly-bg color: only 10 units away (below default threshold of 40)
    const nearBg = { r: BG.r + 5, g: BG.g + 5, b: BG.b + 5 }
    const img = makeSyntheticImageData(10, 10, BG, { x: 3, y: 3, w: 4, h: 4, color: nearBg })
    const bgSamples = [BG]
    const bbox = detectSpriteBBox(img, bgSamples)
    expect(bbox).toBeNull()
  })

  it('uses threshold parameter correctly', () => {
    // Color with distance ~17 from bg
    const slightlyDiff = { r: BG.r + 10, g: BG.g + 10, b: BG.b + 10 }
    const img = makeSyntheticImageData(10, 10, BG, { x: 3, y: 3, w: 4, h: 4, color: slightlyDiff })
    const bgSamples = [BG]
    // With threshold 10, pixels at dist ~17 are foreground
    const bboxDetected = detectSpriteBBox(img, bgSamples, 10)
    expect(bboxDetected).not.toBeNull()
    // With threshold 25, same pixels are background
    const bboxMissed = detectSpriteBBox(img, bgSamples, 25)
    expect(bboxMissed).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// sampleCornerColors
// ---------------------------------------------------------------------------

describe('sampleCornerColors', () => {
  const BG = { r: 22, g: 29, b: 42 }
  const FG = { r: 200, g: 100, b: 50 }

  it('returns array of samples for uniform bg image', () => {
    const img = makeSyntheticImageData(20, 20, BG)
    const samples = sampleCornerColors(img, 3)
    expect(samples.length).toBe(3 * 3 * 4) // cs×cs × 4 corners
    for (const s of samples) {
      expect(s.r).toBe(BG.r)
      expect(s.g).toBe(BG.g)
      expect(s.b).toBe(BG.b)
    }
  })

  it('includes corner-colored pixels in samples', () => {
    // Paint all 4 corners with FG color
    const img = makeSyntheticImageData(20, 20, BG)
    // Manually set TL and BR corners
    const data = img.data
    // TL (0,0)
    data[0] = FG.r; data[1] = FG.g; data[2] = FG.b
    // BR (19,19)
    const brIdx = (19 * 20 + 19) * 4
    data[brIdx] = FG.r; data[brIdx + 1] = FG.g; data[brIdx + 2] = FG.b

    const samples = sampleCornerColors(img, 1)
    // With cornerSize=1, we get exactly 4 samples (one per corner)
    expect(samples.length).toBe(4)
    // TL and BR should be FG; TR and BL should be BG
    expect(samples[0]).toEqual(FG) // TL
    expect(samples[1]).toEqual(BG) // TR
    expect(samples[2]).toEqual(BG) // BL
    expect(samples[3]).toEqual(FG) // BR
  })

  it('handles cornerSize=1 correctly', () => {
    const img = makeSyntheticImageData(10, 10, BG)
    const samples = sampleCornerColors(img, 1)
    expect(samples.length).toBe(4)
  })

  it('clamps cornerSize to half the image dimension', () => {
    // 4×4 image, cornerSize=10 → clamped to 2
    const img = makeSyntheticImageData(4, 4, BG)
    const samples = sampleCornerColors(img, 10)
    // cs = min(10, 2, 2) = 2 → 2*2*4 = 16 samples
    expect(samples.length).toBe(16)
  })
})

// ---------------------------------------------------------------------------
// Self-consistency: same input always matches
// ---------------------------------------------------------------------------

describe('self-consistency', () => {
  it('ramp hash has distance 0 to itself', () => {
    const h = computeDHashFromGray(rampGray())
    expect(hammingDistance(h, h)).toBe(0)
  })

  it('perturbing one pixel changes the hash by at most a few bits', () => {
    const base = rampGray()
    const perturbed = new Uint8Array(base)
    // Flip one non-masked middle pixel
    perturbed[30] = base[30] < 128 ? 255 : 0
    const h1 = computeDHashFromGray(base)
    const h2 = computeDHashFromGray(perturbed)
    // At most 2 bits can change when one pixel flips (it appears in at most 2 differences)
    expect(hammingDistance(h1, h2)).toBeLessThanOrEqual(4)
  })
})
