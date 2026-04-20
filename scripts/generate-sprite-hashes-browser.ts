/**
 * Browser-rendered sprite hash generator.
 *
 * Replaces the Sharp-based thumbnail approach with a Playwright-rendered dHash
 * pipeline. Each sprite is rendered inside a browser slot that mirrors the game's
 * exact CSS (same quality backgrounds, same 48×48 img, same slot dimensions),
 * then the rendered result is hashed with dHash using the center-crop pipeline.
 *
 * Pipeline (center-crop, matches client-side computeDHash in imageHash.ts):
 *   1. Render the sprite in a browser slot (84×64) with correct quality background.
 *   2. Crop the center CANONICAL_SPRITE_SIZE × CANONICAL_SPRITE_SIZE region.
 *   3. Resize to 9×8 (dHash grid).
 *   4. Compute 192-bit dHash (64-bit luminance + 64-bit R-B + 64-bit G-B).
 *
 * The third (G-B) channel separates red items (G≈B, so G-B≈0) from orange
 * items (G>B, so G-B>0), which were indistinguishable at 128 bits.
 *
 * Why center-crop instead of bbox detection:
 *   JPEG-compressed screenshots inflate the detected bbox by ~10px relative to
 *   clean DB renders, causing Hamming distances of 40+.  Since all IdleMMO
 *   sprites are centered, center-crop gives deterministic, JPEG-robust hashes
 *   with distances of 10-25 for correct matches.  The bbox detection utilities
 *   remain available in imageHash.ts for other uses.
 *
 * Usage (run via the Playwright Docker image):
 *   docker run --rm \
 *     -v /home/felix/idle-mmo-profiter:/app \
 *     -v /tmp:/tmp \
 *     --network host \
 *     mcr.microsoft.com/playwright:v1.52.0-noble \
 *     node /tmp/generate-hashes.js
 *
 * Or directly with tsx (when playwright is installed locally):
 *   tsx scripts/generate-sprite-hashes-browser.ts [--limit=N] [--dry-run]
 *
 * Output: src/data/sprite-hashes.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
// @ts-ignore — playwright is installed only in the Playwright Docker image, not in devDependencies
import { chromium, type Page } from 'playwright'

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.join(__dirname, '..')

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

/** A single entry in the output sprite-hashes.json database. */
export interface HashEntry {
  /** hashedId — game-internal identifier. */
  h: string
  /** Human-readable item name. */
  n: string
  /** 48-character hex dHash string (192 bits) — computed from desktop slot (84×64). */
  d: string
  /** Item quality string, e.g. "standard", "epic". */
  q: string
  /** True when this item shares a dHash with at least one other item. */
  a?: true
  /** Group identifier shared by all items with the same dHash (if `a` is true). */
  g?: string
}

export interface DuplicateGroup {
  groupId: string
  items: string[]
}

export interface SpriteHashDatabase {
  version: 5
  generatedAt: string
  method: 'browser-rendered'
  hashSize: 48
  totalItems: number
  ambiguousCount: number
  hashes: HashEntry[]
  duplicateGroups: DuplicateGroup[]
}

// ---------------------------------------------------------------------------
// Quality constants — must match the game's slot CSS exactly
// ---------------------------------------------------------------------------

/**
 * Slot background and border for each quality tier.
 * The CSS mirrors IdleMMO's inventory slot styling.
 */
const QUALITY_STYLES: Record<
  string,
  { background: string; border: string }
> = {
  standard: {
    background: 'rgb(22,29,42)',
    border: '#37415166',
  },
  refined: {
    background: 'rgb(21,41,81)',
    border: '#4d76d64d',
  },
  premium: {
    background: 'rgb(22,56,43)',
    border: '#1fd60b4d',
  },
  epic: {
    background: 'rgb(66,29,37)',
    border: '#c0392b4d',
  },
  legendary: {
    background: 'rgb(61,50,34)',
    border: '#f7bd1e4d',
  },
  mythic: {
    background: 'linear-gradient(to bottom right, #764430, #492f31)',
    border: '#c2410c4d',
  },
  unique: {
    background: 'linear-gradient(to bottom right, #7c598e, #4e2760)',
    border: '#7e22ce4d',
  },
}

