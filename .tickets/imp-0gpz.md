---
id: imp-0gpz
status: closed
deps: [imp-8l12]
links: []
created: 2026-04-15T10:25:27Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
---
# Phase 2: Client-side dHash computation and matching engine

Create a composable/utility module for client-side perceptual hash computation and matching.

### Files to create:
1. `src/utils/imageHash.ts` - Core dHash computation using Canvas API
2. `src/utils/hashMatcher.ts` - Hash database loading and matching logic

### imageHash.ts:
- `computeDHash(imageData: ImageData): string` - Compute dHash from Canvas ImageData
  - Resize to 9x8 using a temporary offscreen canvas
  - Convert to grayscale
  - Compare each pixel to right neighbor -> 64-bit hash as hex string
- `hammingDistance(hash1: string, hash2: string): number` - Bit difference between two hashes
- All processing via Canvas API (no external library needed in browser)
- Must handle transparency (alpha channel) -- treat transparent pixels as background color

### hashMatcher.ts:
- `loadHashDatabase(): SpriteHashDB` - Import sprite-hashes.json and build lookup structures
- `findBestMatch(queryHash: string, db: SpriteHashDB, threshold?: number): MatchResult | null`
  - Compare query hash against all DB entries
  - Return best match if hamming distance <= threshold (default: 10)
  - Return null if no match or if best match is ambiguous (2+ items within threshold of each other)
- `SpriteHashDB` type: pre-indexed structure for fast lookup
- Consider chunking the hash DB into a Map for faster comparison

### Types (add to src/types/index.ts or new file):
```typescript
interface SpriteHash { h: string; d: string; n: string }
interface SpriteHashDB { version: number; hashes: SpriteHash[]; hashMap: Map<string, SpriteHash> }
interface MatchResult { hashedId: string; name: string; distance: number; confidence: number }
```

### Performance considerations:
- Hash DB may have ~1200 entries -- brute force comparison is O(n) per slot but fast for 64-bit hashes
- Consider pre-computing binary hash arrays for SIMD-like batch comparison
- Matching ~50 inventory slots against ~1200 items = ~60K comparisons, should be < 100ms

## Acceptance Criteria

- computeDHash produces consistent hashes for same image input
- hammingDistance correctly computes bit differences
- findBestMatch returns correct item for exact hash match
- findBestMatch returns null when no match within threshold
- Unit tests for hash computation and matching
- Works in browser Canvas API (no Node.js dependencies)


## Notes

**2026-04-15T10:30:52Z**

## Iteration: Handle ambiguous items from hash DB (user feedback)

**Change**: The hash DB now includes ALL items, with ambiguous ones flagged via `a: true` and `g: "groupHash"`. The matcher must use these flags.

### Updated SpriteHash type:
```typescript
interface SpriteHash {
  h: string;  // hashedId
  d: string;  // dHash hex
  n: string;  // name
  a?: boolean; // ambiguous sprite (duplicate)
  g?: string;  // duplicate group hash
}
```

### Changes to hashMatcher.ts:

**loadHashDatabase():**
- [x] Still loads all entries from sprite-hashes.json
- [ ] Build a separate Set or Map of ambiguous hashedIds for O(1) lookup
- [ ] Expose the ambiguous set so the UI layer can query it

**findBestMatch():**
- [ ] When the best match is an item with `a: true`, return a result with a new status indicating ambiguity (e.g., `status: 'ambiguous'`) instead of returning null
- [ ] Include the duplicate group info in the result so the UI can show which items collided
- [ ] Still return null only when there is genuinely no match within threshold

### Updated MatchResult type:
```typescript
interface MatchResult {
  hashedId: string;
  name: string;
  distance: number;
  confidence: number;
  status: 'matched' | 'ambiguous' | 'low-confidence';
  duplicateGroup?: string[];  // names of items sharing this sprite
}
```

### Rationale:
By returning ambiguous matches with metadata instead of silently dropping them, the pipeline and UI can inform the user exactly which items were skipped and why.

**2026-04-15T10:44:33Z**

Implementation complete.

Files created:
- src/utils/imageHash.ts — computeDHash(ImageData): string, hammingDistance(hexA, hexB): number. Pure Canvas API, no external deps. Uses same bit-packing as the server-side sharp-based script. Transparency handled by compositing over white before resize.
- src/utils/hashMatcher.ts — loadHashDatabase(), findBestMatch(), getAmbiguousIds(), SpriteHashDB / MatchResult types. Loads sprite-hashes.json, builds hashMap + ambiguousIds Set + duplicateGroupMap. Returns status 'matched' | 'ambiguous' | 'unrecognized'. Ambiguous results include duplicateGroup.
- src/tests/utils/imageHash.test.ts — 16 tests: dHash determinism, all-zeros/all-ones patterns, bit-count, hammingDistance edge cases.
- src/tests/utils/hashMatcher.test.ts — 32 tests: DB loading, exact/nearest-neighbour/ambiguous/unrecognized matching, custom threshold, fixture-data round-trips.

All 791 tests passing (was 743 before, now +48 new tests).

**2026-04-15T19:55:29Z**

SUPERSEDED: dHash matching abandoned due to grayscale formula differences between Sharp and Canvas, scale mismatches, and quantity text noise. Replaced by new ticket for NCC-based template matching. src/utils/imageHash.ts and src/utils/hashMatcher.ts will be rewritten.
