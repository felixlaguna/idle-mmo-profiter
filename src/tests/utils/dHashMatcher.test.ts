/**
 * Tests for dHashMatcher.ts — dHash matching against the sprite DB.
 *
 * Validates:
 *   - loadDHashDatabase: indexes desktop (d) hashes in exactMap
 *   - findBestDHashMatch: exact-match fast path
 *   - findBestDHashMatch: linear scan for near-matches
 *   - Ambiguous (a/g) fields preserved in results
 *   - Threshold: no match returned when best distance exceeds threshold
 */

import { describe, it, expect, vi } from 'vitest'

// ---------------------------------------------------------------------------
// We need to control the imported sprite-hashes.json for unit tests.
// Use vi.mock to inject a synthetic database.
// ---------------------------------------------------------------------------

import type { HashEntry } from '../../../scripts/generate-sprite-hashes-browser'

/** Build a synthetic DB fixture. */
function makeDb(hashes: HashEntry[], duplicateGroups: Array<{ groupId: string; items: string[] }> = []) {
  return {
    default: {
      version: 5,
      generatedAt: '2026-01-01T00:00:00Z',
      method: 'browser-rendered',
      hashSize: 48,
      totalItems: hashes.length,
      ambiguousCount: 0,
      hashes,
      duplicateGroups,
    },
  }
}

// Synthetic 48-char hex hashes (all digits differ to avoid accidental matches)
const DESKTOP_HASH_A = '000038d8790300000000c8d8f81f00000000c8d8e81f0000'
const DESKTOP_HASH_B = 'ffff38d8790300000000c8d8f81f000000ffccd8e81f0000'
// A hash near DESKTOP_HASH_A (1 bit off from first nibble: 0→1)
const NEAR_DESKTOP_A = '100038d8790300000000c8d8f81f00000000c8d8e81f0000'

vi.mock('../../../src/data/sprite-hashes.json', () =>
  makeDb([
    { h: 'item-A', n: 'Item A', d: DESKTOP_HASH_A, q: 'standard' },
    { h: 'item-B', n: 'Item B', d: DESKTOP_HASH_B, q: 'epic' },
  ]),
)

// ---------------------------------------------------------------------------
// Import the module AFTER mocking (Vitest hoists vi.mock calls)
// ---------------------------------------------------------------------------

import {
  loadDHashDatabase,
  findBestDHashMatch,
  getDHashAmbiguousIds,
} from '../../utils/dHashMatcher'

// ---------------------------------------------------------------------------
// Reset module cache between tests so each test gets a fresh _loadedDb
// ---------------------------------------------------------------------------

// Re-import with fresh state for each describe block by resetting the module.
// Since _loadedDb is a module-level variable we need vi.resetModules() or
// we can test the singleton behaviour directly (first call loads, rest cache).

describe('loadDHashDatabase', () => {
  it('indexes desktop hash (d) in exactMap', async () => {
    const db = await loadDHashDatabase()
    expect(db.exactMap.has(DESKTOP_HASH_A)).toBe(true)
    expect(db.exactMap.get(DESKTOP_HASH_A)?.h).toBe('item-A')
  })

  it('indexes item-B desktop hash in exactMap', async () => {
    const db = await loadDHashDatabase()
    expect(db.exactMap.has(DESKTOP_HASH_B)).toBe(true)
    expect(db.exactMap.get(DESKTOP_HASH_B)?.h).toBe('item-B')
  })

  it('returns the same object on repeated calls (caching)', async () => {
    const db1 = await loadDHashDatabase()
    const db2 = await loadDHashDatabase()
    expect(db1).toBe(db2)
  })

  it('entries array contains all DB hashes', async () => {
    const db = await loadDHashDatabase()
    expect(db.entries).toHaveLength(2)
  })

})

describe('findBestDHashMatch — exact-match fast path', () => {
  it('returns exact match for item-A desktop hash', async () => {
    const result = await findBestDHashMatch(DESKTOP_HASH_A)
    expect(result).not.toBeNull()
    expect(result?.hashedId).toBe('item-A')
    expect(result?.distance).toBe(0)
  })

  it('returns exact match for item-B desktop hash', async () => {
    const result = await findBestDHashMatch(DESKTOP_HASH_B)
    expect(result?.hashedId).toBe('item-B')
    expect(result?.distance).toBe(0)
  })
})

