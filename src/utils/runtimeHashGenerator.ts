/**
 * Runtime sprite hash generator.
 *
 * For phone screenshots (large cells), the pre-computed dHash database was
 * generated with Playwright/Chromium and may differ from the actual browser's
 * rendering (e.g. Safari on iOS, Chrome on Android).  This module re-renders
 * a small set of candidate sprites in the user's actual browser at the
 * detected cell size, then computes dHash from those renders — guaranteeing
 * that reference hashes and query hashes use the same rendering engine.
 *
 * Usage: get the top-N candidates from the pre-computed DB (cheap Hamming
 * scan), then runtime-render only those N sprites and re-compare.  This keeps
 * the per-cell cost to ~20 fetches × ~3 KB = ~60 KB instead of loading all
 * 1 346 sprites upfront.
 *
 * No external dependencies — pure Canvas API + fetch.
 */

import {
  CANONICAL_SPRITE_SIZE,
  SPRITE_WIDTH_FRAC,
  SPRITE_HEIGHT_FRAC,
  DHASH_GRID_W,
  DHASH_GRID_H,
  CANONICAL_H,
  hammingDistance,
} from './imageHash'

// ---------------------------------------------------------------------------
// Quality background colours — must match the game's slot CSS exactly.
// Same values as scripts/generate-sprite-hashes-browser.ts.
// ---------------------------------------------------------------------------

const QUALITY_BG: Record<string, { r: number; g: number; b: number }> = {
  standard:  { r: 22, g: 29, b: 42 },
  refined:   { r: 21, g: 41, b: 81 },
  premium:   { r: 22, g: 56, b: 43 },
  epic:      { r: 66, g: 29, b: 37 },
  legendary: { r: 61, g: 50, b: 34 },
  // Mythic/unique use gradients — approximate with the start colour.
  mythic:    { r: 118, g: 68, b: 48 },
  unique:    { r: 124, g: 89, b: 142 },
}

function qualityBg(quality: string): { r: number; g: number; b: number } {
  return QUALITY_BG[quality] ?? QUALITY_BG.standard
}

// ---------------------------------------------------------------------------
// Sprite URL resolution
// ---------------------------------------------------------------------------

/**
 * Return the URL to fetch a sprite PNG for `hashedId`.
 *
 * In development (Vite), sprites are served from `src/data/sprites/`.
 * In production (GitHub Pages), they are under the same path relative
 * to the base URL — Vite copies `src/data/sprites/` as a static asset
 * because it is imported by sprite-hashes.json.
 *
 * We determine the base from `import.meta.env.BASE_URL` which Vite sets to
 * `/idle-mmo-profiter/` in both dev and production builds.
 */
function spriteUrl(hashedId: string): string {
  const base = (import.meta.env?.BASE_URL ?? '/idle-mmo-profiter/').replace(/\/$/, '')
  return `${base}/src/data/sprites/${hashedId}.png`
}

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

/** Simple in-memory LRU-free cache for loaded HTMLImageElements. */
const _imageCache = new Map<string, HTMLImageElement>()

/**
 * Load a sprite image by hashedId, with in-memory caching.
 * Returns null if the fetch fails (network error or 404).
 */
async function loadSpriteImage(hashedId: string): Promise<HTMLImageElement | null> {
  if (_imageCache.has(hashedId)) {
    return _imageCache.get(hashedId)!
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      _imageCache.set(hashedId, img)
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = spriteUrl(hashedId)
  })
}

// ---------------------------------------------------------------------------
// Canvas helpers
// ---------------------------------------------------------------------------

function createCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') {
    // OffscreenCanvas is available (Chrome, Firefox) — no DOM access needed.
    // We cast to HTMLCanvasElement because the downstream drawImage calls
    // accept CanvasImageSource which covers OffscreenCanvas at runtime.
    return new OffscreenCanvas(width, height) as unknown as HTMLCanvasElement
  }
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return c
}

// ---------------------------------------------------------------------------
// Per-sprite runtime hash computation
// ---------------------------------------------------------------------------

/**
 * Render one sprite at the given slot dimensions and compute its 192-bit dHash.
 *
 * The render mimics the game CSS: quality background, centred sprite at
 * imgSize × imgSize, then the same proportional-crop → 9×8 dHash pipeline
 * used by computeDHash() and generate-sprite-hashes-browser.ts.
 *
 * @param hashedId   - Game hashedId (used to load the sprite PNG).
 * @param quality    - Quality tier for the background fill.
 * @param slotWidth  - Rendered slot width (= cell.width from grid detection).
 * @param slotHeight - Rendered slot height (= cell.height from grid detection).
 * @param referenceHeight - Reference slot height for vertical crop alignment.
 * @param leftMargin - Dark left-margin pixels to skip when centering the crop
 *                     (mirrors computeDHash's detectLeftMargin correction).
 *                     Default 0 (no margin).
 * @returns 48-char hex dHash, or null if the sprite image could not be loaded.
 */
