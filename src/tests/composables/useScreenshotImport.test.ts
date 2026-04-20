/**
 * Tests for useScreenshotImport composable.
 *
 * Strategy:
 * - All three utility modules (gridDetector, dHashMatcher, quantityReader)
 *   are mocked at the module boundary so pipeline logic can be tested without
 *   needing a real Canvas/DOM environment.
 * - useCharacterTracker is mocked to verify applyToInventory integrates
 *   correctly without touching localStorage.
 * - useToast is mocked to assert toast messages.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { useScreenshotImport } from '../../composables/useScreenshotImport'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../utils/gridDetector', () => ({
  detectGridFromFile: vi.fn(),
  detectGridFromClipboard: vi.fn(),
}))

vi.mock('../../utils/imageHash', () => ({
  computeDHash: vi.fn(() => '000038d8790300000000c8d8f81f00000000c8d8e81f0000'),
}))

vi.mock('../../utils/dHashMatcher', () => ({
  loadDHashDatabase: vi.fn(),
  findBestDHashMatch: vi.fn(),
}))

vi.mock('../../utils/quantityReader', () => ({
  extractQuantity: vi.fn(),
}))

vi.mock('../../composables/useCharacterTracker', () => ({
  useCharacterTracker: vi.fn(),
}))

vi.mock('../../composables/useToast', () => ({
  useToast: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Import mocked modules for type-safe access
// ---------------------------------------------------------------------------

import { detectGridFromFile } from '../../utils/gridDetector'
import { computeDHash } from '../../utils/imageHash'
import { loadDHashDatabase, findBestDHashMatch } from '../../utils/dHashMatcher'
import { extractQuantity } from '../../utils/quantityReader'
import { useCharacterTracker } from '../../composables/useCharacterTracker'
import { useToast } from '../../composables/useToast'
import type { GridCell } from '../../utils/gridDetector'
import type { DHashMatchResult } from '../../utils/dHashMatcher'
import type { QuantityResult } from '../../utils/quantityReader'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fake GridCell. */
function makeCell(row: number, col: number, isEmpty = false): GridCell {
  const imageData = {
    data: new Uint8ClampedArray(64 * 64 * 4),
    width: 64,
    height: 64,
    colorSpace: 'srgb' as PredefinedColorSpace,
  } as ImageData

  const canvas = {
    toDataURL: () => `data:image/png;base64,mock${row}${col}`,
  } as unknown as HTMLCanvasElement

  return {
    row,
    col,
    x: col * 64,
    y: (row + 1) * 64,  // offset by 1 row so y > 5 filter doesn't exclude row 0
    width: 64,
    height: 64,
    referenceHeight: 64,
    imageData,
    canvas,
    isEmpty,
  }
}

/** A minimal fake LoadedDatabase returned by loadDHashDatabase(). */
const mockHashDb = {
  exactMap: new Map(),
  entries: [],
  ambiguousIds: new Set<string>(),
  duplicateGroupMap: new Map<string, string[]>(),
}

/** Factory for a clean tracker mock returned by useCharacterTracker(). */
function makeTrackerMock(hasActiveCharacter = true) {
  const setItemQuantity = vi.fn()
  return {
    activeCharacter: { value: hasActiveCharacter ? { id: 'char-1', name: 'Hero' } : null },
    getEffectiveInventory: { value: [] as Array<{ hashId: string; quantity: number }> },
    setItemQuantity,
  }
}

/** Factory for a clean toast mock. */
function makeToastMock() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const mockedDetectGridFromFile = detectGridFromFile as MockedFunction<typeof detectGridFromFile>
const mockedComputeDHash = computeDHash as MockedFunction<typeof computeDHash>
const mockedLoadDHashDatabase = loadDHashDatabase as MockedFunction<typeof loadDHashDatabase>
const mockedFindBestDHashMatch = findBestDHashMatch as MockedFunction<typeof findBestDHashMatch>
const mockedExtractQuantity = extractQuantity as MockedFunction<typeof extractQuantity>
const mockedUseCharacterTracker = useCharacterTracker as MockedFunction<typeof useCharacterTracker>
const mockedUseToast = useToast as MockedFunction<typeof useToast>

