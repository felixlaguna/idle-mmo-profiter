/**
 * test-screenshot-pipeline.js
 *
 * E2E test for the screenshot inventory import pipeline.
 * Uses the ACTUAL production code — zero duplication.
 *
 * Launches Playwright, navigates to the running Vite dev server, and
 * dynamically imports the production TypeScript modules. The pipeline
 * runs inside the browser exactly as it would for a real user.
 *
 * Prerequisites:
 *   - App running via `make up` (Vite dev server on localhost:5173)
 *
 * Usage:
 *   make test-screenshot SCREENSHOT=/path/to/screenshot.png
 *
 * Or directly via Docker:
 *   docker run --rm \
 *     -v $(pwd):/app -v /tmp:/tmp \
 *     --network container:idle_mmo_profiter_app \
 *     mcr.microsoft.com/playwright:v1.52.0-noble \
 *     bash -c 'npm install --no-save playwright@1.52.0 2>/dev/null; \
 *              node /app/scripts/test-screenshot-pipeline.js /path/to/screenshot.png'
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const FIXTURES_DIR = path.resolve(__dirname, '../src/tests/fixtures')
const DEFAULT_SCREENSHOTS = [
  path.join(FIXTURES_DIR, 'screenshot-desktop.png'),
  path.join(FIXTURES_DIR, 'screenshot-phone.jpg'),
]

const VITE_BASE = 'http://localhost:5173/idle-mmo-profiter/'

async function runPipeline(screenshotPath) {
  if (!fs.existsSync(screenshotPath)) {
    console.error('Screenshot not found:', screenshotPath)
    process.exit(1)
  }

  const screenshotB64 = fs.readFileSync(screenshotPath).toString('base64')
  const ext = path.extname(screenshotPath).toLowerCase()
  const mime =
    ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : ext === '.webp'
        ? 'image/webp'
        : 'image/png'
  const screenshotDataUrl = `data:${mime};base64,${screenshotB64}`

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ bypassCSP: true })
  const page = await context.newPage()

  await page.goto(VITE_BASE, { waitUntil: 'networkidle', timeout: 30000 })

  const result = await page.evaluate(async ({ screenshotDataUrl, mime }) => {
    // Import production modules directly from Vite dev server.
    const { detectGridFromFile } = await import('/idle-mmo-profiter/src/utils/gridDetector.ts')
    const { computeDHash, detectLeftMargin, computeCellColor } = await import('/idle-mmo-profiter/src/utils/imageHash.ts')
    const { extractQuantity } = await import('/idle-mmo-profiter/src/utils/quantityReader.ts')
    const { findBestDHashMatch, loadDHashDatabase, getTopCandidates, getTopCandidatesByColor, findBestColorMatch } = await import('/idle-mmo-profiter/src/utils/dHashMatcher.ts')
    const { refineWithRuntimeHashes } = await import('/idle-mmo-profiter/src/utils/runtimeHashGenerator.ts')

    const db = await loadDHashDatabase()
    const dbMeta = {
      entryCount: db.entries.length,
      ambiguousCount: db.ambiguousIds.size,
    }

    // Convert base64 data URL → Blob → File (same path as UI paste/drop).
    const res = await fetch(screenshotDataUrl)
    const blob = await res.blob()
    const file = new File([blob], 'screenshot', { type: mime })

    const cells = await detectGridFromFile(file, { lineThreshold: 0.95 })

    if (!cells || cells.length === 0) {
      return { error: 'No cells detected', dbMeta }
    }

    const cellResults = await Promise.all(
      cells.map(async (cell) => {
        const refH = cell.referenceHeight
        const effectiveH = (cell.imageData.height > refH * 1.5) ? refH : cell.imageData.height
        const leftMargin = detectLeftMargin(cell.imageData, effectiveH)
        const hash = computeDHash(cell.imageData, undefined, cell.referenceHeight)
        const qResult = extractQuantity(cell.imageData, cell.width, cell.height)

        const PHONE_CELL_THRESHOLD = 150
        const RUNTIME_CANDIDATES = 20

        let match = null
        if (hash && !cell.isEmpty) {
          const isPhoneCell = cell.width > PHONE_CELL_THRESHOLD
          if (isPhoneCell) {
            // Phone path: color fingerprint matching (JPEG-robust).
            const COLOR_MATCH_THRESHOLD = 30
            const cellColor = computeCellColor(cell.imageData, cell.referenceHeight, leftMargin)
            if (cellColor) {
              match = await findBestColorMatch(cellColor, COLOR_MATCH_THRESHOLD)
            }

            // Fallback: dHash-based runtime refinement (DB missing cp data).
            if (!match) {
              const topCandidates = await getTopCandidates(hash, RUNTIME_CANDIDATES)
              const runtimeCandidates = topCandidates.map(({ entry, distance }) => ({
                hashedId: entry.h,
                name: entry.n,
                quality: entry.q,
                precomputedDistance: distance,
                ambiguous: !!entry.a,
                groupId: entry.g,
              }))
              const runtimeMatch = await refineWithRuntimeHashes(
                hash,
                runtimeCandidates,
                cell.width,
                cell.height,
                cell.referenceHeight,
                50,
                leftMargin,
              )
              if (runtimeMatch) {
                match = {
                  hashedId: runtimeMatch.hashedId,
                  name: runtimeMatch.name,
                  quality: runtimeMatch.quality,
                  distance: runtimeMatch.distance,
                  ambiguous: runtimeMatch.ambiguous,
                  groupId: runtimeMatch.groupId,
                }
              }
            }
          } else {
            // Desktop path: pre-computed DB — fast and accurate.
            match = await findBestDHashMatch(hash)
          }
        }

        return {
          row: cell.row,
          col: cell.col,
          x: cell.x,
          y: cell.y,
          width: cell.width,
          height: cell.height,
          referenceHeight: cell.referenceHeight,
          isEmpty: cell.isEmpty,
          hash: hash ?? null,
          quantity: qResult.quantity,
          confidence: qResult.confidence,
          match: match
            ? {
                name: match.name,
                hashedId: match.hashedId,
                quality: match.quality,
                distance: match.distance,
                ambiguous: match.ambiguous,
              }
            : null,
        }
      }),
    )

    const rows = Math.max(...cells.map((c) => c.row)) + 1
    const cols = Math.max(...cells.map((c) => c.col)) + 1

    return {
      dbMeta,
      cells: cellResults,
      gridRows: rows,
      gridCols: cols,
      imageWidth: cells[0] ? cells[0].x + cells[0].width : 0,
      imageHeight: cells[cells.length - 1]
        ? cells[cells.length - 1].y + cells[cells.length - 1].height
        : 0,
    }
  }, { screenshotDataUrl, mime })

  await context.close()
  await browser.close()
  return result
}

function statusLabel(distance) {
  if (distance === 0) return 'exact'
  if (distance <= 15) return 'good'
  if (distance <= 30) return 'ok'
  if (distance <= 50) return 'weak'
  return 'MISS'
}

async function processScreenshot(screenshotPath) {
  console.log('')
  console.log('='.repeat(70))
  console.log('Screenshot:', screenshotPath)
  console.log('='.repeat(70))

  let result
  try {
    result = await runPipeline(screenshotPath)
  } catch (err) {
    console.error('FATAL:', err.stack || err)
    return
  }

  if (result.error) {
    console.error('Pipeline error:', result.error)
    if (result.dbMeta) {
      console.log('DB: %d items, %d ambiguous', result.dbMeta.entryCount, result.dbMeta.ambiguousCount)
    }
    return
  }

  const { dbMeta, cells, gridRows, gridCols } = result
  const nonEmpty = cells.filter((c) => !c.isEmpty)

  console.log('')
  console.log('=== Grid Detection ===')
  console.log(
    'Image: ~%dx%d, Cells: %d (%d non-empty)',
    result.imageWidth || '?',
    result.imageHeight || '?',
    cells.length,
    nonEmpty.length,
  )
  console.log('Grid: %d rows × %d cols', gridRows, gridCols)
  console.log('DB: %d items, %d ambiguous', dbMeta.entryCount, dbMeta.ambiguousCount)
  console.log('')

  console.log('=== Items ===')
  const header = '[row,col]  | Qty   | Item                                          | Dist | Status'
  console.log(header)
  console.log('-'.repeat(header.length))

  for (const cell of cells) {
    const loc = `[${cell.row},${cell.col}]`
    if (cell.isEmpty) {
      console.log(`${loc.padEnd(10)} | ----- | (empty)                                         | ---- | ---`)
      continue
    }

    const qty = cell.quantity !== null ? String(cell.quantity) : '?'
    const conf = cell.confidence !== undefined ? ` (${Math.round(cell.confidence * 100)}%)` : ''
    const name = cell.match ? cell.match.name : '(no match)'
    const qual = cell.match?.quality ? ` [${cell.match.quality}]` : ''
    const amb = cell.match?.ambiguous ? ' [amb]' : ''
    const dist = cell.match ? cell.match.distance : -1
    const status = cell.match ? statusLabel(dist) : 'MISS'

    console.log(
      `${loc.padEnd(10)} | ${(qty + conf).padEnd(6)} | ${(name + qual + amb).padEnd(47)} | ${String(dist).padStart(4)} | ${status}`,
    )
  }

  console.log('')
  console.log('=== Summary ===')
  const matched = nonEmpty.filter((c) => c.match !== null)
  const exact = matched.filter((c) => c.match.distance === 0)
  const good = matched.filter((c) => c.match.distance > 0 && c.match.distance <= 15)
  const ok = matched.filter((c) => c.match.distance > 15 && c.match.distance <= 30)
  const weak = matched.filter((c) => c.match.distance > 30)

  console.log(`Matched: ${matched.length}/${nonEmpty.length} non-empty cells`)
  console.log(`  exact=${exact.length}  good=${good.length}  ok=${ok.length}  weak=${weak.length}`)
  const unmatched = nonEmpty.filter((c) => c.match === null)
  if (unmatched.length > 0) {
    console.log(`  unmatched: ${unmatched.length}`)
    for (const c of unmatched) {
      console.log(`    [${c.row},${c.col}] hash=${c.hash?.slice(0, 16)}...`)
    }
  }
}

async function main() {
  const cliArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const screenshots = cliArgs.length > 0 ? cliArgs : DEFAULT_SCREENSHOTS

  for (const screenshotPath of screenshots) {
    await processScreenshot(screenshotPath)
  }
}

main().catch((err) => {
  console.error('Fatal:', err.stack || err)
  process.exit(1)
})
