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
  const db = dbModule.default as { hashes: HashEntry[]; duplicateGroups: Array<{ groupId: string; items: string[] }> }

  const exactMap = new Map<string, HashEntry>()
  const ambiguousIds = new Set<string>()
  const duplicateGroupMap = new Map<string, string[]>()

  for (const entry of db.hashes) {
    exactMap.set(entry.d, entry)
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

  // Stage 2: Linear Hamming scan.
  let bestEntry: HashEntry | null = null
  let bestDist = threshold + 1

  for (const entry of db.entries) {
    const dist = hammingDistance(queryHash, entry.d)
    if (dist < bestDist) {
      bestDist = dist
      bestEntry = entry
      if (dist === 0) break // can't do better
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