beforeEach(() => {
  vi.clearAllMocks()

  // Default: empty grid, no match
  mockedDetectGridFromFile.mockResolvedValue([])
  mockedComputeDHash.mockReturnValue('000038d8790300000000c8d8f81f00000000c8d8e81f0000')
  mockedLoadDHashDatabase.mockResolvedValue(mockHashDb as any)
  mockedFindBestDHashMatch.mockResolvedValue(null)
  mockedExtractQuantity.mockReturnValue({
    quantity: 1,
    confidence: 0.9,
    region: { x: 0, y: 0, width: 10, height: 10 },
  } as QuantityResult)
  mockedUseCharacterTracker.mockReturnValue(makeTrackerMock() as any)
  mockedUseToast.mockReturnValue(makeToastMock() as any)
})

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('useScreenshotImport — initial state', () => {
  it('starts with empty results, errors, and idle progress', () => {
    const { isProcessing, progress, results, errors, previewImage } = useScreenshotImport()

    expect(isProcessing.value).toBe(false)
    expect(results.value).toEqual([])
    expect(errors.value).toEqual([])
    expect(previewImage.value).toBeNull()
    expect(progress.value.step).toBe('Idle')
  })

  it('derived counts start at zero', () => {
    const { matchedCount, ambiguousCount, unrecognizedCount, hasResults } = useScreenshotImport()

    expect(matchedCount.value).toBe(0)
    expect(ambiguousCount.value).toBe(0)
    expect(unrecognizedCount.value).toBe(0)
    expect(hasResults.value).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// clearResults
// ---------------------------------------------------------------------------

describe('clearResults', () => {
  it('resets all state', async () => {
    // Set up a single matched result
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'Iron Ore',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)

    const { processImage, results, errors, clearResults, progress, hasResults } =
      useScreenshotImport()
    const file = new File([], 'inv.png', { type: 'image/png' })
    await processImage(file)

    expect(results.value.length).toBeGreaterThan(0)

    clearResults()

    expect(results.value).toEqual([])
    expect(errors.value).toEqual([])
    expect(hasResults.value).toBe(false)
    expect(progress.value.step).toBe('Idle')
  })
})

// ---------------------------------------------------------------------------
// processImage — empty grid
// ---------------------------------------------------------------------------

describe('processImage — empty grid', () => {
  it('sets progress to "No items found" and leaves results/errors empty', async () => {
    mockedDetectGridFromFile.mockResolvedValue([])

    const { processImage, results, errors, progress } = useScreenshotImport()
    const file = new File([], 'empty.png', { type: 'image/png' })
    await processImage(file)

    expect(results.value).toEqual([])
    expect(errors.value).toEqual([])
    expect(progress.value.step).toBe('No items found')
  })

  it('grid with only empty cells produces no results', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0, true), makeCell(0, 1, true)])

    const { processImage, results, errors } = useScreenshotImport()
    await processImage(new File([], 'empty.png', { type: 'image/png' }))

    expect(results.value).toEqual([])
    expect(errors.value).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// processImage — matched items
// ---------------------------------------------------------------------------

describe('processImage — matched items', () => {
  it('populates results array for a matched cell', async () => {
    const cell = makeCell(0, 0)
    mockedDetectGridFromFile.mockResolvedValue([cell])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h_iron',
      name: 'Iron Ore',
      quality: 'common',
      distance: 5,
      ambiguous: false,
    } satisfies DHashMatchResult)
    mockedExtractQuantity.mockReturnValue({
      quantity: 5,
      confidence: 0.9,
      region: { x: 50, y: 0, width: 14, height: 10 },
    })

    const { processImage, results } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(results.value).toHaveLength(1)
    const r = results.value[0]
    expect(r.hashedId).toBe('h_iron')
    expect(r.name).toBe('Iron Ore')
    expect(r.quantity).toBe(5)
    expect(r.matchDistance).toBe(5)
    // confidence = 1 - 5/192 ≈ 0.974
    expect(r.confidence).toBeCloseTo(1 - 5 / 192)
    expect(r.status).toBe('matched')
    expect(r.gridPosition).toEqual({ row: 0, col: 0 })
  })

  it('defaults quantity to 1 when extractQuantity returns null', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'Stone',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)
    mockedExtractQuantity.mockReturnValue({
      quantity: null,
      confidence: 0,
      region: { x: 0, y: 0, width: 0, height: 0 },
    })

    const { processImage, results } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(results.value[0].quantity).toBe(1)
  })

  it('processes multiple cells correctly', async () => {
    const cells = [makeCell(0, 0), makeCell(0, 1), makeCell(1, 0)]
    mockedDetectGridFromFile.mockResolvedValue(cells)

    let callCount = 0
    mockedFindBestDHashMatch.mockImplementation(async () => {
      callCount++
      return {
        hashedId: `h${callCount}`,
        name: `Item ${callCount}`,
        quality: 'common',
        distance: callCount,
        ambiguous: false,
      } satisfies DHashMatchResult
    })
    mockedExtractQuantity.mockReturnValue({
      quantity: 10,
      confidence: 0.9,
      region: { x: 0, y: 0, width: 0, height: 0 },
    })

    const { processImage, results } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(results.value).toHaveLength(3)
  })

  it('sets isProcessing to false after completion', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'Ore',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)

    const { processImage, isProcessing } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(isProcessing.value).toBe(false)
  })

  it('skips empty cells and only processes non-empty ones', async () => {
    const cells = [makeCell(0, 0, true), makeCell(0, 1, false), makeCell(0, 2, true)]
    mockedDetectGridFromFile.mockResolvedValue(cells)
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'Item',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)

    const { processImage, results } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(results.value).toHaveLength(1)
    expect(results.value[0].gridPosition).toEqual({ row: 0, col: 1 })
  })

  it('adds to errors when computeDHash returns null', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedComputeDHash.mockReturnValue(null)

    const { processImage, errors, results } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(errors.value).toHaveLength(1)
    expect(errors.value[0].reason).toBe('no_match')
    expect(results.value).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// processImage — unrecognized items
// ---------------------------------------------------------------------------

describe('processImage — unrecognized items', () => {
  it('adds unrecognized cells to errors array when findBestDHashMatch returns null', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue(null)

    const { processImage, errors, results } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(errors.value).toHaveLength(1)
    expect(errors.value[0].reason).toBe('no_match')
    expect(errors.value[0].gridPosition).toEqual({ row: 0, col: 0 })
    expect(results.value).toHaveLength(0)
  })

  it('unrecognizedCount reflects errors with no_match reason', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0), makeCell(0, 1)])
    mockedFindBestDHashMatch.mockResolvedValue(null)

    const { processImage, unrecognizedCount } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(unrecognizedCount.value).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// processImage — ambiguous items
