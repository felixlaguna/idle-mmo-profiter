/**
 * Download all item sprite images and save them permanently to the repo.
 *
 * This script:
 * 1. Reads all items from defaults.json (masterItems array)
 * 2. For each item that has an image_url (via the inspect endpoint), downloads
 *    the sprite from the CDN
 * 3. Saves the image as src/data/sprites/<hashedId>.png
 * 4. Writes a manifest file at src/data/sprites/manifest.json mapping
 *    hashedId → { name, type, file }
 * 5. Uses the existing .sprite-cache/ to avoid re-downloading already cached images
 * 6. Respects the API's 20 req/min rate limit via the existing apiClient
 * 7. Shows progress during the download
 *
 * After running this script, generate-sprite-hashes.ts reads from src/data/sprites/
 * instead of downloading from the API — making hash generation fast and repeatable.
 *
 * Run with: tsx scripts/download-sprites.ts
 *
 * API key resolution order:
 * 1. CLI argument: --api-key=<key>
 * 2. process.env.IDLE_MMO_SECRET_KEY_CLI
 * 3. .env file (IDLE_MMO_SECRET_KEY_CLI)
 * 4. Interactive prompt
 *
 * Options:
 * --limit=N        Process only first N items (for testing)
 * --no-cache       Ignore .sprite-cache/ and re-download all images from CDN
 * --cache-dir=DIR  Directory for temporary image cache (default: .sprite-cache)
 * --dry-run        Show what would be downloaded without saving anything
 * --force          Re-download and overwrite items already present in src/data/sprites/
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import { apiClient } from '../src/api/client.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ------- Output paths -------
const SPRITES_DIR = path.join(__dirname, '../src/data/sprites')
const MANIFEST_PATH = path.join(SPRITES_DIR, 'manifest.json')

// ------- API types -------
interface MasterItem {
  hashedId: string
  name: string
  categories: string[]
  [key: string]: unknown
}

// Normalised item shape used internally (matches old AllItem shape)
interface AllItem {
  hashedId: string
  name: string
  type: string
}

interface DefaultData {
  masterItems?: MasterItem[]
  [key: string]: unknown
}

interface ItemDetails {
  hashed_id: string
  name: string
  image_url: string
  [key: string]: unknown
}

// ------- Manifest types -------
export interface ManifestEntry {
  /** Item display name */
  name: string
  /** Item type (e.g. SWORD, CHEST, etc.) */
  type: string
  /** Filename within src/data/sprites/ (e.g. "<hashedId>.png") */
  file: string
  /** Item quality tier from the game API (e.g. "standard", "epic", "mythic"). */
  quality?: string
}

export interface SpritesManifest {
  version: 1
  generatedAt: string
  totalSprites: number
  /** Map from hashedId → ManifestEntry */
  sprites: Record<string, ManifestEntry>
}

