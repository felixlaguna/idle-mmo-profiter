/**
 * dHash-based sprite matcher.
 *
 * Loads sprite-hashes.json (v4, 192-bit hashes) and matches inventory cell
 * dHash fingerprints against the database using Hamming distance.
 *
 * Two-stage lookup for performance:
 *   1. O(1) exact-match via a Map<hash, entry> — handles identical renders.
 *   2. Linear Hamming scan — handles minor JPEG artefacts / rendering variation.
 *
 * 192-bit hashes (48-char hex) use threshold 50 (26% of 192 bits).
 * This is proportionally equivalent to the 128-bit threshold of 30 (23.4% of 128).
 * The third (G-B) channel adds 64 more bits, increasing separation between
 * color families (e.g. red vs orange items).
 */

import type { HashEntry } from '../../scripts/generate-sprite-hashes-browser'
import { hammingDistance } from './imageHash'

// ---------------------------------------------------------------------------
// Color fingerprint helpers
// ---------------------------------------------------------------------------

/**
 * Euclidean distance in RGB space between two color triplets.
 * Cheaper than L*a*b* conversion and sufficient for item sprite discrimination.
 */
export function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

// ---------------------------------------------------------------------------
// Threshold
// ---------------------------------------------------------------------------

/**
 * Maximum Hamming distance to consider a match.
 *
 * 192-bit hash (48-char hex): 45 bits ≈ 23.4% of 192 bits.
 * Proportionally equivalent to the 128-bit threshold of 30 (23.4% of 128).
 * Calibrated to maintain the same relative sensitivity while covering the
 * extra 64 bits from the (G-B) channel.
 */
export const DEFAULT_HAMMING_THRESHOLD = 50

// ---------------------------------------------------------------------------
// Match result
// ---------------------------------------------------------------------------

export interface DHashMatchResult {
  /** Game-internal hashedId. */
  hashedId: string
  /** Human-readable item name. */
  name: string
  /** Item quality tier. */
  quality: string
  /** Hamming distance from query hash (0 = exact match). */
  distance: number
  /** True if this item shares its hash with other items (ambiguous). */
  ambiguous: boolean
  /** Group ID for ambiguous items. */
  groupId?: string
}

// ---------------------------------------------------------------------------
// Database loader
// ---------------------------------------------------------------------------

interface LoadedDatabase {
  /** O(1) exact-match map. */
  exactMap: Map<string, HashEntry>
  /** All entries for linear scan fallback. */
  entries: HashEntry[]
  /** Set of hashedIds that are ambiguous (share a hash with another item). */
  ambiguousIds: Set<string>
  /** Map from groupId to list of hashedIds in that group. */
  duplicateGroupMap: Map<string, string[]>
}

let _loadedDb: LoadedDatabase | null = null

/**
 * Load (and cache) the sprite-hashes.json database.
 *
 * Called lazily on first match; subsequent calls return the cached result.
 */
export async function loadDHashDatabase(): Promise<LoadedDatabase> {
  if (_loadedDb) return _loadedDb

  // Dynamic import so this module works in both Vite and Node environments.
  const dbModule = await import('../data/sprite-hashes.json')
  const db = dbModule.default as unknown as { hashes: HashEntry[]; duplicateGroups: Array<{ groupId: string; items: string[] }> }

  const exactMap = new Map<string, HashEntry>()
  const ambiguousIds = new Set<string>()
  const duplicateGroupMap = new Map<string, string[]>()

  for (const entry of db.hashes) {
    // Index by desktop hash.
    exactMap.set(entry.d, entry)
    // Also index by phone hash so exact-match fast path works for phone screenshots.
    if (entry.dp) {
      exactMap.set(entry.dp, entry)
    }
    if (entry.a) {
      ambiguousIds.add(entry.h)
    }
  }

  for (const group of db.duplicateGroups) {
    duplicateGroupMap.set(group.groupId, group.items)
  }

  _loadedDb = { exactMap, entries: db.hashes, ambiguousIds, duplicateGroupMap }
  return _loadedDb
}

/**
 * Expose the ambiguous hashedId set for O(1) UI-layer lookups.
 * Returns null if the DB has not been loaded yet.
 */
export function getDHashAmbiguousIds(): Set<string> | null {
  return _loadedDb ? _loadedDb.ambiguousIds : null
}

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

/**
 * Return the top-N candidates from the pre-computed DB sorted by ascending
 * Hamming distance.  No threshold is applied — all entries are scored and the
 * closest N are returned.  Used by the runtime hash refinement path to select
 * which sprites to render in the user's browser.
 *
 * @param queryHash  - 48-char hex dHash string from computeDHash().
 * @param n          - Number of candidates to return (default: 20).
 * @returns Array of at most n candidates sorted by ascending distance.
 */
export async function getTopCandidates(
  queryHash: string,
  n = 20,
): Promise<Array<{ entry: HashEntry; distance: number }>> {
  const db = await loadDHashDatabase()

  // Score all entries, keeping only the top n via an insertion sort on a
  // bounded array (n is small so this is O(entries × n) ≈ 1 346 × 20).
  const topN: Array<{ entry: HashEntry; distance: number }> = []

  for (const entry of db.entries) {
    // Use whichever pre-computed hash (desktop or phone) is closer.
    let dist = hammingDistance(queryHash, entry.d)
    if (entry.dp) {
      const distDp = hammingDistance(queryHash, entry.dp)
      if (distDp < dist) dist = distDp
    }

    if (topN.length < n) {
      topN.push({ entry, distance: dist })
      topN.sort((a, b) => a.distance - b.distance)
    } else if (dist < topN[topN.length - 1].distance) {
      topN[topN.length - 1] = { entry, distance: dist }
      topN.sort((a, b) => a.distance - b.distance)
    }
  }

  return topN
}