// ---------------------------------------------------------------------------

describe('processImage — ambiguous items', () => {
  it('places ambiguous results in results array (not errors)', async () => {
    const groupId = 'grp-hash-123'
    const dbWithGroup = {
      ...mockHashDb,
      duplicateGroupMap: new Map([['grp-hash-123', ['Blue Ore', 'Blue Crystal']]]),
    }
    mockedLoadDHashDatabase.mockResolvedValue(dbWithGroup as any)
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h_blue',
      name: 'Blue Ore',
      quality: 'common',
      distance: 2,
      ambiguous: true,
      groupId,
    } satisfies DHashMatchResult)

    const { processImage, results, errors } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(results.value).toHaveLength(1)
    expect(errors.value).toHaveLength(0)

    const r = results.value[0]
    expect(r.status).toBe('ambiguous')
    expect(r.duplicateGroup).toEqual(['Blue Ore', 'Blue Crystal'])
  })

  it('ambiguousCount tracks unresolved ambiguous results', async () => {
    mockedLoadDHashDatabase.mockResolvedValue({
      ...mockHashDb,
      duplicateGroupMap: new Map([['grp1', ['A', 'B']]]),
    } as any)
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0), makeCell(0, 1)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'A',
      quality: 'common',
      distance: 1,
      ambiguous: true,
      groupId: 'grp1',
    } satisfies DHashMatchResult)

    const { processImage, ambiguousCount } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(ambiguousCount.value).toBe(2)
  })

  it('ambiguous result without groupId falls back to item name only', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'Thing',
      quality: 'common',
      distance: 0,
      ambiguous: true,
      // no groupId
    } satisfies DHashMatchResult)

    const { processImage, results } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(results.value[0].status).toBe('ambiguous')
    // No groupId → duplicateGroup should be undefined (the if block is skipped)
    expect(results.value[0].duplicateGroup).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// resolveAmbiguousItem
// ---------------------------------------------------------------------------