/**
 * Desktop slot dimensions for rendering.
 * Sprite renders at IMG_SIZE (48px) inside this frame.
 */
const SLOT_WIDTH = 84
const SLOT_HEIGHT = 64

/**
 * Image size inside the desktop slot — matches the game's w-12 h-12 (48×48px).
 */
const IMG_SIZE = 48

/**
 * Canonical sprite size — the final square dimension used for hashing.
 * The proportional crop is resized to this before computing dHash.
 *
 * Must match CANONICAL_SPRITE_SIZE in src/utils/imageHash.ts.
 */
const CANONICAL_SPRITE_SIZE = 48

/**
 * Proportional sprite crop fractions.
 *
 * The game renders a 48×48 sprite image centred inside an 84×64 slot.
 * cropW = max(48, round(slotWidth  × SPRITE_WIDTH_FRAC))
 * cropH = max(48, round(slotHeight × SPRITE_HEIGHT_FRAC))
 *
 * For the canonical 84×64 slot this reduces to exactly 48×48, so existing
 * DB hashes are unchanged.  On phone-scale cells (300×260) the crop is
 * ~171×195 which covers the full sprite before downscaling to 48×48.
 *
 * Must match SPRITE_WIDTH_FRAC / SPRITE_HEIGHT_FRAC in src/utils/imageHash.ts.
 */
const SPRITE_WIDTH_FRAC  = 48 / 84   // ~0.5714
const SPRITE_HEIGHT_FRAC = 48 / 64   // 0.75

// ---------------------------------------------------------------------------
// dHash grid size
// ---------------------------------------------------------------------------

/**
 * dHash grid size. We use 9×8 to produce 64 horizontal-difference bits.
 */
const HASH_GRID_W = 9
const HASH_GRID_H = 8

// ---------------------------------------------------------------------------
// dHash computation (runs inside the Playwright browser via page.evaluate)
// ---------------------------------------------------------------------------

/**
 * Serialisable options passed into the browser context for dHash computation.
 */
interface DHHashOptions {
  slotWidth: number
  slotHeight: number
  /** Pixel size (width = height) of the <img> element inside the slot. */
  imgSize: number
  imgSrc: string // data-URL of the sprite PNG
  quality: string
  qualityBackground: string
  qualityBorder: string
  gridW: number
  gridH: number
}

/**
 * Build the HTML page content for a single slot render.
 *
 * We pass the sprite as a data-URL so no network is required.
 */
function buildSlotHtml(opts: DHHashOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; }
  .slot {
    border-radius: 0.5rem;
    text-align: center;
    padding: 0.5rem 0.75rem;
    position: relative;
    border: 1px solid;
    width: ${opts.slotWidth}px;
    height: ${opts.slotHeight}px;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${opts.qualityBackground};
    border-color: ${opts.qualityBorder};
  }
  .slot img {
    display: inline-block;
    width: ${opts.imgSize}px;
    height: ${opts.imgSize}px;
    image-rendering: auto;
  }
</style>
</head>
<body>
<div class="slot" id="slot">
  <img id="sprite" src="${opts.imgSrc}" alt="" />