/**
 * Return the top-N candidates from the pre-computed DB sorted by ascending
 * RGB color distance.  Requires that the DB includes the `cp` (phone colour
 * fingerprint) field — returns an empty array if the DB has no `cp` data.
 *
 * Used as a replacement for the dHash-based `getTopCandidates` for phone
 * screenshots, where JPEG compression at large cell sizes makes dHash
 * unreliable but the average crop color remains stable.
 *
 * @param queryColor - Average [R, G, B] of the screenshot cell's crop region.
 * @param n          - Number of candidates to return (default: 20).
 * @returns Array of at most n candidates sorted by ascending colorDistance.
 */
export async function getTopCandidatesByColor(
  queryColor: [number, number, number],
  n = 20,
): Promise<Array<{ entry: HashEntry; colorDistance: number }>> {
  const db = await loadDHashDatabase()

  // Check whether any entry has `cp` — if not, color DB is not available.
  const hasColorData = db.entries.some((e) => e.cp !== undefined)
  if (!hasColorData) return []

  // Score all entries that have a `cp` field, keep top-N via insertion sort.
  const topN: Array<{ entry: HashEntry; colorDistance: number }> = []

  for (const entry of db.entries) {
    if (!entry.cp) continue
    const dist = colorDistance(queryColor, entry.cp)

    if (topN.length < n) {
      topN.push({ entry, colorDistance: dist })
      topN.sort((a, b) => a.colorDistance - b.colorDistance)
    } else if (dist < topN[topN.length - 1].colorDistance) {
      topN[topN.length - 1] = { entry, colorDistance: dist }
      topN.sort((a, b) => a.colorDistance - b.colorDistance)
    }
  }

  return topN
}

/**
 * Find the best matching item by RGB color fingerprint.
 *
 * Scans all DB entries that have a `cp` field and returns the one with the
 * smallest Euclidean RGB distance.  Returns null if no entry has `cp` data
 * or if the best distance exceeds `threshold`.
 *
 * @param queryColor  - Average [R, G, B] of the screenshot cell's crop region.
 * @param threshold   - Max Euclidean color distance to accept (default: 30).
 * @returns Best match by color, or null if DB has no color data / no match within threshold.
 */
export async function findBestColorMatch(
  queryColor: [number, number, number],
  threshold = 30,
): Promise<DHashMatchResult | null> {
  const db = await loadDHashDatabase()

  let bestEntry: HashEntry | null = null
  let bestDist = threshold + 1

  for (const entry of db.entries) {
    if (!entry.cp) continue
    const dist = colorDistance(queryColor, entry.cp)
    if (dist < bestDist) {
      bestDist = dist
      bestEntry = entry
      if (dist === 0) break // exact match
    }
  }

  if (!bestEntry) return null

  return {
    hashedId: bestEntry.h,
    name: bestEntry.n,
    quality: bestEntry.q,
    distance: Math.round(bestDist),
    ambiguous: !!bestEntry.a,
    groupId: bestEntry.g,
  }
}

/**
 * Find the best matching item for a given dHash fingerprint.
 *
 * @param queryHash  - 48-char hex dHash string from computeDHash().
 * @param threshold  - Maximum Hamming distance to accept (default: DEFAULT_HAMMING_THRESHOLD).
 * @returns Best match, or null if no item within threshold.
 */
export async function findBestDHashMatch(
  queryHash: string,
  threshold = DEFAULT_HAMMING_THRESHOLD,
): Promise<DHashMatchResult | null> {
  const db = await loadDHashDatabase()

  // Stage 1: O(1) exact-match fast path.
  const exact = db.exactMap.get(queryHash)
  if (exact) {
    return {
      hashedId: exact.h,
      name: exact.n,
      quality: exact.q,
      distance: 0,
      ambiguous: !!exact.a,
      groupId: exact.g,
    }
  }

  // Stage 2: Linear Hamming scan — check both desktop hash (d) and phone hash (dp).
  let bestEntry: HashEntry | null = null
  let bestDist = threshold + 1

  for (const entry of db.entries) {
    // Check desktop hash.
    const distD = hammingDistance(queryHash, entry.d)
    if (distD < bestDist) {
      bestDist = distD
      bestEntry = entry
      if (distD === 0) break // can't do better
    }
    // Check phone hash (if present) — picks the better of the two.
    if (entry.dp) {
      const distDp = hammingDistance(queryHash, entry.dp)
      if (distDp < bestDist) {
        bestDist = distDp
        bestEntry = entry
        if (distDp === 0) break // can't do better
      }
    }
  }

  if (!bestEntry) return null

  return {
    hashedId: bestEntry.h,
    name: bestEntry.n,
    quality: bestEntry.q,
    distance: bestDist,
    ambiguous: !!bestEntry.a,
    groupId: bestEntry.g,
  }
}