describe('resolveAmbiguousItem', () => {
  it('sets resolvedHashedId on the matching ambiguous result', async () => {
    mockedLoadDHashDatabase.mockResolvedValue({
      ...mockHashDb,
      duplicateGroupMap: new Map([['grp-blue', ['Blue Ore', 'Blue Crystal']]]),
    } as any)
    mockedDetectGridFromFile.mockResolvedValue([makeCell(1, 2)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h_blue',
      name: 'Blue Ore',
      quality: 'common',
      distance: 3,
      ambiguous: true,
      groupId: 'grp-blue',
    } satisfies DHashMatchResult)

    const { processImage, results, resolveAmbiguousItem, ambiguousCount } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(ambiguousCount.value).toBe(1)

    resolveAmbiguousItem({ row: 1, col: 2 }, 'h_crystal')

    expect(results.value[0].resolvedHashedId).toBe('h_crystal')
    // ambiguousCount should drop to 0 because it's now resolved
    expect(ambiguousCount.value).toBe(0)
  })

  it('does nothing when position does not match any result', async () => {
    mockedLoadDHashDatabase.mockResolvedValue({
      ...mockHashDb,
      duplicateGroupMap: new Map([['grp1', ['X', 'Y']]]),
    } as any)
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'X',
      quality: 'common',
      distance: 1,
      ambiguous: true,
      groupId: 'grp1',
    } satisfies DHashMatchResult)

    const { processImage, results, resolveAmbiguousItem } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    resolveAmbiguousItem({ row: 9, col: 9 }, 'some-id')

    expect(results.value[0].resolvedHashedId).toBeUndefined()
  })

  it('does nothing when result is not ambiguous', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'Ore',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)

    const { processImage, results, resolveAmbiguousItem } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    resolveAmbiguousItem({ row: 0, col: 0 }, 'other-id')

    // resolvedHashedId should not be set on a matched result
    expect(results.value[0].resolvedHashedId).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// applyToInventory
// ---------------------------------------------------------------------------