</div>
</body>
</html>`
}

/**
 * Compute a 192-bit dHash string (48-char hex) for the rendered slot using
 * the center-crop pipeline.
 *
 * Pipeline:
 *   1. Render slot at SLOT_WIDTH × SLOT_HEIGHT.
 *   2. Crop the center CANONICAL_SPRITE_SIZE × CANONICAL_SPRITE_SIZE region.
 *   3. Downscale to gridW × gridH.
 *   4. Compute 192-bit dHash.
 *
 * Returns 64-bit luminance (16-char) + 64-bit (R-B) (16-char) + 64-bit (G-B) (16-char) = 48-char hex.
 * Runs inside the browser via page.evaluate() — so it has access to the
 * real canvas API. Returns null on failure.
 */
async function computeSlotDHash(
  page: Page,
  opts: DHHashOptions,
): Promise<string | null> {
  // Set the page HTML and wait for the image to load
  await page.setContent(buildSlotHtml(opts), { waitUntil: 'load' })

  // Wait for the image element to finish loading
  await page.waitForFunction(() => {
    const img = document.getElementById('sprite') as HTMLImageElement | null
    return img !== null && img.complete && img.naturalWidth > 0
  }, { timeout: 5000 })

  // Compute dHash inside the browser using the proportional-crop pipeline.
  //
  // Pipeline:
  //   1. Render sprite in slotWidth×slotHeight canvas with correct quality background.
  //   2. Proportional crop: cropW = max(48, round(slotWidth  × spriteWidthFrac))
  //                         cropH = max(48, round(slotHeight × spriteHeightFrac))
  //      Centred horizontally and vertically.  For the canonical 84×64 slot this
  //      gives exactly 48×48 — identical to the old fixed crop.
  //   3. Resize the proportional crop to canonicalSpriteSize × canonicalSpriteSize.
  //   4. Downscale to gridW×gridH (9×8).
  //   5. Compute 192-bit dHash: 64-bit luminance + 64-bit (R-B) + 64-bit (G-B).
  const hash = await page.evaluate(
    ({
      slotWidth,
      slotHeight,
      imgSize,
      gridW,
      gridH,
      canonicalSpriteSize,
      spriteWidthFrac,
      spriteHeightFrac,
    }: {
      slotWidth: number
      slotHeight: number
      imgSize: number
      gridW: number
      gridH: number
      canonicalSpriteSize: number
      spriteWidthFrac: number
      spriteHeightFrac: number
    }) => {
      // -----------------------------------------------------------------------
      // Step 1: Render slot to canvas
      // -----------------------------------------------------------------------
      const canvas = document.createElement('canvas')
      canvas.width = slotWidth
      canvas.height = slotHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      const slotEl = document.getElementById('slot') as HTMLElement
      const computedStyle = window.getComputedStyle(slotEl)
      const bg = computedStyle.backgroundColor
      ctx.fillStyle = bg || 'rgb(22,29,42)'
      ctx.fillRect(0, 0, slotWidth, slotHeight)

      const img = document.getElementById('sprite') as HTMLImageElement
      const imgX = Math.round((slotWidth - imgSize) / 2)
      // Centre the sprite within the slot height.
      // imgSize = round(slotHeight × 48/64) = round(140 × 0.75) = 105 — fits within 140 px.
      // imgY = round((140 - 105) / 2) = 17.
      // This mirrors renderSpriteHash: imgY = round((effectiveH - imgSize) / 2).
      const imgY = Math.round((slotHeight - imgSize) / 2)
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize)

      // -----------------------------------------------------------------------
      // Step 2: Proportional square crop — mirrors computeDHash exactly.
      //
      // computeDHash receives height=270, referenceHeight=140 → effectiveH=140.
      // The generator renders at slotHeight=140 (the single slot height = refH).
      // cropEffectiveH = slotHeight = 140.
      // -----------------------------------------------------------------------
      const cropEffectiveH = slotHeight
      const cropW = Math.max(canonicalSpriteSize, Math.round(slotWidth  * spriteWidthFrac))
      const cropH = Math.max(canonicalSpriteSize, Math.round(cropEffectiveH * spriteHeightFrac))
      const cropSize = Math.min(cropW, cropH)
      const cropX = Math.round((slotWidth  - cropSize) / 2)
      const cropY = Math.round((cropEffectiveH - cropSize) / 2)

      // -----------------------------------------------------------------------
      // Step 3: Resize proportional square crop to canonicalSpriteSize × canonicalSpriteSize
      // -----------------------------------------------------------------------
      const canonCanvas = document.createElement('canvas')
      canonCanvas.width = canonicalSpriteSize
      canonCanvas.height = canonicalSpriteSize
      const canonCtx = canonCanvas.getContext('2d')
      if (!canonCtx) return null
      canonCtx.drawImage(canvas, cropX, cropY, cropSize, cropSize, 0, 0, canonicalSpriteSize, canonicalSpriteSize)

      // -----------------------------------------------------------------------
      // Step 4: Downscale to gridW × gridH directly from the canonical canvas
      // -----------------------------------------------------------------------
      const smallCanvas = document.createElement('canvas')
      smallCanvas.width = gridW
      smallCanvas.height = gridH
      const smallCtx = smallCanvas.getContext('2d')
      if (!smallCtx) return null
      smallCtx.drawImage(canonCanvas, 0, 0, canonicalSpriteSize, canonicalSpriteSize, 0, 0, gridW, gridH)

      // -----------------------------------------------------------------------
      // Step 4: Extract pixels and compute dHash
      // -----------------------------------------------------------------------
      const pixels = smallCtx.getImageData(0, 0, gridW, gridH).data
      const nPx = gridW * gridH
      const luma: number[] = new Array<number>(nPx)
      const rb: number[] = new Array<number>(nPx)
      const gb: number[] = new Array<number>(nPx)
      for (let i = 0; i < nPx; i++) {
        const base = i * 4
        const r = pixels[base]
        const g = pixels[base + 1]
        const b = pixels[base + 2]
        luma[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        rb[i]   = r - b
        gb[i]   = g - b
      }

      const outW = gridW - 1
      let lumaHex = ''
      let rbHex = ''
      let gbHex = ''
      for (let chunk = 0; chunk < 64; chunk += 4) {
        let lumaNibble = 0
        let rbNibble = 0
        let gbNibble = 0
        for (let bit = 0; bit < 4; bit++) {
          const bitIdx = chunk + bit
          const row = Math.floor(bitIdx / outW)
          const col = bitIdx % outW
          const left = luma[row * gridW + col]
          const right = luma[row * gridW + col + 1]
          lumaNibble = (lumaNibble << 1) | (left < right ? 1 : 0)
          const rbLeft = rb[row * gridW + col]
          const rbRight = rb[row * gridW + col + 1]
          rbNibble = (rbNibble << 1) | (rbLeft < rbRight ? 1 : 0)
          const gbLeft = gb[row * gridW + col]
          const gbRight = gb[row * gridW + col + 1]
          gbNibble = (gbNibble << 1) | (gbLeft < gbRight ? 1 : 0)
        }
        lumaHex += lumaNibble.toString(16)
        rbHex   += rbNibble.toString(16)
        gbHex   += gbNibble.toString(16)
      }

      return lumaHex + rbHex + gbHex
    },
    {
      slotWidth: opts.slotWidth,
      slotHeight: opts.slotHeight,
      imgSize: opts.imgSize,
      gridW: opts.gridW,
      gridH: opts.gridH,
      canonicalSpriteSize: CANONICAL_SPRITE_SIZE,
      spriteWidthFrac: SPRITE_WIDTH_FRAC,
      spriteHeightFrac: SPRITE_HEIGHT_FRAC,
    },
  )

  return hash
}

// ---------------------------------------------------------------------------
// Average colour extraction (for phone colour-fingerprint matching)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read a PNG file and return a base64 data-URL.
 */
function pngToDataUrl(filePath: string): string {
  const buf = fs.readFileSync(filePath)
  const b64 = buf.toString('base64')
  return `data:image/png;base64,${b64}`
}

/**
 * Determine item quality from the sprite manifest entry, falling back to
 * "standard" when no quality has been recorded.
 *
 * Quality is populated by running `npx tsx scripts/patch-manifest-quality.ts`
 * which fetches quality data from the IdleMMO API and writes a normalised
 * lower-case quality string (standard | refined | premium | epic | legendary |
 * mythic | unique) into each sprite entry in manifest.json.
 */
function inferQuality(
  hashedId: string,
  _itemName: string,
  _type: string,
  sprites: Record<string, { name: string; type: string; file: string; quality?: string }>,
): string {
  const entry = sprites[hashedId]
  if (entry?.quality) return entry.quality
  return 'standard'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('IdleMMO Browser-Rendered Sprite Hash Generator')
  console.log('================================================\n')

  const args = process.argv.slice(2)
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const itemLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity
  const dryRun = args.includes('--dry-run')

  if (dryRun) console.log('DRY RUN MODE — no files will be written\n')
  if (itemLimit < Infinity) console.log(`LIMIT MODE — processing first ${itemLimit} items\n`)

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------

  const defaultsPath = path.join(ROOT, 'src/data/defaults.json')
  const manifestPath = path.join(ROOT, 'src/data/sprites/manifest.json')
  const spritesDir = path.join(ROOT, 'src/data/sprites')

  if (!fs.existsSync(defaultsPath)) {
    console.error(`Error: defaults.json not found at ${defaultsPath}`)
    process.exit(1)
  }
  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: manifest.json not found at ${manifestPath}`)
    process.exit(1)
  }

  const defaultsRaw = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'))
  const masterItems: Array<{ id: string; name: string; hashedId: string; categories?: string[] }> =
    defaultsRaw.masterItems ?? defaultsRaw.allItems ?? []

  const manifestRaw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const sprites: Record<string, { name: string; type: string; file: string; quality?: string }> =
    manifestRaw.sprites ?? {}

  if (masterItems.length === 0) {
    console.error('Error: no items found in defaults.json')
    process.exit(1)
  }

  // Collect items to process: deduplicate by hashedId (masterItems may have
  // both allitem-* and mat-* entries for the same underlying sprite)
  const seenHashedIds = new Set<string>()
  const itemsToProcess: Array<{ hashedId: string; name: string; quality: string }> = []

  for (const item of masterItems) {
    const hid = item.hashedId
    if (!hid || seenHashedIds.has(hid)) continue
    seenHashedIds.add(hid)

    // Only process items that have a local sprite PNG
    const spritePath = path.join(spritesDir, `${hid}.png`)
    if (!fs.existsSync(spritePath)) continue

    const type = sprites[hid]?.type ?? 'MATERIAL'
    const quality = inferQuality(hid, item.name, type, sprites)
    itemsToProcess.push({ hashedId: hid, name: item.name, quality })

    if (itemsToProcess.length >= itemLimit) break
  }

  console.log(
    `Items with local sprites: ${itemsToProcess.length} ` +
      `(total masterItems: ${masterItems.length})\n`,
  )

  // -------------------------------------------------------------------------
  // Launch Playwright
  // -------------------------------------------------------------------------

  console.log('Launching Chromium…')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 800, height: 200 },
  })
  const page = await context.newPage()
  console.log('Browser ready.\n')

  // -------------------------------------------------------------------------
  // Process items
  // -------------------------------------------------------------------------

  const entries: HashEntry[] = []
  let successCount = 0
  let failCount = 0

  const startTime = Date.now()

  for (let i = 0; i < itemsToProcess.length; i++) {
    const { hashedId, name, quality } = itemsToProcess[i]
    const progress = `[${i + 1}/${itemsToProcess.length}]`

    const spritePath = path.join(spritesDir, `${hashedId}.png`)
    const imgSrc = pngToDataUrl(spritePath)

    const style = QUALITY_STYLES[quality] ?? QUALITY_STYLES.standard

    // --- Desktop hash (84×64 slot, 48px sprite) ---
    const desktopOpts: DHHashOptions = {
      slotWidth: SLOT_WIDTH,
      slotHeight: SLOT_HEIGHT,
      imgSize: IMG_SIZE,
      imgSrc,
      quality,
      qualityBackground: style.background,
      qualityBorder: style.border,
      gridW: HASH_GRID_W,
      gridH: HASH_GRID_H,
    }

    const desktopHash = await computeSlotDHash(page, desktopOpts)

    if (!desktopHash) {
      console.warn(`${progress} FAIL  ${name}`)
      failCount++
      continue
    }

    const entry: HashEntry = { h: hashedId, n: name, d: desktopHash, q: quality }
    entries.push(entry)
    successCount++

    // Progress every 50 items
    if ((i + 1) % 50 === 0 || i === itemsToProcess.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const rate = (successCount / (Date.now() - startTime) * 1000).toFixed(1)
      console.log(
        `${progress} ${name}  d=${desktopHash}  (${elapsed}s, ${rate} items/s)`,
      )
    }
  }

  await browser.close()
  console.log(`\nBrowser closed.`)

  // -------------------------------------------------------------------------
  // Detect duplicate hashes (ambiguous items)
  // -------------------------------------------------------------------------

  const hashToEntries = new Map<string, HashEntry[]>()
  for (const entry of entries) {
    const existing = hashToEntries.get(entry.d) ?? []
    existing.push(entry)
    hashToEntries.set(entry.d, existing)
  }

  const duplicateGroups: DuplicateGroup[] = []
  let ambiguousCount = 0

  for (const [hash, group] of hashToEntries) {
    if (group.length > 1) {
      const groupId = hash // use the full 32-char hash as group ID
      for (const entry of group) {
        entry.a = true
        entry.g = groupId
      }
      duplicateGroups.push({
        groupId,
        items: group.map((e) => e.n),
      })
      ambiguousCount += group.length
    }
  }

  // -------------------------------------------------------------------------
  // Build output
  // -------------------------------------------------------------------------

  const db: SpriteHashDatabase = {
    version: 5,
    generatedAt: new Date().toISOString(),
    method: 'browser-rendered',
    hashSize: 48,
    totalItems: entries.length,
    ambiguousCount,
    hashes: entries,
    duplicateGroups,
  }

  // -------------------------------------------------------------------------
  // Report
  // -------------------------------------------------------------------------

  console.log('\n--- Summary ---')
  console.log(`  Processed:   ${itemsToProcess.length}`)
  console.log(`  Hashed:      ${successCount}`)
  console.log(`  Failed:      ${failCount}`)
  console.log(`  Ambiguous:   ${ambiguousCount} (${duplicateGroups.length} groups)`)
  console.log(`  Total time:  ${((Date.now() - startTime) / 1000).toFixed(1)}s`)

  if (duplicateGroups.length > 0) {
    console.log('\n--- Duplicate Hash Groups ---')
    for (const g of duplicateGroups.slice(0, 10)) {
      console.log(`  [${g.groupId}]: ${g.items.join(', ')}`)
    }
    if (duplicateGroups.length > 10) {
      console.log(`  ... and ${duplicateGroups.length - 10} more`)
    }
  }

  // -------------------------------------------------------------------------
  // Write output
  // -------------------------------------------------------------------------

  const outputPath = path.join(ROOT, 'src/data/sprite-hashes.json')

  if (!dryRun) {
    fs.writeFileSync(outputPath, JSON.stringify(db, null, 2), 'utf8')
    console.log(`\nWrote ${outputPath}`)
  } else {
    console.log(`\nDRY RUN — would write to ${outputPath}`)
    console.log('First 3 entries:')
    for (const e of entries.slice(0, 3)) {
      console.log(`  ${e.h}  ${e.n}  hash=${e.d}  quality=${e.q}`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