export async function renderSpriteHash(
  hashedId: string,
  quality: string,
  slotWidth: number,
  slotHeight: number,
  referenceHeight: number,
  leftMargin = 0,
): Promise<string | null> {
  const img = await loadSpriteImage(hashedId)
  if (!img) return null

  const bg = qualityBg(quality)

  // Sprite display size — proportional to the effective slot HEIGHT.
  // The game's CSS renders the sprite at IMG_SIZE (48 px) inside a slot of
  // SLOT_HEIGHT (64 px), giving ratio 48/64 = 0.75.  We scale that ratio to
  // the actual effective slot height (= refH for merged-row phone cells).
  // Formula: imgSize = round(effectiveSlotH × (IMG_SIZE / SLOT_HEIGHT))
  //                  = round(effectiveH × (48 / 64))
  // (Computed after effectiveH is derived below.)

  // Step 1: Render slot.
  const slotCanvas = createCanvas(slotWidth, slotHeight)
  const slotCtx = slotCanvas.getContext('2d') as CanvasRenderingContext2D | null
  if (!slotCtx) return null

  slotCtx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`
  slotCtx.fillRect(0, 0, slotWidth, slotHeight)

  // Merged-row case: the referenceHeight is the ORIGINAL half-height, and the
  // sprite must be placed in the TOP refH pixels of the rendered slot to mirror
  // where it appears in the actual screenshot cell.
  const refH = referenceHeight ?? CANONICAL_H
  const effectiveH = (slotHeight > refH * 1.5) ? refH : slotHeight
  const isMergedRow = effectiveH !== slotHeight

  // Sprite display size proportional to effective slot HEIGHT.
  // Game CSS: 48 px sprite in 64 px slot → ratio 48/64 = 0.75.
  const imgSize = Math.round(effectiveH * (48 / 64))

  // Centre sprite within the content area (skipping any dark left margin).
  const imgX = leftMargin + Math.round((slotWidth - leftMargin - imgSize) / 2)
  // Centre sprite within effectiveH; for merged rows, effectiveH = refH so
  // the sprite is placed in the top portion of the rendered slot.
  const imgY = Math.round((effectiveH - imgSize) / 2)
  slotCtx.drawImage(img, imgX, imgY, imgSize, imgSize)

  // Step 2: Proportional square crop — mirrors computeDHash() exactly.
  const cropW = Math.max(CANONICAL_SPRITE_SIZE, Math.round(slotWidth   * SPRITE_WIDTH_FRAC))
  const cropH = Math.max(CANONICAL_SPRITE_SIZE, Math.round(effectiveH  * SPRITE_HEIGHT_FRAC))
  const cropSize = Math.min(cropW, cropH)
  // Mirror computeDHash's left-margin correction: centre within content area.
  const contentWidth = slotWidth - leftMargin
  const cropX = leftMargin + Math.round((contentWidth - cropSize) / 2)

  // Vertical crop — mirrors computeDHash() cropY logic exactly.
  let cropY: number
  if (effectiveH < refH * 0.6) {
    cropY = 0
  } else if (cropSize >= effectiveH) {
    cropY = Math.round((slotHeight - cropSize) / 2)
  } else if (slotHeight > refH + 5 && !isMergedRow) {
    // Guard: when cropSize >= refH the offset goes negative — centre in full cell instead.
    if (cropSize >= refH) {
      cropY = Math.round((slotHeight - cropSize) / 2)
    } else {
      cropY = (slotHeight - refH) + Math.round((refH - cropSize) / 2) + 1
    }
  } else {
    // Normal or merged-row: centre within top effectiveH pixels.
    cropY = Math.round((effectiveH - cropSize) / 2)
  }

  const safeCropX = Math.max(0, Math.min(cropX, slotWidth  - cropSize))
  const safeCropY = Math.max(0, Math.min(cropY, slotHeight - cropSize))

  const canonCanvas = createCanvas(CANONICAL_SPRITE_SIZE, CANONICAL_SPRITE_SIZE)
  const canonCtx = canonCanvas.getContext('2d') as CanvasRenderingContext2D | null
  if (!canonCtx) return null

  canonCtx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`
  canonCtx.fillRect(0, 0, CANONICAL_SPRITE_SIZE, CANONICAL_SPRITE_SIZE)
  canonCtx.drawImage(
    slotCanvas as unknown as CanvasImageSource,
    safeCropX, safeCropY, cropSize, cropSize,
    0, 0, CANONICAL_SPRITE_SIZE, CANONICAL_SPRITE_SIZE,
  )

  // Step 3: Downscale to DHASH_GRID_W × DHASH_GRID_H.
  const smallCanvas = createCanvas(DHASH_GRID_W, DHASH_GRID_H)
  const smallCtx = smallCanvas.getContext('2d') as CanvasRenderingContext2D | null
  if (!smallCtx) return null
  smallCtx.drawImage(
    canonCanvas as unknown as CanvasImageSource,
    0, 0, CANONICAL_SPRITE_SIZE, CANONICAL_SPRITE_SIZE,
    0, 0, DHASH_GRID_W, DHASH_GRID_H,
  )

  // Step 4: Extract pixels and compute 192-bit dHash.
  const pixels = smallCtx.getImageData(0, 0, DHASH_GRID_W, DHASH_GRID_H).data
  const nPx = DHASH_GRID_W * DHASH_GRID_H

  const luma = new Uint8Array(nPx)
  const rb   = new Int16Array(nPx)
  const gb   = new Int16Array(nPx)

  for (let i = 0; i < nPx; i++) {
    const base = i * 4
    const r = pixels[base]
    const g = pixels[base + 1]
    const b = pixels[base + 2]
    luma[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    rb[i]   = r - b
    gb[i]   = g - b
  }

  return bitsToHex(diffBits(luma, false))
       + bitsToHex(diffBitsInt16(rb))
       + bitsToHex(diffBitsInt16(gb))
}

// ---------------------------------------------------------------------------
// dHash bit helpers (duplicated from imageHash.ts to keep this module
// self-contained without importing private functions)
// ---------------------------------------------------------------------------

function diffBits(gray: Uint8Array, _unused: boolean): number[] {
  const outW = DHASH_GRID_W - 1
  const bits: number[] = []
  for (let row = 0; row < DHASH_GRID_H; row++) {
    for (let col = 0; col < outW; col++) {
      bits.push(gray[row * DHASH_GRID_W + col] < gray[row * DHASH_GRID_W + col + 1] ? 1 : 0)
    }
  }
  return bits
}

function diffBitsInt16(channel: Int16Array): number[] {
  const outW = DHASH_GRID_W - 1
  const bits: number[] = []
  for (let row = 0; row < DHASH_GRID_H; row++) {
    for (let col = 0; col < outW; col++) {
      bits.push(channel[row * DHASH_GRID_W + col] < channel[row * DHASH_GRID_W + col + 1] ? 1 : 0)
    }
  }
  return bits
}

function bitsToHex(bits: number[]): string {
  let hex = ''
  for (let i = 0; i < bits.length; i += 4) {
    let nibble = 0
    for (let b = 0; b < 4; b++) {
      nibble = (nibble << 1) | (bits[i + b] ?? 0)
    }
    hex += nibble.toString(16)
  }
  return hex
}

// ---------------------------------------------------------------------------
// Batch candidate refinement
// ---------------------------------------------------------------------------

/**
 * A candidate item to runtime-render and re-score.
 */
export interface RuntimeCandidate {
  /** Game hashedId. */
  hashedId: string
  /** Human-readable name. */
  name: string
  /** Quality tier (controls background fill colour). */
  quality: string
  /** Pre-computed Hamming distance from the pre-computed DB scan. */
  precomputedDistance: number
  /** True if this item shares its hash with another item in the pre-computed DB. */
  ambiguous: boolean
  /** Group ID for ambiguous items. */
  groupId?: string
}

/**
 * Result of a runtime hash refinement for one candidate.
 */
export interface RuntimeMatchResult {
  hashedId: string
  name: string
  quality: string
  /** Hamming distance from the runtime-rendered hash (exact same browser engine). */
  distance: number
  ambiguous: boolean
  groupId?: string
}

/**
 * Runtime-render a list of candidate sprites at the given slot dimensions and
 * return the best match by Hamming distance.
 *
 * Only renders sprites whose images are available (404s are skipped silently).
 * Returns null if no candidate produces a hash within `threshold`.
 *
 * @param queryHash       - 48-char hex dHash from the screenshot cell.
 * @param candidates      - List of candidate items to render (typically top-20).
 * @param slotWidth       - Detected cell width in the screenshot.
 * @param slotHeight      - Detected cell height in the screenshot.
 * @param referenceHeight - Reference height for vertical crop alignment.
 * @param threshold       - Max Hamming distance to accept (default: 50).
 * @param leftMargin      - Dark left-margin pixels detected from the cell (default 0).
 */
export async function refineWithRuntimeHashes(
  queryHash: string,
  candidates: RuntimeCandidate[],
  slotWidth: number,
  slotHeight: number,
  referenceHeight: number,
  threshold = 50,
  leftMargin = 0,
): Promise<RuntimeMatchResult | null> {
  let bestResult: RuntimeMatchResult | null = null
  let bestDist = threshold + 1

  await Promise.all(
    candidates.map(async (candidate) => {
      const runtimeHash = await renderSpriteHash(
        candidate.hashedId,
        candidate.quality,
        slotWidth,
        slotHeight,
        referenceHeight,
        leftMargin,
      )

      if (!runtimeHash) return // sprite image unavailable

      const dist = hammingDistance(queryHash, runtimeHash)
      if (dist < bestDist) {
        bestDist = dist
        bestResult = {
          hashedId: candidate.hashedId,
          name: candidate.name,
          quality: candidate.quality,
          distance: dist,
          ambiguous: candidate.ambiguous,
          groupId: candidate.groupId,
        }
      }
    }),
  )

  return bestResult
}