describe('applyToInventory', () => {
  it('calls setItemQuantity for each matched result', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h_iron',
      name: 'Iron Ore',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)
    mockedExtractQuantity.mockReturnValue({
      quantity: 3,
      confidence: 0.9,
      region: { x: 0, y: 0, width: 0, height: 0 },
    })

    const tracker = makeTrackerMock()
    mockedUseCharacterTracker.mockReturnValue(tracker as any)
    const toast = makeToastMock()
    mockedUseToast.mockReturnValue(toast as any)

    const { processImage, applyToInventory } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))
    applyToInventory()

    expect(tracker.setItemQuantity).toHaveBeenCalledTimes(1)
    expect(tracker.setItemQuantity).toHaveBeenCalledWith('h_iron', 3, undefined, 'Iron Ore')
    expect(toast.success).toHaveBeenCalledOnce()
  })

  it('adds to existing inventory quantity (additive semantics)', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h_iron',
      name: 'Iron Ore',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)
    mockedExtractQuantity.mockReturnValue({
      quantity: 5,
      confidence: 0.9,
      region: { x: 0, y: 0, width: 0, height: 0 },
    })

    const tracker = makeTrackerMock()
    // Pre-populate inventory with 10 iron ore
    tracker.getEffectiveInventory.value = [{ hashId: 'h_iron', quantity: 10 }]
    mockedUseCharacterTracker.mockReturnValue(tracker as any)
    mockedUseToast.mockReturnValue(makeToastMock() as any)

    const { processImage, applyToInventory } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))
    applyToInventory()

    // Should be 10 + 5 = 15
    expect(tracker.setItemQuantity).toHaveBeenCalledWith('h_iron', 15, undefined, 'Iron Ore')
  })

  it('skips ambiguous results that are not manually resolved', async () => {
    mockedLoadDHashDatabase.mockResolvedValue({
      ...mockHashDb,
      duplicateGroupMap: new Map([['grp1', ['X', 'Y']]]),
    } as any)
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'X',
      quality: 'common',
      distance: 2,
      ambiguous: true,
      groupId: 'grp1',
    } satisfies DHashMatchResult)

    const tracker = makeTrackerMock()
    mockedUseCharacterTracker.mockReturnValue(tracker as any)
    const toast = makeToastMock()
    mockedUseToast.mockReturnValue(toast as any)

    const { processImage, applyToInventory } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))
    applyToInventory()

    expect(tracker.setItemQuantity).not.toHaveBeenCalled()
    expect(toast.warning).toHaveBeenCalledOnce()
  })

  it('applies resolved ambiguous items using resolvedHashedId', async () => {
    mockedLoadDHashDatabase.mockResolvedValue({
      ...mockHashDb,
      duplicateGroupMap: new Map([['grp-blue', ['Blue Ore', 'Blue Crystal']]]),
    } as any)
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h_blue',
      name: 'Blue Ore',
      quality: 'common',
      distance: 1,
      ambiguous: true,
      groupId: 'grp-blue',
    } satisfies DHashMatchResult)
    mockedExtractQuantity.mockReturnValue({
      quantity: 7,
      confidence: 0.9,
      region: { x: 0, y: 0, width: 0, height: 0 },
    })

    const tracker = makeTrackerMock()
    mockedUseCharacterTracker.mockReturnValue(tracker as any)
    const toast = makeToastMock()
    mockedUseToast.mockReturnValue(toast as any)

    const { processImage, resolveAmbiguousItem, applyToInventory } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    // User picks 'h_crystal' from the duplicate group
    resolveAmbiguousItem({ row: 0, col: 0 }, 'h_crystal')
    applyToInventory()

    expect(tracker.setItemQuantity).toHaveBeenCalledWith('h_crystal', 7, undefined, 'Blue Ore')
    expect(toast.success).toHaveBeenCalledOnce()
  })

  it('shows error toast when no active character is selected', async () => {
    const tracker = makeTrackerMock(false) // no active character
    mockedUseCharacterTracker.mockReturnValue(tracker as any)
    const toast = makeToastMock()
    mockedUseToast.mockReturnValue(toast as any)

    const { applyToInventory } = useScreenshotImport()
    applyToInventory()

    expect(tracker.setItemQuantity).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledOnce()
  })

  it('shows warning toast when there are no imported items', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue(null)

    const tracker = makeTrackerMock()
    mockedUseCharacterTracker.mockReturnValue(tracker as any)
    const toast = makeToastMock()
    mockedUseToast.mockReturnValue(toast as any)

    const { processImage, applyToInventory } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))
    applyToInventory()

    expect(tracker.setItemQuantity).not.toHaveBeenCalled()
    expect(toast.warning).toHaveBeenCalledOnce()
  })

  it('includes unrecognized count in success toast when mixed results', async () => {
    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0), makeCell(0, 1)])

    let call = 0
    mockedFindBestDHashMatch.mockImplementation(async () => {
      call++
      if (call === 1) {
        return {
          hashedId: 'h1',
          name: 'Ore',
          quality: 'common',
          distance: 0,
          ambiguous: false,
        } satisfies DHashMatchResult
      }
      return null
    })
    mockedExtractQuantity.mockReturnValue({
      quantity: 2,
      confidence: 0.9,
      region: { x: 0, y: 0, width: 0, height: 0 },
    })

    const tracker = makeTrackerMock()
    mockedUseCharacterTracker.mockReturnValue(tracker as any)
    const toast = makeToastMock()
    mockedUseToast.mockReturnValue(toast as any)

    const { processImage, applyToInventory } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))
    applyToInventory()

    // 1 matched, 1 unrecognized — should be success toast with details
    expect(toast.success).toHaveBeenCalledOnce()
    const message: string = toast.success.mock.calls[0][0]
    expect(message).toContain('1 item')
    expect(message).toContain('unrecognized')
  })
})

// ---------------------------------------------------------------------------
// processFromClipboard
// ---------------------------------------------------------------------------

describe('processFromClipboard', () => {
  it('extracts image from DataTransfer and processes it', async () => {
    const file = new File(['fake'], 'paste.png', { type: 'image/png' })
    const mockItem = {
      type: 'image/png',
      getAsFile: () => file,
    }
    const clipboardData = {
      items: [mockItem],
    } as unknown as DataTransfer

    mockedDetectGridFromFile.mockResolvedValue([makeCell(0, 0)])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'Paste Item',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)

    const { processFromClipboard, results } = useScreenshotImport()
    await processFromClipboard(clipboardData)

    expect(mockedDetectGridFromFile).toHaveBeenCalledWith(file, { lineThreshold: 0.95 })
    expect(results.value).toHaveLength(1)
    expect(results.value[0].name).toBe('Paste Item')
  })

  it('does nothing when clipboard contains no image', async () => {
    const clipboardData = {
      items: [{ type: 'text/plain', getAsFile: () => null }],
    } as unknown as DataTransfer

    const { processFromClipboard, results, errors, progress } = useScreenshotImport()
    await processFromClipboard(clipboardData)

    expect(results.value).toEqual([])
    expect(errors.value).toEqual([])
    expect(progress.value.step).toBe('No image found in clipboard')
  })
})