// ------- API key helpers -------
function loadApiKeyFromEnv(): string | null {
  const envPath = path.join(__dirname, '../.env')
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const match = envContent.match(/^IDLE_MMO_SECRET_KEY_CLI=(.+)$/m)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

async function getApiKey(): Promise<string> {
  const args = process.argv.slice(2)
  const apiKeyArg = args.find((a) => a.startsWith('--api-key='))
  if (apiKeyArg) {
    console.log('Using API key from --api-key argument')
    return apiKeyArg.split('=')[1]
  }
  const processEnvKey = process.env.IDLE_MMO_SECRET_KEY_CLI
  if (processEnvKey) {
    console.log('Using API key from process.env.IDLE_MMO_SECRET_KEY_CLI')
    return processEnvKey
  }
  const envKey = loadApiKeyFromEnv()
  if (envKey) {
    console.log('Using API key from .env file (IDLE_MMO_SECRET_KEY_CLI)')
    return envKey
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question('Enter your IdleMMO API key: ', (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// ------- Image fetching -------

/**
 * Fetch the image_url for an item via the inspect endpoint.
 * Returns null if the item cannot be inspected.
 */
async function fetchImageUrl(hashedId: string): Promise<string | null> {
  if (!hashedId) return null
  try {
    const response = await apiClient.get<{ item: ItemDetails }>(
      `/item/${hashedId}/inspect`
    )
    return response.item?.image_url ?? null
  } catch {
    return null
  }
}

/**
 * Fetch image bytes from the CDN URL.
 * The CDN (cdn.idle-mmo.com) serves images publicly — no auth required.
 * NOTE: Do NOT send an Authorization header; it causes a 400 response.
 */
async function fetchImageBytes(imageUrl: string, retries = 2): Promise<Buffer | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(imageUrl)
      if (response.status === 404) return null
      if (!response.ok) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
          continue
        }
        return null
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      return null
    }
  }
  return null
}

// ------- Main -------
async function main() {
  console.log('IdleMMO Sprite Downloader')
  console.log('=========================\n')

  const args = process.argv.slice(2)
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const itemLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity
  const noCache = args.includes('--no-cache')
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const cacheDirArg = args.find((a) => a.startsWith('--cache-dir='))
  const cacheDir = cacheDirArg
    ? cacheDirArg.split('=')[1]
    : path.join(__dirname, '../.sprite-cache')

  if (dryRun) console.log('DRY RUN MODE - No files will be written\n')
  if (noCache) console.log('NO-CACHE MODE - Re-downloading all images from CDN\n')
  if (force) console.log('FORCE MODE - Overwriting existing sprites\n')
  if (itemLimit < Infinity) console.log(`LIMIT MODE - Processing first ${itemLimit} items\n`)

  // Ensure sprite output directory exists
  if (!dryRun && !fs.existsSync(SPRITES_DIR)) {
    fs.mkdirSync(SPRITES_DIR, { recursive: true })
    console.log(`Created sprites directory: ${SPRITES_DIR}\n`)
  }

  // Ensure cache directory exists
  if (!dryRun && !fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
    console.log(`Created cache directory: ${cacheDir}\n`)
  }

  // Get API key
  const apiKey = await getApiKey()
  if (!apiKey) {
    console.error('Error: API key is required')
    process.exit(1)
  }

  // Configure the API client for Node.js usage
  apiClient.configure({
    baseUrl: 'https://api.idle-mmo.com/v1',
    apiKey,
  })

  // Read defaults.json
  const defaultsPath = path.join(__dirname, '../src/data/defaults.json')
  const data: DefaultData = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'))
  // Normalise masterItems into the internal AllItem shape (derive type from first category).
  // Skip items without a hashedId — they have no market identity and cannot be fetched.
  const allItems: AllItem[] = (data.masterItems ?? [])
    .filter((item) => Boolean(item.hashedId))
    .map((item) => ({
      hashedId: item.hashedId,
      name: item.name,
      type: item.categories?.[0] ?? 'unknown',
    }))

  if (allItems.length === 0) {
    console.error('Error: No items found in defaults.json masterItems array.')
    console.error('Make sure defaults.json contains a masterItems array.')
    process.exit(1)
  }

  const itemsToProcess = itemLimit < Infinity ? allItems.slice(0, itemLimit) : allItems
  console.log(`Items in database:  ${allItems.length}`)
  console.log(`Items to process:   ${itemsToProcess.length}`)

  // Load existing manifest if it exists (to merge/update)
  let existingManifest: SpritesManifest | null = null
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
      const existingCount = Object.keys(existingManifest?.sprites ?? {}).length
      console.log(`Existing manifest:  ${existingCount} sprites`)
    } catch {
      console.warn('Warning: Could not parse existing manifest.json, will regenerate')
    }
  }

  console.log()

  // Track counters
  let downloaded = 0
  let skippedAlreadyExists = 0
  let cacheHits = 0
  let urlCacheHits = 0
  let failCount = 0

  const manifestSprites: Record<string, ManifestEntry> = existingManifest?.sprites ?? {}

  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i]
    const progress = `[${i + 1}/${itemsToProcess.length}]`
    const outputFilename = `${item.hashedId}.png`
    const outputPath = path.join(SPRITES_DIR, outputFilename)
    const imageCachePath = path.join(cacheDir, `${item.hashedId}.png`)
    const urlCachePath = path.join(cacheDir, `${item.hashedId}.url`)

    // Skip if already present in sprites dir (unless --force)
    if (!force && !dryRun && fs.existsSync(outputPath)) {
      skippedAlreadyExists++
      // Ensure manifest entry exists even for skipped items
      if (!manifestSprites[item.hashedId]) {
        manifestSprites[item.hashedId] = {
          name: item.name,
          type: item.type,
          file: outputFilename,
        }
      }
      continue
    }

    let imageBuffer: Buffer | null = null

    // Try .sprite-cache/ first (avoids CDN download)
    if (!noCache && fs.existsSync(imageCachePath)) {
      imageBuffer = fs.readFileSync(imageCachePath)
      cacheHits++
    } else {
      // Need to fetch from network — get image_url via inspect endpoint
      let imageUrl: string | null = null

      if (!noCache && fs.existsSync(urlCachePath)) {
        imageUrl = fs.readFileSync(urlCachePath, 'utf8').trim()
        urlCacheHits++
      } else {
        imageUrl = await fetchImageUrl(item.hashedId)
        if (imageUrl && !noCache && !dryRun) {
          fs.writeFileSync(urlCachePath, imageUrl, 'utf8')
        }
      }

      if (!imageUrl) {
        console.warn(`${progress} NO-URL   ${item.name}`)
        failCount++
        continue
      }

      // Fetch image bytes from CDN
      imageBuffer = await fetchImageBytes(imageUrl)
      if (imageBuffer && !noCache && !dryRun) {
        fs.writeFileSync(imageCachePath, imageBuffer)
      }
    }

    if (!imageBuffer) {
      console.warn(`${progress} NO-IMAGE ${item.name}`)
      failCount++
      continue
    }

    // Save to sprites directory
    if (!dryRun) {
      fs.writeFileSync(outputPath, imageBuffer)
    }

    // Add to manifest
    manifestSprites[item.hashedId] = {
      name: item.name,
      type: item.type,
      file: outputFilename,
    }
    downloaded++

    // Progress log every 25 items or at the end
    if ((i + 1) % 25 === 0 || i === itemsToProcess.length - 1) {
      const pct = Math.round(((i + 1) / itemsToProcess.length) * 100)
      const action = dryRun ? 'would-save' : 'saved'
      console.log(
        `${progress} ${pct}% — ${downloaded} ${action}, ${skippedAlreadyExists} skipped, ` +
        `${cacheHits} img-cache, ${urlCacheHits} url-cache, ${failCount} failed`
      )
    }
  }

  // Write manifest
  const totalSprites = Object.keys(manifestSprites).length
  const manifest: SpritesManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalSprites,
    sprites: manifestSprites,
  }

  console.log(`\n=== Summary ===`)
  console.log(`Downloaded:         ${downloaded}`)
  console.log(`Already existed:    ${skippedAlreadyExists}`)
  console.log(`Image cache hits:   ${cacheHits}`)
  console.log(`URL cache hits:     ${urlCacheHits}`)
  console.log(`Failed:             ${failCount}`)
  console.log(`Total in manifest:  ${totalSprites}`)

  if (!dryRun) {
    const manifestJson = JSON.stringify(manifest, null, 2)
    fs.writeFileSync(MANIFEST_PATH, manifestJson, 'utf8')
    const sizeKb = (manifestJson.length / 1024).toFixed(1)
    console.log(`\nWrote ${MANIFEST_PATH} (${sizeKb} KB)`)
    console.log(`Sprites saved to:   ${SPRITES_DIR}`)
  } else {
    console.log(`\n[DRY RUN] Would write manifest and ${downloaded} sprites to ${SPRITES_DIR}`)
  }

  console.log('\nDone!')
  console.log('\nNext step: tsx scripts/generate-sprite-hashes.ts')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
