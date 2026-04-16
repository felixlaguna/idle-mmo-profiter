/**
 * patch-manifest-quality.ts
 *
 * Fetches quality data for every hashedId in src/data/sprites/manifest.json
 * via the IdleMMO inspect endpoint and writes the normalised quality string
 * back into each sprite entry.
 *
 * Quality values returned by the API are UPPER_CASE (e.g. "MYTHIC").
 * We normalise to lower-case to match QUALITY_STYLES keys used by the hash
 * generator: standard | refined | premium | epic | legendary | mythic | unique
 *
 * Rate limiting: 20 req/min.  We send batches of 20 requests in parallel and
 * then wait until the minute window has elapsed before the next batch.
 *
 * Usage:
 *   npx tsx scripts/patch-manifest-quality.ts [--dry-run]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MANIFEST_PATH = path.join(__dirname, '../src/data/sprites/manifest.json')
const API_BASE = 'https://api.idle-mmo.com/v1'

// Hard rate limit: 20 requests per 60-second window
const BATCH_SIZE = 20
const WINDOW_MS = 62_000 // 62 s gives a safe buffer over the 60 s window

function loadApiKeyFromEnv(): string | null {
  const envPath = path.join(__dirname, '../.env')
  try {
    const content = fs.readFileSync(envPath, 'utf8')
    const m = content.match(/^IDLE_MMO_SECRET_KEY_CLI=(.+)$/m)
    return m ? m[1].trim() : null
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function inspectItem(
  hashedId: string,
  apiKey: string,
): Promise<{ hashedId: string; quality: string } | null> {
  const url = `${API_BASE}/item/${hashedId}/inspect`
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'User-Agent': 'IdleMMO-ProfitCalc-PatchManifestQuality/1.0',
      },
    })
    if (res.status === 429) {
      console.warn(`  429 rate-limited for ${hashedId} — will retry in next batch`)
      return null
    }
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} for ${hashedId}`)
      return null
    }
    const data = (await res.json()) as { item?: { quality?: string }; quality?: string }
    const quality = (data?.item?.quality ?? data?.quality ?? '').toLowerCase() || 'standard'
    return { hashedId, quality }
  } catch (err) {
    console.warn(`  Network error for ${hashedId}:`, err)
    return null
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')

  const apiKey = loadApiKeyFromEnv()
  if (!apiKey) {
    console.error('Error: IDLE_MMO_SECRET_KEY_CLI not found in .env')
    process.exit(1)
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Error: manifest not found at ${MANIFEST_PATH}`)
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as {
    version: number
    generatedAt: string
    totalSprites: number
    sprites: Record<string, { name: string; type: string; file: string; quality?: string }>
  }

  const sprites = manifest.sprites

  // Only fetch items that don't already have quality set (allows re-running
  // incrementally if interrupted).
  const todo = Object.keys(sprites).filter((hid) => !sprites[hid].quality)
  const alreadyDone = Object.keys(sprites).length - todo.length

  console.log(`Manifest: ${Object.keys(sprites).length} sprites`)
  console.log(`Already has quality: ${alreadyDone}`)
  console.log(`To fetch: ${todo.length}`)
  if (dryRun) console.log('DRY RUN — manifest will NOT be written')
  console.log()

  if (todo.length === 0) {
    console.log('All sprites already have quality. Nothing to do.')
    return
  }

  const batches = Math.ceil(todo.length / BATCH_SIZE)
  console.log(`Processing ${todo.length} items in ${batches} batches of ≤${BATCH_SIZE}`)
  console.log(`Estimated time: ~${Math.ceil(todo.length / BATCH_SIZE)} minutes\n`)

  const qualityMap = new Map<string, string>()
  let failures = 0

  for (let b = 0; b < batches; b++) {
    const slice = todo.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE)
    const batchStart = Date.now()

    process.stdout.write(`Batch ${b + 1}/${batches} (${slice.length} items)… `)

    const results = await Promise.all(slice.map((hid) => inspectItem(hid, apiKey)))

    let batchOk = 0
    for (const r of results) {
      if (r) {
        qualityMap.set(r.hashedId, r.quality)
        batchOk++
      } else {
        failures++
      }
    }

    process.stdout.write(`${batchOk}/${slice.length} ok  (total fetched: ${qualityMap.size})\n`)

    // Save progress after every batch so the script can be interrupted and resumed
    if (!dryRun) {
      for (const [hid, quality] of qualityMap) {
        if (sprites[hid]) sprites[hid].quality = quality
      }
      manifest.generatedAt = new Date().toISOString()
      fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
    }

    // Wait the rest of the 62-second window before the next batch
    if (b < batches - 1) {
      const elapsed = Date.now() - batchStart
      const wait = Math.max(0, WINDOW_MS - elapsed)
      if (wait > 0) {
        process.stdout.write(`  waiting ${(wait / 1000).toFixed(1)}s for rate-limit window…\n`)
        await sleep(wait)
      }
    }
  }

  // Final patch and write
  let patched = 0
  for (const [hid, quality] of qualityMap) {
    if (sprites[hid] && sprites[hid].quality !== quality) {
      sprites[hid].quality = quality
      patched++
    }
  }

  console.log(`\nDone.`)
  console.log(`  Fetched quality for: ${qualityMap.size} items`)
  console.log(`  Patched in manifest: ${patched}`)
  console.log(`  Failures/skipped:    ${failures}`)

  if (!dryRun) {
    manifest.generatedAt = new Date().toISOString()
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
    console.log(`\nWrote updated manifest to ${MANIFEST_PATH}`)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