// ---------------------------------------------------------------------------
// processClipboardEvent
// ---------------------------------------------------------------------------

describe('processClipboardEvent', () => {
  it('does nothing when event has no clipboardData', async () => {
    const event = { clipboardData: null } as unknown as ClipboardEvent
    const { processClipboardEvent, results } = useScreenshotImport()
    await processClipboardEvent(event)
    expect(results.value).toEqual([])
  })

  it('delegates to processFromClipboard when clipboardData is present', async () => {
    const file = new File(['x'], 'clip.png', { type: 'image/png' })
    const event = {
      clipboardData: {
        items: [{ type: 'image/png', getAsFile: () => file }],
      },
    } as unknown as ClipboardEvent

    mockedDetectGridFromFile.mockResolvedValue([])

    const { processClipboardEvent, progress } = useScreenshotImport()
    await processClipboardEvent(event)

    expect(mockedDetectGridFromFile).toHaveBeenCalledWith(file, { lineThreshold: 0.95 })
    expect(progress.value.step).toBe('No items found')
  })
})

// ---------------------------------------------------------------------------
// Progress reporting
// ---------------------------------------------------------------------------

describe('progress reporting', () => {
  it('final progress shows done with total cell count', async () => {
    const cells = [makeCell(0, 0), makeCell(0, 1)]
    mockedDetectGridFromFile.mockResolvedValue(cells)
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'h1',
      name: 'X',
      quality: 'common',
      distance: 0,
      ambiguous: false,
    } satisfies DHashMatchResult)

    const { processImage, progress } = useScreenshotImport()
    await processImage(new File([], 'inv.png', { type: 'image/png' }))

    expect(progress.value.current).toBe(2)
    expect(progress.value.total).toBe(2)
    expect(progress.value.step).toContain('Done')
  })
})

// ---------------------------------------------------------------------------
// isProcessing guard
// ---------------------------------------------------------------------------

describe('isProcessing guard', () => {
  it('second processImage call while processing does nothing', async () => {
    let resolveDetect!: (cells: GridCell[]) => void
    const pending = new Promise<GridCell[]>((res) => {
      resolveDetect = res
    })
    mockedDetectGridFromFile.mockReturnValue(pending)

    const { processImage, isProcessing } = useScreenshotImport()

    const p1 = processImage(new File([], 'a.png', { type: 'image/png' }))
    // Second call should be ignored while first is in-flight
    const p2 = processImage(new File([], 'b.png', { type: 'image/png' }))

    resolveDetect([])
    await Promise.all([p1, p2])

    // detectGridFromFile was only called once (second call was no-op)
    expect(mockedDetectGridFromFile).toHaveBeenCalledTimes(1)
    expect(isProcessing.value).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// dHash matching path
// ---------------------------------------------------------------------------

describe('dHash matching path', () => {
  it('calls findBestDHashMatch for desktop-sized cells', async () => {
    const desktopCell = makeCell(0, 0)
    mockedDetectGridFromFile.mockResolvedValue([desktopCell])
    mockedFindBestDHashMatch.mockResolvedValue({
      hashedId: 'hashid2',
      name: 'Gold Ore',
      quality: 'standard',
      distance: 8,
      ambiguous: false,
    } satisfies DHashMatchResult)

    const { processImage, results } = useScreenshotImport()
    await processImage(new File([], 'desktop.png', { type: 'image/png' }))

    expect(mockedFindBestDHashMatch).toHaveBeenCalledWith(
      '000038d8790300000000c8d8f81f00000000c8d8e81f0000',
    )
    expect(results.value).toHaveLength(1)
    expect(results.value[0].name).toBe('Gold Ore')
    expect(results.value[0].status).toBe('matched')
  })
})