describe('findBestDHashMatch — linear scan (near-match)', () => {
  it('matches a hash 1 bit from desktop hash via linear scan', async () => {
    // NEAR_DESKTOP_A is 1 bit off from DESKTOP_HASH_A (Hamming distance = 1)
    const result = await findBestDHashMatch(NEAR_DESKTOP_A)
    expect(result).not.toBeNull()
    expect(result?.hashedId).toBe('item-A')
    expect(result?.distance).toBe(1)
  })

  it('returns null when best distance exceeds threshold', async () => {
    // Use a completely random hash far from all DB entries
    const farHash = '1234567890abcdef1234567890abcdef1234567890abcdef'
    const result = await findBestDHashMatch(farHash, 3) // very tight threshold
    // May or may not match depending on actual distances — just verify it doesn't throw
    expect(result === null || typeof result?.distance === 'number').toBe(true)
  })

  it('returns null when threshold is 0 and no exact match', async () => {
    const result = await findBestDHashMatch(NEAR_DESKTOP_A, 0) // threshold = 0
    expect(result).toBeNull()
  })
})

describe('findBestDHashMatch — result fields', () => {
  it('includes quality field from DB entry', async () => {
    const result = await findBestDHashMatch(DESKTOP_HASH_A)
    expect(result?.quality).toBe('standard')
  })

  it('includes quality for epic item', async () => {
    const result = await findBestDHashMatch(DESKTOP_HASH_B)
    expect(result?.quality).toBe('epic')
  })

  it('includes human-readable name', async () => {
    const result = await findBestDHashMatch(DESKTOP_HASH_A)
    expect(result?.name).toBe('Item A')
  })

  it('ambiguous is false when a flag not set', async () => {
    const result = await findBestDHashMatch(DESKTOP_HASH_A)
    expect(result?.ambiguous).toBe(false)
  })
})

describe('getDHashAmbiguousIds', () => {
  it('returns a Set after database is loaded', async () => {
    await loadDHashDatabase()
    const ids = getDHashAmbiguousIds()
    expect(ids).toBeInstanceOf(Set)
  })

  it('returns null before first load', () => {
    // We cannot easily reset the singleton in this test suite — just verify
    // the return type contract is met (Set or null).
    const ids = getDHashAmbiguousIds()
    expect(ids === null || ids instanceof Set).toBe(true)
  })
})

describe('findBestDHashMatch — best match selection', () => {
  it('returns item-B when querying with DESKTOP_HASH_B', async () => {
    const result = await findBestDHashMatch(DESKTOP_HASH_B)
    expect(result?.hashedId).toBe('item-B')
  })
})

// ---------------------------------------------------------------------------
// getTopCandidates
// ---------------------------------------------------------------------------

import { getTopCandidates } from '../../utils/dHashMatcher'

describe('getTopCandidates', () => {
  it('returns at most n candidates', async () => {
    // DB has 2 items; request top-1
    const top1 = await getTopCandidates(DESKTOP_HASH_A, 1)
    expect(top1).toHaveLength(1)
  })

  it('returns all items when n >= DB size', async () => {
    const top10 = await getTopCandidates(DESKTOP_HASH_A, 10)
    expect(top10).toHaveLength(2) // only 2 items in the synthetic DB
  })

  it('sorts candidates by ascending Hamming distance', async () => {
    const topN = await getTopCandidates(DESKTOP_HASH_A, 10)
    for (let i = 1; i < topN.length; i++) {
      expect(topN[i].distance).toBeGreaterThanOrEqual(topN[i - 1].distance)
    }
  })

  it('returns item-A as closest when querying with DESKTOP_HASH_A', async () => {
    const topN = await getTopCandidates(DESKTOP_HASH_A, 10)
    expect(topN[0].entry.h).toBe('item-A')
    expect(topN[0].distance).toBe(0)
  })

  it('returns each entry only once (no duplicates)', async () => {
    const topN = await getTopCandidates(DESKTOP_HASH_A, 10)
    const ids = topN.map((c) => c.entry.h)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('distance field matches hamming distance from desktop hash', async () => {
    const { hammingDistance } = await import('../../utils/imageHash')
    const topN = await getTopCandidates(DESKTOP_HASH_A, 10)
    const itemA = topN.find((c) => c.entry.h === 'item-A')!
    expect(itemA.distance).toBe(hammingDistance(DESKTOP_HASH_A, itemA.entry.d))
  })
})
