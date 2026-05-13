#!/usr/bin/env tsx
/**
 * generate-cdn-filename-map — builds CDN filename → hashedId lookup table.
 *
 * Reads .sprite-cache/*.url files (each containing a CDN URL for a sprite)
 * and the sprites manifest to produce src/data/cdn-filename-map.json.
 *
 * This map enables deterministic HTML-based inventory import: the IdleMMO
 * inventory page HTML contains <img src=".../skins/<FILENAME>"> tags, and
 * this file maps those filenames to hashedIds.
 *
 * Run with: tsx scripts/generate-cdn-filename-map.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CACHE_DIR = path.join(__dirname, '../.sprite-cache')
const MANIFEST_PATH = path.join(__dirname, '../src/data/sprites/manifest.json')
const OUTPUT_PATH = path.join(__dirname, '../src/data/cdn-filename-map.json')

// --- Load manifest for name + quality metadata ---
interface ManifestEntry {
  name: string
  type: string
  file: string
  quality?: string
}

interface SpritesManifest {
  version: number
  sprites: Record<string, ManifestEntry>
}

const manifest: SpritesManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
const sprites = manifest.sprites

// --- Build CDN filename → hashedId mapping from cache ---
const SKINS_RE = /\/skins\/(.+)$/
const urlFiles = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.url'))

const filenames: Record<string, { h: string; n: string; q: string }> = {}

for (const uf of urlFiles) {
  const hashedId = uf.replace('.url', '')
  const cdnUrl = fs.readFileSync(path.join(CACHE_DIR, uf), 'utf-8').trim()
  const match = cdnUrl.match(SKINS_RE)
  if (!match) continue

  const filename = match[1]
  const spriteInfo = sprites[hashedId]

  filenames[filename] = {
    h: hashedId,
    n: spriteInfo?.name ?? '',
    q: spriteInfo?.quality ?? '',
  }
}

// --- Write output ---
const output = {
  version: 1,
  generatedAt: new Date().toISOString(),
  totalMappings: Object.keys(filenames).length,
  filenames,
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output), 'utf-8')

console.log(`Generated ${output.totalMappings} CDN filename mappings → ${OUTPUT_PATH}`)
